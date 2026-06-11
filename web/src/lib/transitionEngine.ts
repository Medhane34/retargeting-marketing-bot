import { client } from "@/sanity/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BotButton {
    label: string;
    nextStepId?: string;
    url?: string;
}

export interface BotStep {
    _id: string;
    stepId: string;
    messageText: string;
    parseMode?: 'none' | 'Markdown' | 'HTML';
    actionType?: 'none' | 'request_contact';
    /** Dot-notation path on the prospect doc to save the user's reply into.
     *  e.g. "name", "phone", "crmData.budget", "crmData.goal" */
    collectsField?: string;
    /** Default next step when no inline button is clicked (text-reply flow). */
    nextStepId?: string;
    isEntryPoint?: boolean;
    buttons?: BotButton[];
}

// ─── GROQ Projection ──────────────────────────────────────────────────────────

const STEP_PROJECTION = `{
  _id,
  stepId,
  messageText,
  parseMode,
  actionType,
  collectsField,
  nextStepId,
  isEntryPoint,
  buttons[] {
    label,
    nextStepId,
    url
  }
}`;

// ─── Fetchers ─────────────────────────────────────────────────────────────────

/** Fetch the step marked as the flow entry point (fired by /start). */
export async function getEntryStep(): Promise<BotStep | null> {
    return client.fetch(
        `*[_type == "botStep" && isEntryPoint == true][0] ${STEP_PROJECTION}`
    );
}

/** Fetch any step by its machine-readable stepId. */
export async function getStepById(stepId: string): Promise<BotStep | null> {
    if (!stepId) return null;
    return client.fetch(
        `*[_type == "botStep" && stepId == $stepId][0] ${STEP_PROJECTION}`,
        { stepId }
    );
}

// ─── Transition Logic ─────────────────────────────────────────────────────────

/**
 * Determine the next stepId given the current step and an optional
 * callback value from an inline button click.
 *
 * Priority:
 *  1. Button click → the button's nextStepId
 *  2. Step's default nextStepId (text-reply / contact flow)
 *  3. null (terminal state — no further step defined)
 */
export function resolveNextStepId(
    step: BotStep,
    buttonCallbackData?: string
): string | null {
    if (buttonCallbackData && step.buttons?.length) {
        const btn = step.buttons.find((b) => b.nextStepId === buttonCallbackData);
        if (btn?.nextStepId) return btn.nextStepId;
    }
    return step.nextStepId ?? null;
}