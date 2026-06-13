import { NextResponse } from "next/server";
import { client } from "@/sanity/client"; // Ensure this is your configured Sanity client

export async function POST(req: Request) {
    try {
        const { prospectId, templateId, customMessage } = await req.json();

        // 1. Fetch prospect info from Sanity (needed for Name and Telegram ID)
        const prospect = await client.fetch(
            `*[_type == "prospect" && _id == $id][0]`,
            { id: prospectId }
        );

        if (!prospect || !prospect.telegramId) {
            return NextResponse.json({ error: "Prospect or Telegram ID not found" }, { status: 404 });
        }

        // 2. Determine the message body
        let messageText = "";

        if (templateId) {
            const template = await client.fetch(
                `*[_type == "nudgeTemplate" && _id == $id][0]`,
                { id: templateId }
            );
            if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

            // Replace placeholder
            messageText = template.body.replace("{{name}}", prospect.name);
        } else if (customMessage) {
            messageText = customMessage;
        } else {
            return NextResponse.json({ error: "No message content provided" }, { status: 400 });
        }

        // 3. Send to Telegram
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: prospect.telegramId,
                text: messageText,
            }),
        });

        const data = await response.json();

        if (!data.ok) throw new Error(data.description);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}