"use client";

import { Prospect } from "@/types/sanity.types";
import { DataTable } from "../DataTable";
import { ColumnDef } from "@tanstack/react-table";

interface PipelineClientProps {
    data: Prospect[];
}

export default function PipelineClient({ data }: PipelineClientProps) {
    // Helper to format Date consistently as "Jun 5, 2026" (using UTC to prevent hydration mismatches)
    const formatDate = (dateString?: string) => {
        if (!dateString) return "—";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "—";
            
            const months = [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ];
            const month = months[date.getUTCMonth()];
            const day = date.getUTCDate();
            const year = date.getUTCFullYear();
            
            return `${month} ${day}, ${year}`;
        } catch {
            return "—";
        }
    };

    // Extract all unique CRM keys from data across all prospects
    const uniqueCrmKeys = Array.from(
        new Set(
            data.flatMap((row) => row.crmData?.map((item) => item.key).filter(Boolean) || [])
        )
    ) as string[];

    // Capitalize and format key name for display header (e.g. "industry" -> "Industry")
    const formatHeader = (keyName: string) => {
        return keyName.charAt(0).toUpperCase() + keyName.slice(1);
    };

    // Define table columns
    const columns: ColumnDef<Prospect, any>[] = [
        { 
            header: "Name", 
            accessorKey: "name" 
        },
        { 
            header: "Phone", 
            accessorKey: "phone" 
        },
        { 
            header: "Step", 
            accessorKey: "currentStep" 
        },
        // Dynamic CRM columns derived from unique keys in crmData arrays
        ...uniqueCrmKeys.map((key) => ({
            id: `crm_${key}`,
            header: formatHeader(key),
            accessorFn: (row: Prospect) => {
                return row.crmData?.find((item) => item.key === key)?.value || "—";
            },
        })),
        // Last Interaction column
        {
            header: "Last Interaction",
            accessorKey: "lastInteraction",
            cell: (info) => formatDate(info.getValue() as string),
        },
    ];

    return <DataTable columns={columns} data={data} />;
}
