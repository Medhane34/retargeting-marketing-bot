// src/components/ui/ThemeSwitch.tsx
'use client';

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";


// Refined SVG atoms based on inspirational image
function SunIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
            <path d="M18 5l-1 1M15 8l-1 1" className="opacity-40" />
            <circle cx="19" cy="8" r="0.5" fill="currentColor" />
        </svg>
    );
}

interface ThemeSwitchProps {
    variant?: "pill" | "minimal";
    className?: string;
}

export function ThemeSwitch({ variant = "minimal", className }: ThemeSwitchProps) {
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof document !== "undefined") {
            const htmlEl = document.documentElement;
            const current = htmlEl.getAttribute("data-theme");
            setIsDark(current ? current.includes("dark") : false);
        }
    }, []);

    const toggle = () => {
        const theme = isDark ? "ocean" : "ocean-dark";
        if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-theme", theme);
            try {
                localStorage.setItem("ex-theme", theme);
            } catch {
                // ignore
            }
        }
        setIsDark(!isDark);
    };

    if (!mounted) return variant === "pill" ? <div className="w-[148px] h-10" /> : <div className="w-10 h-10" />;

    if (variant === "minimal") {
        return (
            <button
                onClick={toggle}
                className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full border border-border/40 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-300 shadow-sm overflow-hidden",
                    className
                )}
                aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <m.div
                        key={isDark ? "moon" : "sun"}
                        initial={{ y: 20, opacity: 0, rotate: -45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: 45 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={cn(isDark ? "text-gold" : "text-zinc-950")}
                    >
                        {isDark ? <MoonIcon /> : <SunIcon />}
                    </m.div>
                </AnimatePresence>
            </button>
        );
    }

    // Classic Pill Variant
    return (
        <label onClick={toggle} className={cn("group inline-flex items-center gap-0 cursor-pointer select-none no-underline", className)}>
            <span
                className={cn(
                    'relative flex items-center rounded-full overflow-hidden transition-colors duration-300 border border-transparent',
                    'h-10 w-[148px] px-1 shadow-inner',
                    isDark ? 'bg-zinc-900 border-white/5' : 'bg-[#EBEBEA] border-black/5'
                )}
            >
                <AnimatePresence initial={false}>
                    {!isDark && (
                        <m.span
                            key="day-label"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="absolute left-14 text-[10px] font-bold tracking-[0.12em] uppercase text-zinc-950 pointer-events-none"
                        >
                            DAYMODE
                        </m.span>
                    )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                    {isDark && (
                        <m.span
                            key="night-label"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="absolute right-14 text-[11px] font-bold tracking-[0.12em] uppercase text-white pointer-events-none"
                        >
                            NIGHTMODE
                        </m.span>
                    )}
                </AnimatePresence>

                <m.span
                    animate={{ x: isDark ? 104 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={cn(
                        'flex items-center justify-center',
                        'h-8 w-8 rounded-full shadow-lg transition-colors',
                        isDark ? 'bg-gold text-zinc-950' : 'bg-white text-zinc-950'
                    )}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <m.span
                            key={isDark ? 'moon' : 'sun'}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="flex items-center justify-center"
                        >
                            {isDark ? <MoonIcon /> : <SunIcon />}
                        </m.span>
                    </AnimatePresence>
                </m.span>
            </span>
        </label>
    );
}
