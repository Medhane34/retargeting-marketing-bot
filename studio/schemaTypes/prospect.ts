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
            type: 'object',
            description:
                'Flexible container for all campaign-specific responses collected by the bot. ' +
                'Fields are written dynamically at runtime based on the "Collects Field" setting ' +
                'on each Bot Step (e.g. crmData.budget, crmData.goal, crmData.timeline). ' +
                'Values are readable here via the Sanity API even if not shown in the Studio UI.',
            options: { collapsible: true, collapsed: false },
            fields: [
                {
                    name: 'helper',
                    title: 'Data Info',
                    type: 'string',
                    readOnly: true,
                    initialValue: 'Campaign-specific data is collected and stored here dynamically.',
                    description: 'Fields like budget, goals, or timelines will appear in the API response even if not visible here.',
                },
            ],
        },
    ],
}
