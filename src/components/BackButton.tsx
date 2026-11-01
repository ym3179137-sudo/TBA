"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ fallbackUrl = "/student", label = "Back" }: { fallbackUrl?: string, label?: string }) {
    const router = useRouter();

    const handleBack = () => {
        // If the user has a history in this tab, go back.
        // Otherwise, push them to the fallback (usually the dashboard).
        if (window.history.length > 2) {
            router.back();
        } else {
            router.push(fallbackUrl);
        }
    };

    return (
        <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-bold transition-colors cursor-pointer"
        >
            <ArrowLeft size={20} /> {label}
        </button>
    );
}