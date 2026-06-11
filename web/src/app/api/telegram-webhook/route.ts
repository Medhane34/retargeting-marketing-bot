import { Bot, webhookCallback } from "grammy";
import { client } from "../../../sanity/client";
import { getNextStep } from "../../../lib/transitionEngine";
import validator from "validator";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

// 1. Handle /start command
bot.command("start", async (ctx) => {
    await ctx.reply("Welcome! Tap 'Continue' to start.", {
        reply_markup: {
            inline_keyboard: [[{ text: "Continue", callback_data: "verify_continue" }]],
        },
    });
});

// 2. Handle button clicks
bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;

    // Always acknowledge callback to stop Telegram's loading animation
    await ctx.answerCallbackQuery();

    if (data === "verify_continue") {
        const username = ctx.from.username;

        if (!username) {
            await ctx.reply("Please set a Telegram username in your profile to continue.");
            return;
        }

        // Check for existing prospect
        const existing = await client.fetch(
            `*[_type == "prospect" && username == $username][0]`,
            { username }
        );

        if (!existing) {
            await client.create({
                _type: 'prospect',
                username: username,
                currentStep: 'collect_name', // Start the flow here
                lastInteraction: new Date().toISOString()
            });
        } else {
            // Reset existing prospect to start of flow
            await client.patch(existing._id)
                .set({ currentStep: 'collect_name' })
                .commit();
        }

        await ctx.reply("Great! What is your full name?");
    }
});

// 3. Handle user text messages (The State Machine)
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    const username = ctx.from.username;

    if (!username) return;

    // Fetch current state
    const prospect = await client.fetch(
        `*[_type == "prospect" && username == $username][0]`,
        { username }
    );

    if (!prospect) {
        await ctx.reply("Please start the conversation with /start.");
        return;
    }

    // Logic: Transition based on current step
    switch (prospect.currentStep) {

        case 'collect_name':
            // Save name, move to phone
            await client.patch(prospect._id)
                .set({
                    name: text,
                    currentStep: 'collect_phone'
                })
                .commit();
            await ctx.reply("Thanks! Now, please provide your phone number.");
            break;

        case 'collect_phone':
            // Validate phone
            if (!validator.isMobilePhone(text)) {
                await ctx.reply("That doesn't look like a valid phone number. Please try again.");
            } else {
                // Save phone, mark complete
                await client.patch(prospect._id)
                    .set({
                        phone: text,
                        currentStep: 'complete'
                    })
                    .commit();
                await ctx.reply("Perfect! We have your details. A sales rep will contact you soon.");
            }
            break;

        default:
            await ctx.reply("I'm not sure what to do next. Type /start to restart.");
            break;
    }
});

// 4. Export the handler for Vercel
export const POST = webhookCallback(bot, "std/http", {
    secretToken: process.env.WEBHOOK_SECRET,
});