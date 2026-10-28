"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldAlert, Zap, Flame, Trophy, Clock, Shield, Sparkles } from "lucide-react";

export default function TBAArena({
    gameData,
    onFinish,
    isPreview = false
}: {
    gameData: any,
    onFinish: (score: number) => void,
    isPreview?: boolean
}) {
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [cheatStrikes, setCheatStrikes] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15);

    // 🎮 NEW: Abilities State
    const [abilities, setAbilities] = useState({
        shield: 1,
        luck: 1,
        time: 1
    });
    const [activeEffect, setActiveEffect] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 🛡️ ANTI-CHEAT SYSTEM
    useEffect(() => {
        if (isPreview) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setCheatStrikes(prev => prev + 1);
                setStreak(0);
                setScore(prev => Math.max(0, prev - 5));
                alert("⚠️ CHEAT DETECTED! You left the game screen. You lost 5 points and your streak!");
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isPreview]);

    // ⏱️ TIMER SYSTEM
    useEffect(() => {
        if (showResult || !gameData || isPreview) return;

        setTimeLeft(15);
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleAnswer(null); // Time out
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [currentQ, showResult, isPreview]);

    if (!gameData || !gameData.questions) return null;

    const question = gameData.questions[currentQ];

    // ⚡ USE ABILITY FUNCTION
    function useAbility(type: "shield" | "luck" | "time") {
        if (abilities[type] <= 0 || isPreview) return;

        setAbilities(prev => ({ ...prev, [type]: prev[type] - 1 }));

        if (type === 'time') {
            setTimeLeft(prev => prev + 5);
            setActiveEffect("TIME");
            setTimeout(() => setActiveEffect(null), 1500);
        }
        if (type === 'luck') {
            setActiveEffect("LUCK");
        }
        if (type === 'shield') {
            setActiveEffect("SHIELD");
        }
    }

    function handleAnswer(option: string | null) {
        if (isPreview) return;
        if (timerRef.current) clearInterval(timerRef.current);

        const isCorrect = option === question.correctAnswer;
        let newScore = score;

        if (isCorrect) {
            let points = 10;
            let newStreak = streak + 1;
            setStreak(newStreak);

            // If Luck is active, double points and consume it
            if (activeEffect === "LUCK") {
                points = 20;
                setActiveEffect(null);
            }

            // 3-Streak Bonus
            if (newStreak === 3) {
                points += 10;
            }

            newScore += points;
            setScore(newScore);
        } else {
            // If Shield is active, don't lose streak
            if (activeEffect === "SHIELD") {
                setActiveEffect(null);
            } else {
                setStreak(0);
            }
        }

        if (currentQ + 1 < gameData.questions.length) {
            setCurrentQ(prev => prev + 1);
        } else {
            setShowResult(true);
            onFinish(newScore);
        }
    }

    if (showResult) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-indigo-950 text-white p-8 text-center">
                <Trophy className="w-32 h-32 text-yellow-400 mb-6 animate-bounce" />
                <h2 className="text-5xl font-extrabold mb-4">Arena Complete!</h2>
                <p className="text-2xl mb-2">Final Score: <span className="font-bold text-emerald-400">{score}</span></p>
                <p className="text-lg text-indigo-300 mb-8">You earned {Math.floor(score / 10)} Coins for your 3D World!</p>
                <button onClick={() => window.location.reload()} className="bg-white text-indigo-950 font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform">Play Again</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-indigo-950 text-white p-6 relative overflow-hidden">

            {/* 🚨 CHEAT STRIKE OVERLAY */}
            {cheatStrikes > 0 && (
                <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-2 font-bold animate-pulse z-50 flex items-center justify-center gap-2">
                    <ShieldAlert className="w-5 h-5" /> Strikes: {cheatStrikes} - Anti-Cheat Active
                </div>
            )}

            {/* ⚡ ABILITY EFFECT OVERLAY */}
            {activeEffect && (
                <div className="absolute inset-0 bg-yellow-400/20 backdrop-blur-sm pointer-events-none z-40 flex items-center justify-center animate-pulse">
                    <h2 className="text-6xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                        {activeEffect === "LUCK" && "🍀 LUCK ACTIVATED"}
                        {activeEffect === "SHIELD" && "🛡️ SHIELD ACTIVATED"}
                        {activeEffect === "TIME" && "⏱️ +5 SECONDS"}
                    </h2>
                </div>
            )}

            <div className="flex justify-between items-center mb-6 mt-4 z-10">
                <div className="flex gap-4">
                    <span className="text-xl font-bold bg-indigo-800 px-4 py-2 rounded-lg">Q {currentQ + 1} / {gameData.questions.length}</span>
                    <span className="text-xl font-bold bg-indigo-800 px-4 py-2 rounded-lg">Score: {score}</span>
                </div>

                <div className="flex items-center gap-4">
                    {streak > 0 && (
                        <span className="flex items-center gap-1 text-orange-400 font-bold bg-orange-950 px-4 py-2 rounded-lg">
                            <Flame className="w-5 h-5 fill-current" /> {streak} Streak
                        </span>
                    )}
                </div>
            </div>

            {!isPreview && (
                <div className="w-full bg-indigo-900 h-4 rounded-full mb-4 overflow-hidden shadow-inner">
                    <div className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 5 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${(timeLeft / 15) * 100}%` }}></div>
                </div>
            )}

            {/* 🎮 ABILITIES BAR */}
            <div className="flex justify-center gap-4 mb-8 z-10">
                <button onClick={() => useAbility('time')} disabled={abilities.time <= 0 || isPreview} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${abilities.time > 0 ? 'border-blue-500 bg-blue-900/50 hover:bg-blue-800' : 'border-slate-700 bg-slate-800 opacity-50'}`}>
                    <Clock className="w-6 h-6 text-blue-400 mb-1" />
                    <span className="text-xs font-bold">+5s ({abilities.time})</span>
                </button>
                <button onClick={() => useAbility('luck')} disabled={abilities.luck <= 0 || isPreview} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${abilities.luck > 0 ? 'border-emerald-500 bg-emerald-900/50 hover:bg-emerald-800' : 'border-slate-700 bg-slate-800 opacity-50'}`}>
                    <Sparkles className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="text-xs font-bold">2x Points ({abilities.luck})</span>
                </button>
                <button onClick={() => useAbility('shield')} disabled={abilities.shield <= 0 || isPreview} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${abilities.shield > 0 ? 'border-purple-500 bg-purple-900/50 hover:bg-purple-800' : 'border-slate-700 bg-slate-800 opacity-50'}`}>
                    <Shield className="w-6 h-6 text-purple-400 mb-1" />
                    <span className="text-xs font-bold">Shield ({abilities.shield})</span>
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center mb-8 relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">{question.prompt}</h1>

                <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
                    {question.options.map((opt: string, i: number) => {
                        const colors = ["bg-red-500 hover:bg-red-400", "bg-blue-500 hover:bg-blue-400", "bg-yellow-500 hover:bg-yellow-400", "bg-emerald-500 hover:bg-emerald-400"];
                        return (
                            <button
                                key={i}
                                onClick={() => handleAnswer(opt)}
                                disabled={isPreview}
                                className={`${colors[i % 4]} p-8 rounded-2xl text-2xl font-bold text-center transition-transform active:scale-95 shadow-[0_5px_0_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}