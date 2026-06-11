// schemas/botStep.ts
import { defineType, defineField, defineArrayMember } from 'sanity'

export default defineType({
    name: 'botStep',
    title: 'Bot Step',
    type: 'document',
    fields: [
        defineField({
            name: 'stepId',
            title: 'Step ID',
            type: 'string',
            description:
                'Unique machine-readable key for this step (e.g. "welcome", "collect_name"). ' +
                'This is used as the state ID in the prospect document.',
            validation: (Rule) =>
                Rule.required()
                    .regex(/^[a-z0-9_]+$/, {
                        name: 'slug',
                        invert: false,
                    })
                    .error('Only lowercase letters, numbers, and underscores are allowed.'),
        }),

        defineField({
            name: 'isEntryPoint',
            title: 'Is Entry Point?',
            type: 'boolean',
            description:
                'Mark true for the step that fires when a user sends /start. ' +
                'Only ONE step should be the entry point at any time.',
            initialValue: false,
        }),

        defineField({
            name: 'botDescription',
            title: 'Bot Description (What can this bot do?)',
            type: 'text',
            rows: 3,
            description:
                'Optional. The description shown to users in Telegram before they start the bot (max 512 characters). ' +
                'This will be synced dynamically when a user triggers /start. Only used if this step is the Entry Point.',
            validation: (Rule) => Rule.max(512),
        }),

        defineField({
            name: 'messageText',
            title: 'Message Text',
            type: 'text',
            rows: 4,
            description: 'The message sent to the user when they arrive at this step.',
            validation: (Rule) => Rule.required(),
        }),

        defineField({
            name: 'parseMode',
            title: 'Message Format',
            type: 'string',
            description: 'Enable rich text formatting. Use Markdown or HTML syntax in the message text.',
            options: {
                list: [
                    { title: 'Plain Text', value: 'none' },
                    { title: 'Markdown', value: 'Markdown' },
                    { title: 'HTML', value: 'HTML' },
                ],
                layout: 'radio',
            },
            initialValue: 'none',
        }),

        defineField({
            name: 'actionType',
            title: 'Special Telegram Action',
            type: 'string',
            description:
                'Attach a special Telegram native keyboard to this step. ' +
                '"Request Phone Number" shows the built-in share-contact button.',
            options: {
                list: [
                    { title: 'None', value: 'none' },
                    { title: 'Request Phone Number', value: 'request_contact' },
                    { title: 'Delay (Typing Animation)', value: 'delay_typing' }, // Add this line
                    { title: 'Auto-Advance to Next Step', value: 'auto_advance' }, // Add this
                ],
                layout: 'radio',
            },
            initialValue: 'none',
        }),

        defineField({
            name: 'collectsField',
            title: 'Collects Field',
            type: 'string',
            description:
                'When set, the user\'s reply (text or contact) is saved to this field on the prospect document. ' +
                'Use top-level names for core data: "name", "phone". ' +
                'Use "crmData.fieldName" for campaign-specific data, e.g. "crmData.budget", "crmData.goal".',
        }),

        defineField({
            name: 'nextStepId',
            title: 'Default Next Step ID',
            type: 'string',
            description:
                'The step to advance to after the user sends a plain text reply or shares a contact ' +
                '(used when no inline buttons are configured).',
        }),

        defineField({
            name: 'buttons',
            title: 'Inline Buttons',
            type: 'array',
            description:
                'Optional inline keyboard buttons displayed below the message. ' +
                'Each button either advances the user to the next step or opens a URL. ' +
                'When buttons are present, the Default Next Step is ignored.',
            of: [
                defineArrayMember({
                    type: 'object',
                    name: 'button',
                    fields: [
                        defineField({
                            name: 'label',
                            type: 'string',
                            title: 'Button Label',
                            description: 'The text displayed on the button.',
                            validation: (Rule) => Rule.required(),
                        }),
                        defineField({
                            name: 'nextStepId',
                            type: 'string',
                            title: 'Next Step ID',
                            description:
                                'The step to navigate to when this button is clicked. ' +
                                'Leave empty if this button opens a URL instead.',
                        }),
                        defineField({
                            name: 'url',
                            type: 'url',
                            title: 'URL (optional)',
                            description:
                                'If set, clicking this button opens the URL in a browser ' +
                                'instead of navigating to a step.',
                        }),
                    ],
                    validation: (Rule) =>
                        Rule.custom((button: any) => {
                            if (!button?.nextStepId && !button?.url) {
                                return 'A button must have either a Next Step ID or a URL.';
                            }
                            if (button?.nextStepId && button?.url) {
                                return 'A button cannot have both a Next Step ID and a URL. Choose one.';
                            }
                            return true;
                        }),
                    preview: {
                        select: {
                            title: 'label',
                            nextStepId: 'nextStepId',
                            url: 'url',
                        },
                        prepare({ title, nextStepId, url }: { title: string; nextStepId?: string; url?: string }) {
                            return {
                                title,
                                subtitle: nextStepId ? `→ ${nextStepId}` : `🔗 ${url}`,
                            };
                        },
                    },
                }),
            ],
        }),
    ],

    preview: {
        select: {
            title: 'stepId',
            subtitle: 'messageText',
            isEntry: 'isEntryPoint',
        },
        prepare({
            title,
            subtitle,
            isEntry,
        }: {
            title: string;
            subtitle: string;
            isEntry: boolean;
        }) {
            return {
                title: isEntry ? `⭐ ${title}` : title,
                subtitle: subtitle?.slice(0, 70),
            };
        },
    },
})