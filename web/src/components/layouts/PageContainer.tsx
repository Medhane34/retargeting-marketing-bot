// src/components/layouts/PageContainer.tsx
import { cn } from "@/lib/cn";
import { ReactNode } from "react";

interface PageContainerProps {
    children: ReactNode;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
    paddingX?: "none" | "sm" | "md" | "lg";
    paddingY?: "none" | "sm" | "md" | "lg" | "xl";
    className?: string;
    as?: "div" | "main" | "section" | "article";
}

export function PageContainer({
    children,
    maxWidth = "lg",
    paddingX = "md",
    paddingY = "lg",
    className,
    as: Component = "div",
}: PageContainerProps) {
    const maxWidthClasses = {
        sm: "max-w-3xl",
        md: "max-w-5xl",
        lg: "max-w-8xl",
        xl: "max-w-screen-3xl",
        full: "max-w-full",
    }[maxWidth];

    const pxClasses = {
        none: "px-0",
        sm: "px-4 sm:px-6",
        md: "px-4 sm:px-6 lg:px-8",
        lg: "px-6 sm:px-10 lg:px-8 xl:px-12",
    }[paddingX];

    const pyClasses = {
        none: "py-0",
        sm: "py-6 sm:py-8",
        md: "py-10 sm:py-12 lg:py-16",
        lg: "py-12 sm:py-16 lg:py-0",
        xl: "py-16 sm:py-20 lg:py-24",
    }[paddingY];

    return (
        <Component className={cn("mx-auto w-full", maxWidthClasses, pxClasses, pyClasses, className)}>
            {children}
        </Component>
    );
}