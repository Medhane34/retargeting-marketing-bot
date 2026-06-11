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
 * Save a collected field value to the prospect document.
 *
 * - Top-level fields ("name", "phone"): patched directly.
 * - crmData fields ("crmData.website", "crmData.budget"):
 *     upserted into the crmData array — updates if the key exists, appends if new.
 */
async function saveCollectedField(prospectId: string, fieldPath: string, value: string) {
    if (fieldPath.startsWith('crmData.')) {
        const fieldKey = fieldPath.slice('crmData.'.length);

        const doc = await client.fetch(
            `*[_id == $id][0]{ crmData }`,
            { id: prospectId }
        );
        const entries: Array<{ _key: string; key: string; value: string }> =
            doc?.crmData ?? [];
        const existingIndex = entries.findIndex((e) => e.key === fieldKey);

        if (existingIndex >= 0) {
            await client
                .patch(prospectId)
                .set({ [`crmData[${existingIndex}].value`]: value })
                .commit();
        } else {
            await client
                .patch(prospectId)
                .setIfMissing({ crmData: [] })
                .append('crmData', [{ _key: fieldKey, key: fieldKey, value }])
                .commit();
        }
    } else {
        // Top-level field: name, phone, etc.
        await client
            .patch(prospectId)
            .set({ [fieldPath]: value, lastInteraction: new Date().toISOString() })
            .commit();
    }
}

/**
 * Advance a prospect to the next step.
 * If the current step collected a field, saves it first via saveCollectedField.
 */
async function advanceProspect(
    prospectId: string,
    nextStepId: string,
    collectsField?: string,
    collectedValue?: string
) {
    // Save the collected field first (handles both top-level and crmData array)
    if (collectsField && collectedValue !== undefined) {
        await saveCollectedField(prospectId, collectsField, collectedValue);
    }

    // Advance to the next step
    await client
        .patch(prospectId)
        .set({
            currentStep: nextStepId,
            lastInteraction: new Date().toISOString(),
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

// 1. /start — Show the entry step. NO prospect is created here.
//    Prospect creation is deferred until the user confirms by clicking the first button.
//    This filters out accidental /start taps and ensures only intentional leads are stored.
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

    // Just render the entry step — no Sanity write.
    await sendStep(ctx, entryStep);
});

// 2. Inline button clicks — the callback_data IS the nextStepId.
//    LAZY CREATION: if no prospect exists yet, this is the first confirmation click
//    (e.g. the "Yes, I'm interested" button on the entry step). Create the prospect NOW.
bot.on("callback_query:data", async (ctx) => {
    const nextStepId = ctx.callbackQuery.data;
    const username = ctx.from?.username;
    await ctx.answerCallbackQuery();

    if (!username) return;

    const nextStep = await getStepById(nextStepId);
    if (!nextStep) {
        await ctx.reply(
            "⚠️ This step hasn't been configured yet. Please contact support."
        );
        return;
    }

    let prospect = await fetchProspect(username);

    if (!prospect) {
        // First button click — user has confirmed intent. Create the prospect document.
        // client.create() returns the full created document including its _id.
        const newProspect = await client.create({
            _type: "prospect",
            username,
            // Store the numeric Telegram user ID — required for sendMessage API calls.
            // ctx.from.id is always a number; @usernames cannot be used as chat_id.
            telegramChatId: ctx.from!.id,
            currentStep: nextStepId,
            lastInteraction: new Date().toISOString(),
        });

        // Trigger the 24-hour abandonment nudge background job in Inngest.
        await inngest.send({
            name: "user/started-flow",
            data: {
                username: username,
                prospectId: newProspect._id,
                telegramChatId: ctx.from!.id,
            },
        });

    } else {
        // Existing prospect — advance them to the next step.
        await advanceProspect(prospect._id, nextStepId);
    }

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

    const nextStepId = resolveNextStepId(currentStep);
    if (!nextStepId) {
        // Terminal state — save collected data if any, but don't advance
        if (currentStep.collectsField) {
            await saveCollectedField(prospect._id, currentStep.collectsField, text);
        }
        return;
    }

    const nextStep = await getStepById(nextStepId);
    if (!nextStep) return;

    await advanceProspect(prospect._id, nextStepId, currentStep.collectsField, text);
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

    const nextStepId = resolveNextStepId(currentStep);
    if (!nextStepId) {
        // Terminal step — save data and close the keyboard
        await saveCollectedField(prospect._id, phoneField, phone);
        await ctx.reply("Thank you! Your response has been recorded.", {
            reply_markup: { remove_keyboard: true },
        });
        return;
    }

    const nextStep = await getStepById(nextStepId);
    if (!nextStep) return;

    await advanceProspect(prospect._id, nextStepId, phoneField, phone);
    await sendStep(ctx, nextStep);
});

// ─── Bot Description Syncing (with 10-minute cooldown) ─────────────────────────

let lastSyncTime = 0;
const SYNC_COOLDOWN = 10 * 60 * 1000; // 10 minutes

async function syncBotDescriptionIfNeeded() {
    if (Date.now() - lastSyncTime < SYNC_COOLDOWN) return;
    lastSyncTime = Date.now();
    try {
        const entryStep = await getEntryStep();
        if (entryStep?.botDescription) {
            await bot.api.setMyDescription(entryStep.botDescription);
            console.log("Successfully synced bot description with Telegram:", entryStep.botDescription);
        }
    } catch (err) {
        console.error("Failed to sync bot description:", err);
    }
}

// ─── Vercel Export ────────────────────────────────────────────────────────────

const webhookHandler = webhookCallback(bot, "std/http", {
    secretToken: process.env.WEBHOOK_SECRET,
});

export const POST = async (req: Request) => {
    // Sync description periodically (rate-limited to 10 minutes)
    await syncBotDescriptionIfNeeded();
    return webhookHandler(req);
};