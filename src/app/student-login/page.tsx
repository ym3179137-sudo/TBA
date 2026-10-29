"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Smile } from "lucide-react";

export default function StudentLogin() {
    const [name, setName] = useState("");
    const [pin, setPin] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Assuming you have an API route for student login
        const res = await fetch("/api/student-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentName: name, pin }),
        });

        if (res.ok) {
            router.push("/student");
            router.refresh();
        } else {
            const data = await res.json();
            setError(data.error || "Invalid name or PIN");
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden text-slate-200 font-sans p-6">
            {/* Ambient Glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none" />

            <Link href="/sign-in" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium">
                <ArrowLeft size={20} /> Back to Login
            </Link>

            <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-[2rem] shadow-2xl relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border-4 border-emerald-500/30">
                        <Smile className="w-10 h-10 text-emerald-400" />
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold text-white text-center mb-8">Student Login</h1>

                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Select Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full bg-slate-950 border-2 border-slate-700 text-white rounded-2xl px-4 py-4 text-lg font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 transition-all text-center"
                            placeholder="e.g. Leo"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Enter 4-Digit PIN</label>
                        <input
                            type="password"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            required
                            className="w-full bg-slate-950 border-2 border-slate-700 text-white rounded-2xl px-4 py-4 text-3xl tracking-[0.5em] font-extrabold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 transition-all text-center"
                            placeholder="••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xl py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 mt-4"
                    >
                        {loading ? "Loading..." : "Let's Play!"}
                    </button>
                </form>
            </div>
        </div>
    );
}