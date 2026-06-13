"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent, PopoverDialog, Button } from "@heroui/react";
import { Send, Plus, MessageCircle } from "lucide-react";
import { NudgeTemplate } from "@/types/sanity.types";

export interface ActionMenuProps {
    prospectId: string;
    prospectName: string;
    templates: NudgeTemplate[];
}

export function ActionMenu({ prospectId, prospectName, templates }: ActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCustom, setIsCustom] = useState(false);
    const [customMsg, setCustomMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = async (templateId?: string, message?: string) => {
        setLoading(true);
        try {
            await fetch("/api/nudge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prospectId, templateId, customMessage: message }),
            });
        } catch (error) {
            console.error("Failed to send nudge:", error);
        } finally {
            setLoading(false);
            setIsOpen(false);
            setIsCustom(false);
            setCustomMsg("");
        }
    };

    return (
        <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger>

                <Button size="sm" isIconOnly >
                    <Send size={16} />
                </Button>

            </PopoverTrigger>
            <PopoverContent>
                <PopoverDialog className="p-4 w-72 flex flex-col gap-3">
                    <h4 className="font-bold text-sm">Send Nudge to {prospectName}</h4>

                    {!isCustom ? (
                        <div className="flex flex-col gap-2">
                            {templates && templates.length > 0 ? (
                                templates.map((t) => (
                                    <Button key={t._id} size="sm" onPress={() => handleSend(t._id)}>
                                        {t.title}
                                    </Button>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500 italic">No active templates found.</p>
                            )}
                            <Button size="sm" onPress={() => setIsCustom(true)}>
                                <Plus size={14} className="mr-2" /> Custom Message
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <textarea
                                value={customMsg}
                                onChange={(e) => setCustomMsg(e.target.value)}
                                placeholder="Write your custom nudge..."
                                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80px]"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onPress={() => setIsCustom(false)}>
                                    Back
                                </Button>
                                <Button

                                    size="sm"
                                    onPress={() => handleSend(undefined, customMsg)}
                                    isDisabled={loading || !customMsg.trim()}
                                >
                                    {loading ? "Sending..." : "Send Custom"}
                                </Button>
                            </div>
                        </div>
                    )}
                </PopoverDialog>
            </PopoverContent>
        </Popover>
    );
}