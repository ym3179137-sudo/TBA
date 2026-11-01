"use client";

import { ArrowLeft } from "lucide-react";

export default function BackButton({ fallbackUrl = "/teacher", label = "Back" }: { fallbackUrl?: string, label?: string }) {
    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        if (window.history.length > 2) {
            window.history.back();
        } else {
            window.location.href = fallbackUrl;
        }
    };

    return (
        <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-bold transition-all bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-600 cursor-pointer active:scale-95"
        >
            <ArrowLeft size={20} /> {label}
        </button>
    );
}