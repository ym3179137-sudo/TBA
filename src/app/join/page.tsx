"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Gamepad2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function JoinGame() {
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const supabase = createClient();

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        const { data: session, error } = await supabase
            .from("game_sessions")
            .select("id, status")
            .eq("pin", pin)
            .single();

        if (error || !session) {
            setError("Invalid Game PIN. Try again.");
            return;
        }
        if (session.status !== 'lobby') {
            setError("This game has already started!");
            return;
        }
        router.push(`/play/${pin}`);
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

            <Link href="/student" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold">
                <ArrowLeft size={20} /> Back to Dashboard
            </Link>

            <div className="bg-slate-900/80 border border-slate-700 p-10 rounded-[2rem] shadow-2xl w-full max-w-md text-center backdrop-blur-xl relative z-10">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/50">
                    <Gamepad2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h1 className="text-3xl font-extrabold text-white mb-2">Join Arena</h1>
                <p className="text-slate-400 mb-8 font-medium">Enter the Game PIN from your teacher</p>

                <form onSubmit={handleJoin} className="space-y-6">
                    <input
                        type="text"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="123456"
                        className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-4 text-center text-4xl tracking-widest font-extrabold text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                        required
                    />
                    {error && <p className="text-red-400 font-bold bg-red-500/10 p-2 rounded-lg">{error}</p>}
                    <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xl py-4 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all">
                        Join Game
                    </button>
                </form>
            </div>
        </div>
    );
}