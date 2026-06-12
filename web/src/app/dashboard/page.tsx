import { Suspense } from "react";
import FetchWrapper from "@/components/wrapper/FetchWrapper";

export default function DashboardPage() {
    return (
        <main className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Sales Pipeline</h1>

            <Suspense fallback={<div className="p-4 border rounded animate-pulse bg-gray-50">Loading pipeline...</div>}>
                <FetchWrapper />
            </Suspense>
        </main>
    );
}