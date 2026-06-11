import { Bot, Context, webhookCallback } from "grammy";
import { client } from "../../../sanity/client";
import {
    getEntryStep,
    getStepById,
    resolveNextStepId,
    type BotStep,
} from "@/lib/transitionEngine";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

// ─── Prospect Helpers ─────────────────────────────────────────────────────────

/** Fetch a prospect document by Telegram username. */
async function fetchProspect(username: string) {
    return client.fetch(
        `*[_type == "prospect" && username == $username][0]`,
        { username }
    );
}

/**
 * Create a new prospect or update their currentStep.
 * Always updates lastInteraction timestamp.
 */
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

/**
 * Advance a prospect to the next step and update lastInteraction.
 * Accepts any extra fields to patch at the same time (e.g. name, crmData.budget).
 */
async function advanceProspect(
    prospectId: string,
    nextStepId: string,
    extraFields: Record<string, string> = {}
) {
    await client
        .patch(prospectId)
        .set({
            currentStep: nextStepId,
            lastInteraction: new Date().toISOString(),
            ...extraFields,
        })
        .commit();
}

// ─── Telegram Renderer ────────────────────────────────────────────────────────

/**
 * Render a BotStep document as a Telegram message.
 *
 * Rendering rules (in priority order):
 *  1. step.buttons  → inline_keyboard
 *  2. actionType === "request_contact" → native phone-share keyboard
 *  3. Everything else → plain text reply (keyboard removed if previously shown)
 */
async function sendStep(ctx: Context, step: BotStep) {
    const parse_mode =
        step.parseMode && step.parseMode !== "none"
            ? (step.parseMode as "Markdown" | "HTML")
            : undefined;

    // 1. Inline keyboard buttons
    if (step.buttons?.length) {
        const inline_keyboard = [
            step.buttons.map((btn) =>
                btn.url
                    ? { text: btn.label, url: btn.url }
                    : { text: btn.label, callback_data: btn.nextStepId! }
            ),
        ];
        await ctx.reply(step.messageText, {
            parse_mode,
            reply_markup: { inline_keyboard },
        });
        return;
    }

    // 2. Native phone-share keyboard
    if (step.actionType === "request_contact") {
        await ctx.reply(step.messageText, {
            parse_mode,
            reply_markup: {
                keyboard: [[{ text: "📱 Share My Phone Number", request_contact: true }]],
                one_time_keyboard: true,
                resize_keyboard: true,
            },
        });
        return;
    }

    // 3. Plain text (also removes any previous reply keyboard)
    await ctx.reply(step.messageText, {
        parse_mode,
        reply_markup: { remove_keyboard: true },
    });
}

// ─── Bot Handlers ─────────────────────────────────────────────────────────────

// 1. /start — Load the entry step from Sanity and begin the flow
bot.command("start", async (ctx) => {
    const username = ctx.from?.username;
    if (!username) {
        await ctx.reply(
            "Please set a Telegram username in your account settings to use this bot."
        );
        return;
    }

    const entryStep = await getEntryStep();
    if (!entryStep) {
        await ctx.reply(
            "This bot hasn't been configured yet. Please check back soon."
        );
        return;
    }

    await upsertProspect(username, entryStep.stepId);
    await sendStep(ctx, entryStep);
});

// 2. Inline button clicks — the callback_data IS the nextStepId
bot.on("callback_query:data", async (ctx) => {
    const nextStepId = ctx.callbackQuery.data;
    const username = ctx.from?.username;
    await ctx.answerCallbackQuery();

    if (!username) return;

    const prospect = await fetchProspect(username);
    if (!prospect) return;

    const nextStep = await getStepById(nextStepId);
    if (!nextStep) {
        await ctx.reply(
            "⚠️ This step hasn't been configured yet. Please contact support."
        );
        return;
    }

    await advanceProspect(prospect._id, nextStepId);
    await sendStep(ctx, nextStep);
});

// 3. Text message — save collected data, then advance to the next step
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    const username = ctx.from?.username;
    if (!username) return;

    const prospect = await fetchProspect(username);
    if (!prospect) return;

    const currentStep = await getStepById(prospect.currentStep);
    if (!currentStep) return;

    // Determine what extra fields to patch alongside currentStep
    const extraFields: Record<string, string> = {};
    if (currentStep.collectsField) {
        extraFields[currentStep.collectsField] = text;
    }

    const nextStepId = resolveNextStepId(currentStep);
    if (!nextStepId) {
        // No next step defined — the user has reached a terminal state.
        // Save collected data but do nothing else.
        if (Object.keys(extraFields).length) {
            await client.patch(prospect._id).set(extraFields).commit();
        }
        return;
    }

    const nextStep = await getStepById(nextStepId);
    if (!nextStep) return;

    await advanceProspect(prospect._id, nextStepId, extraFields);
    await sendStep(ctx, nextStep);
});

// 4. Shared contact (phone number) — save phone, then advance
bot.on("message:contact", async (ctx) => {
    const username = ctx.from?.username;
    if (!username) return;

    const prospect = await fetchProspect(username);
    if (!prospect) return;

    const currentStep = await getStepById(prospect.currentStep);
    // Only process if the current step expects a contact
    if (!currentStep || currentStep.actionType !== "request_contact") return;

    const phone = ctx.message.contact.phone_number;

    // Save to the collectsField if defined, otherwise default to top-level "phone"
    const phoneField = currentStep.collectsField ?? "phone";
    const extraFields: Record<string, string> = { [phoneField]: phone };

    const nextStepId = resolveNextStepId(currentStep);
    if (!nextStepId) {
        // Terminal step — save data and close the keyboard
        await client
            .patch(prospect._id)
            .set({ ...extraFields, lastInteraction: new Date().toISOString() })
            .commit();
        await ctx.reply("Thank you! Your response has been recorded.", {
            reply_markup: { remove_keyboard: true },
        });
        return;
    }

    const nextStep = await getStepById(nextStepId);
    if (!nextStep) return;

    await advanceProspect(prospect._id, nextStepId, extraFields);
    await sendStep(ctx, nextStep);
});

// ─── Vercel Export ────────────────────────────────────────────────────────────

export const POST = webhookCallback(bot, "std/http", {
    secretToken: process.env.WEBHOOK_SECRET,
});