// schemas/botStep.ts
export default {
    name: 'botStep',
    title: 'Bot Step',
    type: 'document',
    fields: [
        {
            name: 'stepId',
            title: 'Step ID',
            type: 'string',
            description: 'Unique internal ID for this step (e.g., "welcome_step").',
        },
        {
            name: 'messageText',
            title: 'Message Text',
            type: 'text',
            description: 'The main message body shown to the user (Markdown supported).',
        },
        {
            name: 'buttons',
            title: 'Inline Buttons',
            type: 'array',
            description: 'Buttons to display below the message text.',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'label', type: 'string', title: 'Button Label' },
                        { name: 'value', type: 'string', title: 'Callback Value' },
                    ],
                },
            ],
        },
        {
            name: 'nextStepId',
            title: 'Next Step ID',
            type: 'string',
            description: 'The Step ID to transition to if no specific button logic is used.',
        },
    ],
};