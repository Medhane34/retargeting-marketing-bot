// schemas/prospect.ts
import { UserIcon } from '@sanity/icons'

export default {
    name: 'prospect',
    title: 'Prospect',
    type: 'document',
    icon: UserIcon,
    fields: [
        {
            name: 'username',
            title: 'Telegram Username',
            type: 'string',
            description: 'The unique Telegram handle of the user.',
        },
        {
            name: 'name',
            title: 'Full Name',
            type: 'string',
            description: 'The name provided by the user during the flow.',
        },
        {
            name: 'phone',
            title: 'Phone Number',
            type: 'string',
            description: 'The contact number provided by the user.',
        },
        {
            name: 'currentStep',
            title: 'Current Step',
            type: 'string',
            description: 'The ID of the bot step the user is currently at in the funnel.',
        },
        {
            name: 'lastInteraction',
            title: 'Last Interaction',
            type: 'datetime',
            description: 'Timestamp of the last message sent or received.',
        },
        {
            name: 'isNudgeSent',
            title: 'Is Nudge Sent',
            type: 'boolean',
            description: 'Set to true if the 24h abandonment reminder has been sent.',
        },
        {
            name: 'crmData',
            title: 'CRM Data',
            type: 'array',
            description:
                'All campaign-specific responses collected by the bot, stored as key → value pairs. ' +
                'Each entry corresponds to a Bot Step with a "Collects Field" value like "crmData.budget". ' +
                'Use the key to identify the field (e.g. "website", "budget") and value for the user\'s answer.',
            of: [
                {
                    type: 'object',
                    name: 'crmEntry',
                    fields: [
                        {
                            name: 'key',
                            title: 'Field',
                            type: 'string',
                            description: 'Machine-readable field name (e.g. "website", "budget", "goal").',
                            readOnly: true,
                        },
                        {
                            name: 'value',
                            title: 'Response',
                            type: 'string',
                            description: 'The answer provided by the prospect.',
                        },
                    ],
                    preview: {
                        select: { title: 'key', subtitle: 'value' },
                        prepare({ title, subtitle }: { title: string; subtitle: string }) {
                            return { title, subtitle };
                        },
                    },
                },
            ],
        },
    ],
}
