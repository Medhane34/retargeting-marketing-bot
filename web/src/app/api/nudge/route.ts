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
        if (!prospect || !prospect.telegramChatId) {
            console.error("Missing ID for prospect:", prospect);
            return NextResponse.json({ error: "Prospect or Telegram ID not found" }, { status: 404 });
        }

        // 2. Determine the message body
        let messageText = "";

        if (templateId) {
            const template = await client.fetch(
                `*[_type == "nudgeTemplate" && _id == $id][0]`,
                { id: templateId }
            );

            // Check if template exists
            if (!template) {
                return NextResponse.json({ error: "Template not found" }, { status: 404 });
            }

            // Check if body exists and is a string
            if (!template.messageBody || typeof template.messageBody !== 'string') {
                console.error("Template body is missing or invalid for ID:", templateId);
                return NextResponse.json({ error: "Template body is empty" }, { status: 400 });
            }

            // Safely replace, using a fallback for name just in case
            const safeName = prospect.name || "Customer";
            messageText = template.messageBody.replace(/{name}/g, safeName);

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
                chat_id: prospect.telegramChatId,
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