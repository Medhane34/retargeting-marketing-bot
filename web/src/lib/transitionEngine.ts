import { client } from "@/sanity/client"; // Updated import path

export async function getNextStep(currentStepId: string, input: string) {
    // Fetch the current step configuration from your Sanity setup
    const step = await client.fetch(
        `*[_type == "botStep" && stepId == $id][0]`,
        { id: currentStepId }
    );

    // If input (button value) exists, use it, otherwise fallback to CMS default
    return input || step?.nextStepId || "default_fallback";
}