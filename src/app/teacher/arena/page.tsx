"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    ArrowLeft, Play, Users, Swords,
    Crown, Ghost, Gamepad2, Fish, BookOpen, AlertCircle, RefreshCw
} from "lucide-react";

const GAME_MODES = [
    { id: 'classic', name: 'Classic Quiz', icon: <Swords className="text-blue-400" />, desc: 'Normal Kahoot-style game.' },
    { id: 'gold_quest', name: 'Gold Quest Frenzy', icon: <Crown className="text-yellow-400" />, desc: 'Answer correctly to trigger Gold Quest and steal points!' },
    { id: 'hacker', name: 'Hacking Simulator', icon: <Ghost className="text-emerald-400" />, desc: 'Glitch screens and freeze opponents to win.' },
    { id: 'fishing_frenzy', name: 'Fishing Frenzy', icon: <Fish className="text-cyan-400" />, desc: 'Catch random fish for huge points, or catch an old boot!' },
];

export default function TeacherArena() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    const [gamePin, setGamePin] = useState<string | null>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [selectedMode, setSelectedMode] = useState("classic");
    const [isStarting, setIsStarting] = useState(false);

    const [presentations, setPresentations] = useState<any[]>([]);
    const [selectedPresentationId, setSelectedPresentationId] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const channelRef = useRef<any>(null);

    useEffect(() => {
        async function initLobby() {
            try {
                setLoading(true);
                setError(null);

                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) throw new Error("You must be logged in.");

                // 1. Fetch presentations
                const { data: presData, error: presError } = await supabase
                    .from("presentations")
                    .select("id, title")
                    .eq("teacher_id", user.id);

                if (presError) throw new Error("Failed to load presentations: " + presError.message);

                if (presData && presData.length > 0) {
                    setPresentations(presData);
                    setSelectedPresentationId(presData[0].id);
                } else {
                    setPresentations([]);
                }

                // 2. Create Game Session
                const pin = Math.floor(100000 + Math.random() * 900000).toString();
                const { data: sessionData, error: sessionError } = await supabase.from("game_sessions").insert({
                    pin: pin,
                    teacher_id: user.id,
                    status: 'lobby',
                    game_mode: selectedMode
                }).select().single();

                if (sessionError) throw new Error("Failed to create game session: " + sessionError.message);
                if (!sessionData) throw new Error("Failed to create game session (no data returned).");

                setGamePin(pin);
                setupChannel(pin);

            } catch (err: any) {
                console.error("Arena Load Error:", err);
                setError(err.message || "An unknown error occurred.");
            } finally {
                setLoading(false); // 🚨 ALWAYS stop loading
            }
        }

        initLobby();

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        }
    }, [supabase, router]);

    function setupChannel(pin: string) {
        try {
            channelRef.current = supabase.channel(`game-lobby-${pin}`, {
                config: { presence: { key: `teacher-${Date.now()}` } }
            });

            channelRef.current
                .on('presence', { event: 'sync' }, () => {
                    const state = channelRef.current.presenceState();
                    const allUsers = Object.values(state).flat();
                    const joinedPlayers = allUsers.filter((u: any) => u.role === 'player');
                    setPlayers(joinedPlayers);
                })
                .subscribe(async (status: string) => {
                    if (status === 'SUBSCRIBED') {
                        await channelRef.current.track({ role: 'teacher' });
                    }
                });
        } catch (err) {
            console.error("WebSocket Error:", err);
        }
    }

    async function handleStartGame() {
        if (!selectedPresentationId) return alert("Please select a quiz/presentation first.");
        setIsStarting(true);

        try {
            const { data: presData, error: presError } = await supabase
                .from("presentations")
                .select("deck_data, title")
                .eq("id", selectedPresentationId)
                .single();

            if (presError || !presData) throw new Error("Failed to load quiz data.");

            const mockQuestions = presData.deck_data?.slides?.map((slide: any) => ({
                prompt: slide.heading || "What is the answer?",
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctAnswer: "Option A"
            })) || [
                    { prompt: "What is 1+1?", options: ["2", "3", "4", "5"], correctAnswer: "2" },
                    { prompt: "What color is the sky?", options: ["Blue", "Red", "Green", "Yellow"], correctAnswer: "Blue" }
                ];

            const gamePayload = { questions: mockQuestions, title: presData.title };

            if (channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'start_game',
                    payload: { gameData: gamePayload, gameMode: selectedMode }
                });
            }

            await supabase.from("game_sessions").update({ status: 'playing', game_mode: selectedMode }).eq("pin", gamePin);
            router.push(`/teacher/arena/host/${gamePin}`);

        } catch (err: any) {
            alert("Error starting game: " + err.message);
            setIsStarting(false);
        }
    }

    // 🚨 ERROR UI
    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-white">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Failed to load Arena</h1>
                <p className="text-slate-400 mb-6 text-center max-w-md">{error}</p>
                <button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                    <RefreshCw size={20} /> Try Again
                </button>
                <Link href="/teacher" className="mt-4 text-slate-400 hover:text-white underline">Go Back</Link>
            </div>
        );
    }

    // 🚨 LOADING UI
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
                <p className="font-bold text-slate-400">Starting Game Server...</p>
            </div>
        );
    }

    // 🚨 SUCCESS UI
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col items-center justify-center p-4 md:p-8">

            <Link href="/teacher" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white font-bold bg-slate-900 px-5 py-2.5 rounded-xl border border-slate-800">
                <ArrowLeft size={20} /> Exit
            </Link>

            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 md:gap-12 mt-16 lg:mt-0">

                <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-800 shadow-2xl flex flex-col items-center text-center">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Join the Arena!</h1>
                    <p className="text-slate-400 mb-6 text-sm">Students go to the website and enter this PIN.</p>

                    <div className="bg-slate-950 border-4 border-emerald-500 rounded-3xl px-8 md:px-12 py-4 md:py-6 mb-8 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                        <span className="text-5xl md:text-7xl font-black text-white tracking-widest">{gamePin}</span>
                    </div>

                    <div className="w-full flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 min-h-[250px] flex flex-col">
                        <div className="flex items-center gap-2 text-slate-400 font-bold mb-4 border-b border-slate-800 pb-2">
                            <Users size={18} /> Players Joined ({players.length})
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center content-start flex-1 overflow-y-auto">
                            {players.map((p, i) => (
                                <div key={i} className="bg-slate-800 px-4 py-2 rounded-xl font-bold text-sm text-emerald-400 animate-in zoom-in duration-300">
                                    {p.name}
                                </div>
                            ))}
                            {players.length === 0 && <p className="text-slate-600 italic mt-10">Waiting for students...</p>}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center space-y-6">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <BookOpen className="text-amber-400" /> Select Quiz Topic
                        </h2>
                        {presentations.length === 0 ? (
                            <div className="flex items-center gap-3 bg-red-500/10 text-red-400 p-4 rounded-xl text-sm font-bold border border-red-500/20">
                                <AlertCircle size={20} /> No presentations found. Create one in the AI Designer first.
                            </div>
                        ) : (
                            <select
                                value={selectedPresentationId}
                                onChange={(e) => setSelectedPresentationId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-4 focus:border-amber-500 outline-none font-bold"
                            >
                                {presentations.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Gamepad2 className="text-indigo-400" /> Select Game Mode
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {GAME_MODES.map(mode => (
                                <div
                                    key={mode.id}
                                    onClick={() => setSelectedMode(mode.id)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${selectedMode === mode.id
                                            ? 'bg-slate-800 border-emerald-500 shadow-lg'
                                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                        }`}
                                >
                                    {mode.icon}
                                    <h3 className="text-sm font-bold text-white">{mode.name}</h3>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleStartGame}
                        disabled={isStarting || presentations.length === 0}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xl py-5 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        <Play size={24} /> {isStarting ? "Starting..." : "Start Game!"}
                    </button>
                </div>
            </div>
        </div>
    );
}