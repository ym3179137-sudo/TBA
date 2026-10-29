"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    ArrowLeft, Play, Users, Swords, Zap,
    Crown, Shield, Ghost, Gamepad2, Fish
} from "lucide-react";

const GAME_MODES = [
    { id: 'classic', name: 'Classic Quiz', icon: <Swords className="text-blue-400" />, desc: 'Normal Kahoot-style game.' },
    { id: 'gold_quest', name: 'Gold Quest Frenzy', icon: <Crown className="text-yellow-400" />, desc: 'Answer correctly to trigger Gold Quest and steal points!' },
    { id: 'hacker', name: 'Hacking Simulator', icon: <Ghost className="text-emerald-400" />, desc: 'Glitch screens and freeze opponents to win.' },
    { id: 'fishing_frenzy', name: 'Fishing Frenzy', icon: <Fish className="text-cyan-400" />, desc: 'Catch random fish for huge points, or catch an old boot!' },
];

export default function TeacherArena() {
    const router = useRouter();
    const supabase = createClient();

    const [gamePin, setGamePin] = useState<string | null>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [selectedMode, setSelectedMode] = useState("classic");
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        createGameSession();
    }, []);

    async function createGameSession() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/sign-in");

        const pin = Math.floor(100000 + Math.random() * 900000).toString();

        const { data, error } = await supabase.from("game_sessions").insert({
            pin: pin,
            teacher_id: user.id,
            status: 'lobby',
            game_mode: selectedMode
        }).select().single();

        if (!error && data) {
            setGamePin(pin);
            subscribeToLobby(pin);
        }
    }

    function subscribeToLobby(pin: string) {
        supabase
            .channel(`lobby-${pin}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'game_players',
                filter: `game_pin=eq.${pin}`
            }, (payload) => {
                setPlayers(prev => [...prev, payload.new]);
            })
            .subscribe();
    }

    async function handleStartGame() {
        if (players.length === 0) return alert("Wait for at least one student to join!");

        setIsStarting(true);
        await supabase.from("game_sessions").update({
            status: 'playing',
            game_mode: selectedMode
        }).eq("pin", gamePin);

        router.push(`/teacher/arena/host/${gamePin}`);
    }

    if (!gamePin) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Starting Game Server...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col items-center justify-center p-8">

            <Link href="/teacher" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white font-bold bg-slate-900 px-5 py-2.5 rounded-xl border border-slate-800">
                <ArrowLeft size={20} /> Exit Game
            </Link>

            <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12">

                <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl flex flex-col items-center text-center">
                    <h1 className="text-3xl font-extrabold text-white mb-2">Join the Arena!</h1>
                    <p className="text-slate-400 mb-6">Students go to the website and enter this PIN.</p>

                    <div className="bg-slate-950 border-4 border-emerald-500 rounded-3xl px-12 py-6 mb-8 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                        <span className="text-6xl md:text-7xl font-black text-white tracking-widest">{gamePin}</span>
                    </div>

                    <div className="w-full flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 min-h-[300px]">
                        <div className="flex items-center gap-2 text-slate-400 font-bold mb-4 border-b border-slate-800 pb-2">
                            <Users size={18} /> Players Joined ({players.length})
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {players.map((p, i) => (
                                <div key={i} className="bg-slate-800 px-4 py-2 rounded-xl font-bold text-sm text-emerald-400 animate-in zoom-in duration-300">
                                    {p.student_name}
                                </div>
                            ))}
                            {players.length === 0 && <p className="text-slate-600 italic mt-10">Waiting for students...</p>}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center space-y-6">
                    <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                        <Gamepad2 className="text-indigo-400" /> Select Game Mode
                    </h2>

                    <div className="space-y-4">
                        {GAME_MODES.map(mode => (
                            <div
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${selectedMode === mode.id
                                        ? 'bg-slate-800 border-emerald-500 shadow-lg'
                                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                    }`}
                            >
                                <div className="p-3 bg-slate-950 rounded-xl">{mode.icon}</div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{mode.name}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{mode.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleStartGame}
                        disabled={isStarting || players.length === 0}
                        className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xl py-5 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        <Play size={24} /> Start Game!
                    </button>
                </div>
            </div>
        </div>
    );
}