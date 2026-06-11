// src/components/motion/AnimatedSection.tsx
"use client";

import { m, HTMLMotionProps } from "framer-motion";

import { staggerContainer, fadeInUp } from "./variants";
import { useSafeVariants } from "./use-reduced-motion";

interface AnimatedSectionProps extends HTMLMotionProps<"section"> {
    children: React.ReactNode;
    stagger?: boolean;
}

export function AnimatedSection({ children, stagger = false, ...props }: AnimatedSectionProps) {
    const variants = useSafeVariants(stagger ? staggerContainer : fadeInUp);

    return (
        <m.section
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
            variants={variants}
            {...props}
        >
            {children}
        </m.section>
    );
}