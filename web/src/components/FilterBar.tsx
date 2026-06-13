"use client";

import { useState } from "react";

interface FilterBarProps {
    label: string;
    options: string[];
    selectedKeys: string[];
    onSelectionChange: (keys: string[]) => void;
    limit?: number; // New prop to control visibility
}

export function FilterBar({
    label,
    options,
    selectedKeys,
    onSelectionChange,
    limit = 1
}: FilterBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Decide what to show
    const visibleOptions = isExpanded ? options : options.slice(0, limit);
    const showMoreButton = options.length > limit;

    const toggleOption = (option: string) => {
        if (selectedKeys.includes(option)) {
            onSelectionChange(selectedKeys.filter((k) => k !== option));
        } else {
            onSelectionChange([...selectedKeys, option]);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
            <div className="flex flex-wrap gap-2">
                {visibleOptions.map((option) => (
                    <button
                        key={option}
                        onClick={() => toggleOption(option)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${selectedKeys.includes(option)
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                            }`}
                    >
                        {option}
                    </button>
                ))}

                {showMoreButton && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="px-3 py-1 rounded-full text-xs font-medium border border-dashed border-gray-300 text-gray-400 hover:text-blue-600 hover:border-blue-600 transition-colors"
                    >
                        {isExpanded ? "Show Less" : `+${options.length - limit} more`}
                    </button>
                )}
            </div>
        </div>
    );
}