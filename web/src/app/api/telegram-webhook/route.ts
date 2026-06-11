import { Bot, webhookCallback } from "grammy";
import { client } from "../../../sanity/client";

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
    await ctx.answerCallbackQuery();

    if (data === "verify_continue") {
        const username = ctx.from.username;
        if (!username) {
            await ctx.reply("Please set a Telegram username to continue.");
            return;
        }

        const existing = await client.fetch(
            `*[_type == "prospect" && username == $username][0]`,
            { username }
        );

        if (!existing) {
            await client.create({
                _type: 'prospect',
                username: username,
                currentStep: 'collect_name',
                lastInteraction: new Date().toISOString()
            });
        } else {
            await client.patch(existing._id)
                .set({ currentStep: 'collect_name' })
                .commit();
        }

        await ctx.reply("Great! What is your full name?");
    }
});

// 3. Handle user text messages
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    const username = ctx.from.username;
    if (!username) return;

    const prospect = await client.fetch(
        `*[_type == "prospect" && username == $username][0]`,
        { username }
    );

    if (!prospect) return;

    if (prospect.currentStep === 'collect_name') {
        // Save Name and trigger Contact Request Button
        await client.patch(prospect._id)
            .set({
                name: text,
                currentStep: 'collect_phone'
            })
            .commit();

        await ctx.reply("Thanks! Now, please share your contact number using the button below.", {
            reply_markup: {
                keyboard: [[{ text: "Share My Phone Number", request_contact: true }]],
                one_time_keyboard: true,
                resize_keyboard: true,
            },
        });
    }
});

// 4. Handle shared contact (The Phone number step)
bot.on("message:contact", async (ctx) => {
    const username = ctx.from.username;
    if (!username) return;

    const prospect = await client.fetch(
        `*[_type == "prospect" && username == $username][0]`,
        { username }
    );

    if (prospect && prospect.currentStep === 'collect_phone') {
        const phone = ctx.message.contact.phone_number;

        // Save Phone and mark complete
        await client.patch(prospect._id)
            .set({
                phone: phone,
                currentStep: 'complete'
            })
            .commit();

        // Remove the keyboard after selection
        await ctx.reply("Perfect! We have your details. A sales rep will contact you soon.", {
            reply_markup: { remove_keyboard: true }
        });
    }
});

// 5. Export for Vercel
export const POST = webhookCallback(bot, "std/http", {
    secretToken: process.env.WEBHOOK_SECRET,
});