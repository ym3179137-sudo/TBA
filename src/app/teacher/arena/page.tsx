"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Play, Users, Swords, Crown, Ghost, Gamepad2, Fish, AlertCircle, Loader2, Palette, BookOpen, FileText } from "lucide-react";
import { THEMES } from "@/lib/themes";

const GAME_MODES = [
    { id: 'classic', name: 'Classic Quiz', icon: <Swords className="text-blue-400" /> },
    { id: 'gold_quest', name: 'Gold Quest', icon: <Crown className="text-yellow-400" /> },
    { id: 'hacker', name: 'Crypto Hack', icon: <Ghost className="text-emerald-400" /> },
    { id: 'fishing_frenzy', name: 'Fishing Frenzy', icon: <Fish className="text-cyan-400" /> },
];

export default function TeacherArena() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    const [gamePin, setGamePin] = useState<string | null>(null);
    const [players, setPlayers] = useState<any[]>([]);

    const [selectedMode, setSelectedMode] = useState("classic");
    const [selectedTheme, setSelectedTheme] = useState(THEMES[0].id);
    const [selectedQuizId, setSelectedQuizId] = useState<string>(""); // 🚨 Selected Quiz State

    const [savedQuizzes, setSavedQuizzes] = useState<any[]>([]); // 🚨 Saved Quizzes List
    const [isStarting, setIsStarting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function initLobby() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("You must be logged in.");

                // 🚨 Fetch teacher's saved quizzes/assignments
                const { data: quizzes } = await supabase
                    .from("assignments")
                    .select("*")
                    .eq("teacher_id", user.id)
                    .eq("type", "form")
                    .order("created_at", { ascending: false });

                setSavedQuizzes(quizzes || []);
                if (quizzes && quizzes.length > 0) setSelectedQuizId(quizzes[0].id);

                // Create Game Session
                const pin = Math.floor(100000 + Math.random() * 900000).toString();
                const { data: sessionData, error: sessionError } = await supabase.from("game_sessions").insert({
                    pin: pin, teacher_id: user.id, status: 'lobby', game_mode: selectedMode
                }).select().single();

                if (sessionError) throw sessionError;
                setGamePin(pin);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        initLobby();
    }, [supabase]);

    useEffect(() => {
        if (!gamePin) return;
        const interval = setInterval(async () => {
            const { data } = await supabase.from("game_results").select("*").eq("game_pin", gamePin);
            if (data) setPlayers(data);
        }, 1500);
        return () => clearInterval(interval);
    }, [gamePin, supabase]);

    async function handleStartGame() {
        if (!selectedQuizId) return alert("Please select a saved quiz from the dropdown.");
        setIsStarting(true);

        try {
            // 🚨 Fetch the questions from the selected quiz
            const { data: quiz } = await supabase.from("assignments").select("settings, title").eq("id", selectedQuizId).single();

            if (!quiz || !quiz.settings?.questions || quiz.settings.questions.length === 0) {
                throw new Error("This quiz has no questions! Go back to Assessments and add some.");
            }

            const gamePayload = {
                questions: quiz.settings.questions,
                title: quiz.title,
                theme: selectedTheme
            };

            await supabase.from("game_sessions").update({
                status: 'playing',
                game_mode: selectedMode,
                game_data: gamePayload
            }).eq("pin", gamePin);

            router.push(`/teacher/arena/host/${gamePin}`);

        } catch (err: any) {
            alert("Error starting game: " + err.message);
            setIsStarting(false);
        }
    }

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin w-10 h-10" /></div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col items-center justify-center p-4 md:p-8">
            <Link href="/teacher" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white font-bold bg-slate-900 px-5 py-2.5 rounded-xl border border-slate-800">
                <ArrowLeft size={20} /> Exit
            </Link>

            <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 mt-16 lg:mt-0">
                {/* LEFT SIDE: PIN & PLAYERS */}
                <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-800 shadow-2xl flex flex-col items-center text-center">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Join the Arena!</h1>
                    <div className="bg-slate-950 border-4 border-emerald-500 rounded-3xl px-8 md:px-12 py-4 md:py-6 mb-8 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                        <span className="text-5xl md:text-7xl font-black text-white tracking-widest">{gamePin}</span>
                    </div>
                    <div className="w-full flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 min-h-[250px] flex flex-col">
                        <div className="flex items-center gap-2 text-slate-400 font-bold mb-4 border-b border-slate-800 pb-2">
                            <Users size={18} /> Players Joined ({players.length})
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center content-start flex-1 overflow-y-auto">
                            {players.map((p, i) => (
                                <div key={i} className="bg-slate-800 px-4 py-2 rounded-xl font-bold text-sm text-emerald-400">{p.student_name}</div>
                            ))}
                            {players.length === 0 && <p className="text-slate-600 italic mt-10">Waiting for students...</p>}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: SETTINGS */}
                <div className="flex flex-col space-y-6">

                    {/* 🚨 SELECT SAVED QUIZ */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><BookOpen className="text-amber-400" /> Select Quiz Topic</h2>
                            <Link href="/teacher/assignments/create" className="text-sm font-bold text-indigo-400 hover:text-indigo-300">+ Create New</Link>
                        </div>

                        {savedQuizzes.length === 0 ? (
                            <div className="text-center p-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
                                You haven't created any quizzes yet. Go to Assessments to create one.
                            </div>
                        ) : (
                            <select
                                value={selectedQuizId}
                                onChange={(e) => setSelectedQuizId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 font-bold outline-none focus:border-amber-500"
                            >
                                {savedQuizzes.map(quiz => (
                                    <option key={quiz.id} value={quiz.id}>
                                        {quiz.title} ({quiz.settings?.questions?.length || 0} Qs) - {quiz.status === 'draft' ? 'Draft' : 'Published'}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* GAME MODE */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Gamepad2 className="text-indigo-400" /> Select Game Mode</h2>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {GAME_MODES.map(mode => (
                                <div key={mode.id} onClick={() => setSelectedMode(mode.id)} className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center gap-2 ${selectedMode === mode.id ? 'bg-slate-800 border-emerald-500' : 'bg-slate-950 border-slate-800'}`}>
                                    {mode.icon}
                                    <h3 className="text-sm font-bold text-white">{mode.name}</h3>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* THEME */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Palette className="text-pink-400" /> Select Theme</h2>
                        <select
                            value={selectedTheme}
                            onChange={(e) => setSelectedTheme(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 font-bold outline-none focus:border-pink-500"
                        >
                            {THEMES.map(theme => (
                                <option key={theme.id} value={theme.id}>{theme.name}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={handleStartGame} disabled={isStarting || savedQuizzes.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl py-5 rounded-2xl shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 transition-all">
                        <Play size={24} /> {isStarting ? "Starting..." : "Start Game!"}
                    </button>
                </div>
            </div>
        </div>
    );
}