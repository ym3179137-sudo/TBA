"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Crown, Medal, ArrowLeft, Loader2 } from "lucide-react";

export default function GameHost({ params }: { params: { pin: string } }) {
    const router = useRouter();
    const supabase = createClient();
    const [scores, setScores] = useState<any[]>([]);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        // Fetch scores in real-time as students play
        const channel = supabase.channel(`scores-${params.pin}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'game_results',
                filter: `game_pin=eq.${params.pin}`
            }, (payload) => {
                setScores(prev => [...prev, payload.new].sort((a, b) => b.score - a.score));
            })
            .subscribe();

        // Optional: Listen to game_session to see if the game was ended
        const sessionChannel = supabase.channel(`session-${params.pin}`)
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `pin=eq.${params.pin}`
            }, (payload) => {
                if (payload.new.status === 'finished') setIsFinished(true);
            }).subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(sessionChannel);
        };
    }, [params.pin, supabase]);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans flex flex-col items-center">
            <button onClick={() => router.push('/teacher/arena')} className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white font-bold bg-slate-900 px-5 py-2.5 rounded-xl">
                <ArrowLeft size={20} /> Exit Game
            </button>

            <div className="w-full max-w-4xl mt-12">
                <h1 className="text-4xl font-black text-center mb-2">Live Leaderboard</h1>
                <p className="text-slate-400 text-center mb-12">PIN: {params.pin}</p>

                {scores.length === 0 ? (
                    <div className="text-center text-slate-500 flex flex-col items-center">
                        <Loader2 className="w-12 h-12 animate-spin mb-4" />
                        Waiting for students to finish...
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6 items-end mb-12">
                        {/* 2nd Place */}
                        {scores[1] && (
                            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 text-center h-48 flex flex-col justify-center order-1 md:order-1 relative">
                                <Medal className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-700 px-4 py-1 rounded-full font-black text-white">#2</div>
                                <h3 className="text-xl font-bold truncate">{scores[1].student_name}</h3>
                                <p className="text-3xl font-black text-slate-300 mt-2">{scores[1].score} pts</p>
                            </div>
                        )}

                        {/* 1st Place */}
                        {scores[0] && (
                            <div className="bg-gradient-to-b from-amber-500/20 to-slate-900 border-4 border-amber-500 rounded-3xl p-8 text-center h-64 flex flex-col justify-center order-2 md:order-2 relative shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                                <Crown className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-bounce" />
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 px-6 py-2 rounded-full font-black text-slate-950 text-lg shadow-lg">#1 WINNER</div>
                                <h3 className="text-2xl font-bold truncate text-white">{scores[0].student_name}</h3>
                                <p className="text-5xl font-black text-amber-400 mt-2">{scores[0].score} pts</p>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {scores[2] && (
                            <div className="bg-slate-900 border-2 border-amber-900 rounded-3xl p-6 text-center h-40 flex flex-col justify-center order-3 md:order-3 relative">
                                <Medal className="w-10 h-10 text-amber-700 mx-auto mb-2" />
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-900 px-4 py-1 rounded-full font-black text-white">#3</div>
                                <h3 className="text-lg font-bold truncate">{scores[2].student_name}</h3>
                                <p className="text-2xl font-black text-amber-700 mt-2">{scores[2].score} pts</p>
                            </div>
                        )}
                    </div>
                )}

                {/* List of all other players */}
                <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
                    <h2 className="font-bold text-lg mb-4 text-slate-400">All Players</h2>
                    <div className="space-y-2">
                        {scores.slice(3).map((s, i) => (
                            <div key={s.id} className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                                <span className="font-bold text-slate-300">#{i + 4} {s.student_name}</span>
                                <span className="font-black text-emerald-400">{s.score} pts</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}