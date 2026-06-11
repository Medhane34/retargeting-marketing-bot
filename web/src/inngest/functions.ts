// src/inngest/functions.ts
import { inngest } from "@/lib/inngest/client";
import { client } from "@/sanity/client";

export const sendAbandonmentNudge = inngest.createFunction(
    {
        id: "send-abandonment-nudge",
        name: "Send Abandonment Nudge",
        triggers: [{ event: "user/started-flow" }],
    },
    async ({ event, step }) => {
        // Test delay: 2 minutes (Changed from 24h)
        await step.sleep("wait-2-minutes", "2m");

        // Fetch the prospect from Sanity using the username passed in the event
        // Wrapped in step.run for Inngest's durable execution guarantee
        const prospect = await step.run("fetch-prospect", async () => {
            return client.fetch(
                `*[_type == "prospect" && username == $username][0]{
                    _id,
                    currentStep,
                    isNudgeSent
                }`,
                { username: event.data.username }
            );
        });

        // Nudge only if they haven't finished and haven't been nudged yet
        if (prospect && prospect.currentStep !== "complete" && !prospect.isNudgeSent) {
            // Send the Telegram nudge using numeric chat ID
            await step.run("send-nudge", async () => {
                const response = await fetch(
                    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chat_id: event.data.telegramChatId,
                            text: "👋 Hey! We noticed you didn't finish your booking. Want to continue? pick up where you left off whenever you're ready!",
                        }),
                    }
                );

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(`Telegram API error: ${JSON.stringify(err)}`);
                }
            });

            // Mark nudge as sent in Sanity
            await step.run("mark-nudge-sent", async () => {
                await client.patch(prospect._id).set({ isNudgeSent: true }).commit();
            });
        }
    }
);