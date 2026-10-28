"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinGame() {
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const supabase = createClient();

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        // Check if session exists and is in lobby
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

        // Redirect to the lobby page for this session
        router.push(`/play/${pin}`);
    }

    return (
        <main className="min-h-screen bg-indigo-900 flex items-center justify-center p-4">
            <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center">
                <h1 className="text-4xl font-extrabold text-indigo-900 mb-2">Join Game</h1>
                <p className="text-slate-500 mb-8 font-medium">Enter the PIN from the teacher</p>

                <form onSubmit={handleJoin} className="space-y-6">
                    <input
                        type="text"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="123 456"
                        className="w-full border-4 border-indigo-200 rounded-2xl px-4 py-4 text-center text-4xl tracking-widest font-extrabold text-indigo-900 focus:border-indigo-500 outline-none transition-colors"
                        required
                    />
                    {error && <p className="text-red-500 font-bold">{error}</p>}
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl py-4 rounded-2xl shadow-lg">
                        Join
                    </button>
                </form>
            </div>
        </main>
    );
}