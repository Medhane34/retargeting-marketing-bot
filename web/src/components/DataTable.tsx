"use client";

import { useState } from "react";
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    getFilteredRowModel,
    SortingState,
    ColumnFiltersState,
    ColumnDef,
    FilterFn,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    globalFilter: string; // New prop for search
    columnFilters: ColumnFiltersState;
}

const multiSelectFilter: FilterFn<any> = (row, id, filterValue: string[]) => {
    if (!filterValue || filterValue.length === 0) return true;
    return filterValue.includes(row.getValue(id));
};


export function DataTable<TData, TValue>({
    data,
    columns,
    globalFilter, // Receive search term
    columnFilters, // 1. Use the prop here
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        filterFns: {
            multiSelect: multiSelectFilter, // Register it here
        },
        onSortingChange: setSorting,
        // Global Filter Logic
        state: {
            sorting,
            columnFilters,
            globalFilter
        },
        globalFilterFn: (row, columnId, filterValue,) => {
            const name = (row.getValue("name") as string) || "";
            const phone = (row.getValue("phone") as string) || "";
            const search = filterValue.toLowerCase();
            return name.toLowerCase().includes(search) || phone.toLowerCase().includes(search);
            return (
                name.toLowerCase().includes(search) ||
                phone.toLowerCase().includes(search)
            );
        },
    });

    return (
        <div className="rounded-md border p-4 shadow-sm">
            <table className="w-full text-sm">
                <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b">
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className="p-3 text-left cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={header.column.getToggleSortingHandler()}
                                >
                                    <div className="flex items-center gap-2">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className="border-b hover:bg-gray-50">
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="p-3">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="h-24 text-center text-gray-500">
                                No prospects found matching your search.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}