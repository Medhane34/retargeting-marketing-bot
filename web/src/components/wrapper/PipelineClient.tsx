"use client";

import { useEffect, useMemo, useState } from "react";
import { NudgeTemplate, Prospect } from "@/types/sanity.types";
import { DataTable } from "../DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { SearchInput } from "../SearchInput";
import { FilterBar } from "../FilterBar";
import { ActionMenu } from "../ActionMenu";
import { fetchActiveNudgeTemplates } from "@/sanity/fetch";
import { Button } from "@heroui/react";
import { MessageCircle } from "lucide-react";

interface PipelineClientProps {
    data: Prospect[];
}

export default function PipelineClient({ data }: PipelineClientProps) {
    const [globalFilter, setGlobalFilter] = useState("");
    const [activeTemplates, setActiveTemplates] = useState<NudgeTemplate[]>([]);

    // fetch 
    // 2. Fetch them when the component mounts
    useEffect(() => {
        async function loadTemplates() {
            const data = await fetchActiveNudgeTemplates();
            setActiveTemplates(data);
        }
        loadTemplates();
    }, []);
    // Multi-select state: { [columnId]: string[] }
    const [filterState, setFilterState] = useState<Record<string, string[]>>({
        currentStep: [], name: []
    });

    // Helper: Generate unique options for any column dynamically
    const getOptionsForColumn = (columnId: keyof Prospect) =>
        Array.from(new Set(data.map((p) => p[columnId]).filter(Boolean))) as string[];

    const stepOptions = useMemo(() => getOptionsForColumn("currentStep"), [data]);
    const nameOptions = useMemo(() => getOptionsForColumn("name"), [data]);
    // Format columnFilters for TanStack Table
    // TanStack expects: [{ id: "currentStep", value: ["Qualified", "New"] }]
    const columnFilters = useMemo(() => {
        return Object.entries(filterState)
            .filter(([_, values]) => values.length > 0)
            .map(([id, value]) => ({ id, value }));
    }, [filterState]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? "—" : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const uniqueCrmKeys = useMemo(() => {
        const keys = new Set<string>();
        data?.forEach((row) => {
            row.crmData?.forEach((item) => {
                if (item?.key) keys.add(item.key);
            });
        });
        return Array.from(keys);
    }, [data]);

    const formatHeader = (keyName: string) => keyName.charAt(0).toUpperCase() + keyName.slice(1);

    const columns = useMemo<ColumnDef<Prospect, any>[]>(() => [
        { header: "Name", accessorKey: "name" },
        { header: "Phone", accessorKey: "phone" },
        {
            header: "Step",
            accessorKey: "currentStep",
            filterFn: "multiSelect" as any // We will define this in DataTable
        },
        ...uniqueCrmKeys.map((key) => ({
            id: `crm_${key}`,
            header: formatHeader(key),
            accessorFn: (row: Prospect) => row.crmData?.find((item) => item?.key === key)?.value ?? "—",
        })),
        {
            header: "Last Interaction",
            accessorKey: "lastInteraction",
            cell: (info) => formatDate(info.getValue() as string),
        },
        // Add this to your columns array in PipelineClient.tsx
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {/* Telegram Deep-link Button */}
                    {/* Telegram Deep-link using a standard <a> tag wrapper */}
                    <a
                        href={`https://t.me/${row.original.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                        >
                            <MessageCircle size={16} />
                        </Button>
                    </a>
                    {/* Existing Nudge Menu */}
                    <ActionMenu
                        prospectId={row.original._id || ""}
                        prospectName={row.original.name || "Prospect"}
                        templates={activeTemplates}
                    />
                </div>
            ),
        },
    ], [uniqueCrmKeys, activeTemplates]);

    return (
        <div className="space-y-4">
            <div className="flex gap-4 justify-between items-end">
                <FilterBar
                    label="Filter by Step"
                    options={stepOptions}
                    selectedKeys={filterState.currentStep}
                    onSelectionChange={(keys) =>
                        setFilterState((prev) => ({ ...prev, currentStep: keys }))
                    }
                />
                <FilterBar
                    label="Filter by Name"
                    options={nameOptions}
                    selectedKeys={filterState.name}
                    onSelectionChange={(keys) =>
                        setFilterState((prev) => ({ ...prev, name: keys }))
                    }
                    limit={2}
                />


                <SearchInput
                    value={globalFilter}
                    onChange={setGlobalFilter}
                    placeholder="Search name or phone..."
                />

            </div>
            <DataTable
                columns={columns}
                data={data}
                globalFilter={globalFilter}
                columnFilters={columnFilters} // Passing the mapped filters
            />
        </div>
    );
}