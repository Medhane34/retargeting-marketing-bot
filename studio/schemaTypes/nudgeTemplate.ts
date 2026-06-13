import { defineField, defineType } from 'sanity';

export const nudgeTemplate = defineType({
    name: 'nudgeTemplate',
    title: 'Nudge Templates',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Internal Title',
            type: 'string',
            description: 'e.g., "24h Follow-up - Standard"',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'category',
            title: 'Category',
            type: 'string',
            options: {
                list: [
                    { title: '24 Hour', value: '24h' },
                    { title: '72 Hour', value: '72h' },
                    { title: 'One Week', value: '7d' },
                    { title: 'General', value: 'general' },
                ],
            },
        }),
        defineField({
            name: 'messageBody',
            title: 'Message Body',
            type: 'text',
            description: 'Use {name} as a placeholder for the prospect’s name.',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'isActive',
            title: 'Is Active',
            type: 'boolean',
            initialValue: true,
            description: 'If disabled, this template will not appear in the CRM action menu.',
        }),
    ],

    preview: {
        select: {
            title: 'title',
            subtitle: 'category',
        },
    },
});