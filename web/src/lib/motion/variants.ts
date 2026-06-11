// src/lib/motion/variants.ts
import { Variants } from "framer-motion";

// Subtle lift and fade for headlines and cards
export const fadeInUp: Variants = {
    initial: { opacity: 0, y: 15 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    },
};

// Orchestrator for lists (Staggering)
export const staggerContainer: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05,
        },
    },
};

// Micro-interactions for buttons/cards
export const subtleHover = { scale: 1.02 };
export const subtleTap = { scale: 0.98 };