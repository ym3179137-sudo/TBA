"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, Clock, Shield, Sparkles, EyeOff, Gift, Skull } from "lucide-react";

export default function TBAArena({
    gameData,
    gameMode = "classic",
    onScoreUpdate, // 🚨 New Prop: Sends score to DB
    isPreview = false
}: {
    gameData: any,
    gameMode?: string,
    onScoreUpdate?: (score: number) => void,
    isPreview?: boolean
}) {
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);

    const [abilities, setAbilities] = useState({ timeFreeze: 1, doublePoints: 1, shield: 1 });
    const [activeEffect, setActiveEffect] = useState<string | null>(null);
    const [glitchScreen, setGlitchScreen] = useState(false);

    const [isTabHidden, setIsTabHidden] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Anti-Cheat
    useEffect(() => {
        if (isPreview) return;
        const handleVisibilityChange = () => setIsTabHidden(document.hidden);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        const handleRightClick = (e: MouseEvent) => e.preventDefault();
        document.addEventListener("contextmenu", handleRightClick);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("contextmenu", handleRightClick);
        };
    }, [isPreview]);

    // Timer
    useEffect(() => {
        if (!gameData || isTabHidden) return;
        setTimeLeft(15);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleAnswer(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [currentQ, gameData, isTabHidden]);

    if (!gameData || !gameData.questions) return null;
    const question = gameData.questions[currentQ];

    function useAbility(type: "timeFreeze" | "doublePoints" | "shield") {
        if (abilities[type] <= 0 || isTabHidden) return;
        setAbilities(prev => ({ ...prev, [type]: prev[type] - 1 }));
        if (type === 'timeFreeze') { setTimeLeft(prev => prev + 10); setActiveEffect("TIME FROZEN! +10s"); }
        if (type === 'doublePoints') setActiveEffect("2x POINTS ACTIVE!");
        if (type === 'shield') setActiveEffect("SHIELD ACTIVE!");
        setTimeout(() => setActiveEffect(null), 2000);
    }

    function handleAnswer(option: string | null) {
        if (isTabHidden) return;
        if (timerRef.current) clearInterval(timerRef.current);

        const isCorrect = option === question.correctAnswer;
        let points = 10;
        let newScore = score;

        if (isCorrect) {
            let newStreak = streak + 1;
            setStreak(newStreak);
            if (activeEffect === "2x POINTS ACTIVE!") points = 20;
            if (newStreak >= 3) points += 10;

            // 🚨 BLOOKET CHEST & SWAMP LOGIC
            if (gameMode === 'gold_quest' && Math.random() > 0.6) {
                const chestRoll = Math.random();
                if (chestRoll > 0.8) {
                    points = -50; // SWAMP!
                    setActiveEffect("SWAMP! -50 PTS");
                } else if (chestRoll > 0.4) {
                    points = 100; // GOLD CHEST!
                    setActiveEffect("GOLD CHEST! +100 PTS");
                } else {
                    points = 50; // SILVER CHEST
                    setActiveEffect("CHEST! +50 PTS");
                }
                setTimeout(() => setActiveEffect(null), 2000);
            }

            newScore += points;
            setScore(newScore);
            if (onScoreUpdate) onScoreUpdate(newScore); // 🚨 Update DB instantly

        } else {
            if (activeEffect !== "SHIELD ACTIVE!") setStreak(0);
            if (gameMode === 'hacker') {
                setGlitchScreen(true);
                setTimeout(() => setGlitchScreen(false), 1000);
            }
        }

        // 🚨 INFINITE LOOP
        const nextQ = (currentQ + 1) % gameData.questions.length;
        setCurrentQ(nextQ);
    }

    return (
        <div className={`flex flex-col h-full bg-slate-950 text-white p-6 relative overflow-hidden transition-all duration-300 ${glitchScreen ? 'invert hue-rotate-90 scale-105' : ''}`}>

            {isTabHidden && (
                <div className="absolute inset-0 z-[100] bg-red-600/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
                    <EyeOff className="w-24 h-24 text-white mb-6 animate-pulse" />
                    <h1 className="text-5xl font-black text-white mb-4">DON'T LEAVE THE GAME!</h1>
                </div>
            )}

            {activeEffect && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in zoom-in duration-200">
                    <h2 className={`text-5xl md:text-7xl font-black drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] text-center px-4 ${activeEffect.includes("SWAMP") ? 'text-green-500' :
                            activeEffect.includes("CHEST") ? 'text-yellow-400' : 'text-white'
                        }`}>
                        {activeEffect}
                    </h2>
                </div>
            )}

            <div className="flex justify-between items-center mb-6 z-10">
                <div className="flex gap-3">
                    <span className="text-sm font-bold bg-indigo-600 px-4 py-2 rounded-xl shadow-lg">Q {(currentQ % gameData.questions.length) + 1}</span>
                    <span className="text-sm font-bold bg-emerald-600 px-4 py-2 rounded-xl shadow-lg">Score: {score}</span>
                </div>
                {streak > 0 && (
                    <span className="flex items-center gap-1 text-orange-400 font-bold bg-orange-950 px-4 py-2 rounded-xl animate-pulse">
                        <Flame className="w-5 h-5 fill-current" /> {streak} Streak
                    </span>
                )}
            </div>

            <div className="w-full bg-slate-800 h-3 rounded-full mb-8 overflow-hidden z-10">
                <div className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 5 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${(timeLeft / 15) * 100}%` }}></div>
            </div>

            <div className="flex justify-center gap-4 mb-10 z-10">
                <button onClick={() => useAbility('timeFreeze')} disabled={abilities.timeFreeze <= 0} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${abilities.timeFreeze > 0 ? 'border-blue-500 bg-blue-900/50 hover:bg-blue-800 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-slate-700 bg-slate-800 opacity-50'}`}>
                    <Clock className="w-6 h-6 text-blue-400 mb-1" />
                    <span className="text-xs font-bold">Freeze ({abilities.timeFreeze})</span>
                </button>
                <button onClick={() => useAbility('doublePoints')} disabled={abilities.doublePoints <= 0} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${abilities.doublePoints > 0 ? 'border-emerald-500 bg-emerald-900/50 hover:bg-emerald-800 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-slate-700 bg-slate-800 opacity-50'}`}>
                    <Sparkles className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="text-xs font-bold">2x Pts ({abilities.doublePoints})</span>
                </button>
                <button onClick={() => useAbility('shield')} disabled={abilities.shield <= 0} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${abilities.shield > 0 ? 'border-purple-500 bg-purple-900/50 hover:bg-purple-800 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'border-slate-700 bg-slate-800 opacity-50'}`}>
                    <Shield className="w-6 h-6 text-purple-400 mb-1" />
                    <span className="text-xs font-bold">Shield ({abilities.shield})</span>
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center mb-8 relative z-10 text-center">
                <h1 className="text-3xl md:text-5xl font-black mb-12 drop-shadow-md">{question.prompt}</h1>
                <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
                    {question.options.map((opt: string, i: number) => {
                        const colors = ["bg-red-500 hover:bg-red-400", "bg-blue-500 hover:bg-blue-400", "bg-yellow-500 hover:bg-yellow-400", "bg-emerald-500 hover:bg-emerald-400"];
                        return (
                            <button key={i} onClick={() => handleAnswer(opt)} className={`${colors[i % 4]} p-8 rounded-2xl text-2xl font-bold text-center transition-transform active:scale-95 shadow-[0_5px_0_rgba(0,0,0,0.3)]`}>
                                {opt}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}