import { Bot, webhookCallback } from "grammy";
import { client } from "../../../sanity/client";
import { getNextStep } from "../../../lib/transitionEngine";
import validator from "validator";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

bot.command("start", async (ctx) => {
    await ctx.reply("Welcome! Tap 'Continue' to start.", {
        reply_markup: {
            inline_keyboard: [[{ text: "Continue", callback_data: "verify_continue" }]],
        },
    });
});

bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;

    // 1. Acknowledge the callback to stop the loading animation
    await ctx.answerCallbackQuery();

    if (data === "verify_continue") {
        // Check if prospect exists to avoid duplicate creation
        const existing = await client.fetch(
            `*[_type == "prospect" && username == $username][0]`,
            { username: ctx.from.username }
        );

        if (!existing) {
            await client.create({
                _type: 'prospect',
                username: ctx.from?.username || "unknown",
                currentStep: 'collect_name',
                lastInteraction: new Date().toISOString()
            });
        }

        await ctx.reply("Great! What is your full name?");
    }
});

bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    const username = ctx.from.username;

    if (!username) {
        await ctx.reply("I couldn't identify your username. Please ensure your Telegram profile has a username set.");
        return;
    }

    const prospect = await client.fetch(
        `*[_type == "prospect" && username == $username][0]`,
        { username }
    );

    if (!prospect) {
        await ctx.reply("Please start the conversation with /start.");
        return;
    }

    // Validation
    if (prospect.currentStep === 'collect_phone' && !validator.isMobilePhone(text)) {
        await ctx.reply("That doesn't look like a valid phone number. Please try again.");
        return;
    }

    // Logic to advance
    const nextStep = await getNextStep(prospect.currentStep, "");

    await client.patch(prospect._id)
        .set({
            currentStep: nextStep,
            lastInteraction: new Date().toISOString()
        })
        .commit();

    await ctx.reply(`Step updated to ${nextStep}. What's next?`);
});

export const POST = webhookCallback(bot, "std/http", {
    secretToken: process.env.WEBHOOK_SECRET,
});