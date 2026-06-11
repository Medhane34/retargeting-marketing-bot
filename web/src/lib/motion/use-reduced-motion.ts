// src/lib/motion/use-reduced-motion.ts
"use client";

import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/**
 * A hook that returns a simplified version of variants if the user 
 * prefers reduced motion.
 */
export function useSafeVariants(variants: any) {
    const shouldReduce = useFramerReducedMotion();

    if (!shouldReduce) return variants;

    // Logic to strip x, y, and scale while keeping opacity
    const reducedVariants = JSON.parse(JSON.stringify(variants));
    Object.keys(reducedVariants).forEach((key) => {
        if (reducedVariants[key].initial) {
            delete reducedVariants[key].initial.y;
            delete reducedVariants[key].initial.x;
            delete reducedVariants[key].initial.scale;
        }
        if (reducedVariants[key].animate) {
            delete reducedVariants[key].animate.y;
            delete reducedVariants[key].animate.x;
            delete reducedVariants[key].animate.scale;
        }
    });

    return reducedVariants;
}