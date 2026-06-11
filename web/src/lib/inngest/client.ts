// web/src/lib/inngest/client.ts
import { Inngest } from "inngest";

export const inngest = new Inngest({
    id: "marketing-bot-project",
    eventKey: process.env.INNGEST_EVENT_KEY
});