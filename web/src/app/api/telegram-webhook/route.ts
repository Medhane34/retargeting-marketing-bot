import { Bot, Context, webhookCallback } from "grammy";
import { client } from "../../../sanity/client";
import { inngest } from "@/lib/inngest/client";
import {
    getEntryStep,
    getStepById,
    resolveNextStepId,
    type BotStep,
} from "@/lib/transitionEngine";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

// ─── Helper Functions ─────────────────────────────────────────────────────────

/** Fetch a prospect document by Telegram username. */
async function fetchProspect(username: string) {
    return client.fetch(
        `*[_type == "prospect" && username == $username][0]`,
        { username }
    );
}

/** * Checks if a step has a delay action. 
 * Shows "typing..." and pauses to simulate work.
 */
async function handleDelayIfNeeded(ctx: Context, step: BotStep) {
    if ((step.actionType as string) === 'delay_typing') {
        await ctx.replyWithChatAction("typing");
        await new Promise((resolve) => setTimeout(resolve, 3500));
    }
}

/**
 * If the step has an "auto_advance" action, wait 2 seconds and 
 * automatically trigger the next step without user input.
 */
async function handleAutoAdvance(ctx: Context, step: BotStep, prospectId: string) {
    if ((step.actionType as string) === 'auto_advance') {
        const nextStepId = resolveNextStepId(step);

        if (nextStepId) {
            // Wait 2 seconds so the user can read the auto-advance message
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const nextStep = await getStepById(nextStepId);
            if (nextStep) {
                // Advance the state in Sanity
                await advanceProspect(prospectId, nextStepId);
                // Send the next step
                await sendStep(ctx, nextStep);

                // Recursively check if the NEXT step is also an auto_advance
                await handleAutoAdvance(ctx, nextStep, prospectId);
            }
        }
    }
}

/** Create a new prospect or update their currentStep. */
async function upsertProspect(username: string, stepId: string) {
    const existing = await fetchProspect(username);

    if (!existing) {
        await client.create({
            _type: "prospect",
            username,
            currentStep: stepId,
            lastInteraction: new Date().toISOString(),
        });
    } else {
        await client.patch(existing._id)
            .set({
                currentStep: stepId,
                lastInteraction: new Date().toISOString(),
            })
            .commit();
    }
    return existing;
}

/** Save a collected field value to the prospect document. */
async function saveCollectedField(prospectId: string, fieldPath: string, value: string) {
    if (fieldPath.startsWith('crmData.')) {
        const fieldKey = fieldPath.slice('crmData.'.length);
        const doc = await client.fetch(`*[_id == $id][0]{ crmData }`, { id: prospectId });
        const entries: Array<{ _key: string; key: string; value: string }> = doc?.crmData ?? [];
        const existingIndex = entries.findIndex((e) => e.key === fieldKey);

        if (existingIndex >= 0) {
            await client.patch(prospectId).set({ [`crmData[${existingIndex}].value`]: value }).commit();
        } else {
            await client.patch(prospectId).setIfMissing({ crmData: [] }).append('crmData', [{ _key: fieldKey, key: fieldKey, value }]).commit();
        }
    } else {
        await client.patch(prospectId).set({ [fieldPath]: value, lastInteraction: new Date().toISOString() }).commit();
    }
}

/** Advance a prospect to the next step. */
async function advanceProspect(prospectId: string, nextStepId: string, collectsField?: string, collectedValue?: string) {
    if (collectsField && collectedValue !== undefined) {
        await saveCollectedField(prospectId, collectsField, collectedValue);
    }
    await client.patch(prospectId).set({
        currentStep: nextStepId,
        lastInteraction: new Date().toISOString(),
    }).commit();
}

// ─── Telegram Renderer ────────────────────────────────────────────────────────

/** Render a BotStep document as a Telegram message. */
async function sendStep(ctx: Context, step: BotStep) {
    const parse_mode = step.parseMode && step.parseMode !== "none" ? (step.parseMode as "Markdown" | "HTML") : undefined;

    if (step.buttons?.length) {
        const inline_keyboard = [
            step.buttons.map((btn) =>
                btn.url ? { text: btn.label, url: btn.url } : { text: btn.label, callback_data: btn.nextStepId! }
            ),
        ];
        await ctx.reply(step.messageText, { parse_mode, reply_markup: { inline_keyboard } });
        return;
    }

    if (step.actionType === "request_contact") {
        await ctx.reply(step.messageText, {
            parse_mode,
            reply_markup: {
                keyboard: [[{ text: "📱 ስልክ ቁጥሬን ላጋራ", request_contact: true }]],
                one_time_keyboard: true,
                resize_keyboard: true,
            },
        });
        return;
    }

    await ctx.reply(step.messageText, { parse_mode, reply_markup: { remove_keyboard: true } });
}

// ─── Bot Handlers ─────────────────────────────────────────────────────────────

// 1. Start Command
bot.command("start", async (ctx) => {
    const username = ctx.from?.username;
    if (!username) return await ctx.reply("Please set a username.");

    const entryStep = await getEntryStep();
    if (!entryStep) return await ctx.reply("Bot not configured.");

    await handleDelayIfNeeded(ctx, entryStep);
    await sendStep(ctx, entryStep);
    // Note: No handleAutoAdvance here as the prospect doesn't exist yet
});

// 2. Button clicks (Callback Queries)
bot.on("callback_query:data", async (ctx) => {
    const nextStepId = ctx.callbackQuery.data;
    const username = ctx.from?.username;
    await ctx.answerCallbackQuery();

    if (!username) return;

    const nextStep = await getStepById(nextStepId);
    if (!nextStep) return;

    let prospect = await fetchProspect(username);

    if (!prospect) {
        const newProspect = await client.create({
            _type: "prospect",
            username,
            telegramChatId: ctx.from!.id,
            currentStep: nextStepId,
            lastInteraction: new Date().toISOString(),
        });

        await inngest.send({
            name: "user/started-flow",
            data: { username, prospectId: newProspect._id, telegramChatId: ctx.from!.id },
        });
        prospect = newProspect;
    } else {
        await advanceProspect(prospect._id, nextStepId);
    }

    await handleDelayIfNeeded(ctx, nextStep);
    await sendStep(ctx, nextStep);
    await handleAutoAdvance(ctx, nextStep, prospect._id);
});

// 3. Text messages (Collecting Data)
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    const username = ctx.from?.username;
    if (!username) return;

    const prospect = await fetchProspect(username);
    if (!prospect) return;

    const currentStep = await getStepById(prospect.currentStep);
    if (!currentStep) return;

    const nextStepId = resolveNextStepId(currentStep);
    if (!nextStepId) {
        if (currentStep.collectsField) await saveCollectedField(prospect._id, currentStep.collectsField, text);
        return;
    }

    const nextStep = await getStepById(nextStepId);
    if (!nextStep) return;

    await advanceProspect(prospect._id, nextStepId, currentStep.collectsField, text);
    await handleDelayIfNeeded(ctx, nextStep);
    await sendStep(ctx, nextStep);
    await handleAutoAdvance(ctx, nextStep, prospect._id);
});

// 4. Shared contact (Phone number)
bot.on("message:contact", async (ctx) => {
    const username = ctx.from?.username;
    if (!username) return;

    const prospect = await fetchProspect(username);
    if (!prospect) return;

    const currentStep = await getStepById(prospect.currentStep);
    if (!currentStep || currentStep.actionType !== "request_contact") return;

    const phone = ctx.message.contact.phone_number;
    const phoneField = currentStep.collectsField ?? "phone";

    const nextStepId = resolveNextStepId(currentStep);
    if (!nextStepId) {
        await saveCollectedField(prospect._id, phoneField, phone);
        await ctx.reply("Thank you! Your response has been recorded.", { reply_markup: { remove_keyboard: true } });
        return;
    }

    const nextStep = await getStepById(nextStepId);
    if (!nextStep) return;

    await advanceProspect(prospect._id, nextStepId, phoneField, phone);
    await handleDelayIfNeeded(ctx, nextStep);
    await sendStep(ctx, nextStep);
    await handleAutoAdvance(ctx, nextStep, prospect._id);
});

// ─── Bot Description Syncing ──────────────────────────────────────────────────

let lastSyncTime = 0;
const SYNC_COOLDOWN = 10 * 60 * 1000;

async function syncBotDescriptionIfNeeded() {
    if (Date.now() - lastSyncTime < SYNC_COOLDOWN) return;
    lastSyncTime = Date.now();
    try {
        const entryStep = await getEntryStep();
        if (entryStep?.botDescription) {
            await bot.api.setMyDescription(entryStep.botDescription);
        }
    } catch (err) {
        console.error("Failed to sync description:", err);
    }
}

// ─── Vercel Export ────────────────────────────────────────────────────────────

const webhookHandler = webhookCallback(bot, "std/http", {
    secretToken: process.env.WEBHOOK_SECRET,
});

export const POST = async (req: Request) => {
    await syncBotDescriptionIfNeeded();
    return webhookHandler(req);
};