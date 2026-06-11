// src/app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { sendAbandonmentNudge } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [sendAbandonmentNudge],
});