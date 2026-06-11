import { Bot, webhookCallback } from "grammy";
import { client } from "@/sanity/client";
import { getNextStep } from "@/lib/transitionEngine";
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

    if (data === "verify_continue") {
        // Provisioning: Create record in Sanity
        await client.create({
            _type: 'prospect',
            username: ctx.from?.username || "unknown",
            currentStep: 'collect_name',
            lastInteraction: new Date().toISOString()
        });

        await ctx.reply("Great! What is your full name?");
    }
});

bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;

    // 1. Fetch current prospect and their step from Sanity
    const prospect = await client.fetch(
        `*[_type == "prospect" && username == $username][0]`,
        { username: ctx.from.username }
    );

    if (!prospect) return;

    // 2. Conditional Validation based on currentStep
    if (prospect.currentStep === 'collect_phone') {
        // Using validator to ensure it's a mobile phone number
        if (!validator.isMobilePhone(text)) {
            await ctx.reply("That doesn't look like a valid phone number. Please try again.");
            return; // Stop here, don't advance the step
        }
    }

    // 3. Logic to advance to next step
    const nextStep = await getNextStep(prospect.currentStep, "");

    await client.patch(prospect._id)
        .set({ currentStep: nextStep, lastInteraction: new Date().toISOString() })
        .commit();

    await ctx.reply(`Step updated to ${nextStep}. What's next?`);
});

export const POST = webhookCallback(bot, "std/http", {
    secretToken: process.env.WEBHOOK_SECRET,
});