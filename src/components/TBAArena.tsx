"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, Clock, Shield, Sparkles, EyeOff, Gift, X } from "lucide-react";

export default function TBAArena({
    gameData,
    gameMode = "classic",
    onScoreUpdate,
    onTakeGold,
    onDragonTreasure,
    onGameEnd,
    isPreview = false
}: {
    gameData: any,
    gameMode?: string,
    onScoreUpdate?: (score: number) => void,
    onTakeGold?: (percent: number, currentScore: number) => Promise<number>,
    onDragonTreasure?: (currentScore: number) => Promise<number>,
    onGameEnd?: (answersLog: any[]) => void,
    isPreview?: boolean
}) {
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);

    // Logs
    const [answersLog, setAnswersLog] = useState<any[]>([]);

    // Abilities
    const [abilities, setAbilities] = useState({ timeFreeze: 1, doublePoints: 1, shield: 1 });
    const [activeEffect, setActiveEffect] = useState<string | null>(null);

    // States
    const [isTabHidden, setIsTabHidden] = useState(false);
    const [showChests, setShowChests] = useState(false);

    // 🚨 Red X Logic
    const [showWrongScreen, setShowWrongScreen] = useState(false);
    const [canClickContinue, setCanClickContinue] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const wrongTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        if (!gameData || isTabHidden || showChests || showWrongScreen) return;
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
    }, [currentQ, gameData, isTabHidden, showChests, showWrongScreen]);

    if (!gameData || !gameData.questions) return null;
    const question = gameData.questions[currentQ];

    function useAbility(type: "timeFreeze" | "doublePoints" | "shield") {
        if (abilities[type] <= 0 || isTabHidden || showChests || showWrongScreen) return;
        setAbilities(prev => ({ ...prev, [type]: prev[type] - 1 }));
        if (type === 'timeFreeze') { setTimeLeft(prev => prev + 10); setActiveEffect("TIME FROZEN! +10s"); }
        if (type === 'doublePoints') setActiveEffect("2x POINTS ACTIVE!");
        if (type === 'shield') setActiveEffect("SHIELD ACTIVE!");
        setTimeout(() => setActiveEffect(null), 2000);
    }

    async function handleAnswer(option: string | null) {
        if (isTabHidden || showChests || showWrongScreen) return;
        if (timerRef.current) clearInterval(timerRef.current);

        const isCorrect = option === question.correctAnswer;
        let points = 10;

        // Log the answer
        const logEntry = {
            question: question.prompt,
            correctAnswer: question.correctAnswer,
            studentAnswer: option || "Time Out",
            isCorrect: isCorrect
        };
        setAnswersLog(prev => [...prev, logEntry]);

        if (isCorrect) {
            let newStreak = streak + 1;
            setStreak(newStreak);
            if (activeEffect === "2x POINTS ACTIVE!") points = 20;
            if (newStreak >= 3) points += 10;

            let newScore = score + points;
            setScore(newScore);
            if (onScoreUpdate) onScoreUpdate(newScore);

            if (gameMode === 'gold_quest') {
                setShowChests(true);
                return;
            }
            moveToNextQuestion();
        } else {
            // 🚨 WRONG ANSWER LOGIC
            setStreak(0);
            setShowWrongScreen(true);
            setCanClickContinue(false);

            // Wait 3 seconds before allowing click
            wrongTimeoutRef.current = setTimeout(() => {
                setCanClickContinue(true);
            }, 3000);
        }
    }

    function moveToNextQuestion() {
        const nextQ = (currentQ + 1) % gameData.questions.length;
        setCurrentQ(nextQ);
    }

    function handleContinueClick() {
        if (!canClickContinue) return;
        setShowWrongScreen(false);
        if (wrongTimeoutRef.current) clearTimeout(wrongTimeoutRef.current);
        moveToNextQuestion();
    }

    async function openChest(chestIndex: number) {
        setShowChests(false);
        const roll = Math.random();
        let resultText = "";
        let newScore = score;

        if (roll < 0.1) {
            if (onDragonTreasure) newScore = await onDragonTreasure(score);
            resultText = "DRAGON'S TREASURE!";
        } else if (roll < 0.25) {
            const percent = Math.random() > 0.5 ? 25 : 10;
            if (onTakeGold) newScore = await onTakeGold(percent, score);
            resultText = `STOLE ${percent}% OF 1ST PLACE!`;
        } else if (roll < 0.5) {
            const loss = Math.floor(score * 0.25);
            newScore = Math.max(0, score - loss);
            resultText = `SWAMP! -${loss} PTS`;
        } else if (roll < 0.7) {
            newScore = score * 2;
            resultText = "DOUBLE GOLD!";
        } else {
            const bonus = Math.floor(Math.random() * 50) + 50;
            newScore = score + bonus;
            resultText = `+${bonus} GOLD!`;
        }

        setScore(newScore);
        if (onScoreUpdate) onScoreUpdate(newScore);
        setActiveEffect(resultText);

        setTimeout(() => {
            setActiveEffect(null);
            moveToNextQuestion();
        }, 2500);
    }

    // Handle global game end (from parent polling)
    useEffect(() => {
        // If game ends, send the answers log up
        return () => {
            if (onGameEnd) onGameEnd(answersLog);
        }
    }, [answersLog, onGameEnd]);

    return (
        <div className={`flex flex-col h-full bg-slate-950 text-white p-6 relative overflow-hidden transition-all duration-300`}>

            {isTabHidden && (
                <div className="absolute inset-0 z-[100] bg-red-600/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
                    <EyeOff className="w-24 h-24 text-white mb-6 animate-pulse" />
                    <h1 className="text-5xl font-black text-white mb-4">DON'T LEAVE THE GAME!</h1>
                </div>
            )}

            {/* 🚨 RED X WRONG SCREEN */}
            {showWrongScreen && (
                <div
                    onClick={handleContinueClick}
                    className={`absolute inset-0 z-[80] flex flex-col items-center justify-center bg-red-600 transition-all duration-300 ${canClickContinue ? 'cursor-pointer' : 'cursor-default'}`}
                >
                    <X className="w-48 h-48 text-white mb-8 animate-in zoom-in spin-in-12 duration-500" strokeWidth={4} />
                    <h1 className="text-4xl font-black text-white mb-4">INCORRECT!</h1>
                    {canClickContinue ? (
                        <p className="text-xl font-bold text-white animate-pulse bg-black/20 px-6 py-3 rounded-xl">Click anywhere to continue</p>
                    ) : (
                        <p className="text-xl font-bold text-white/50">Wait a moment...</p>
                    )}
                </div>
            )}

            {activeEffect && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in zoom-in duration-200">
                    <h2 className={`text-5xl md:text-8xl font-black drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] text-center px-4 ${activeEffect.includes("SWAMP") ? 'text-green-500' :
                            activeEffect.includes("GOLD") || activeEffect.includes("TREASURE") ? 'text-yellow-400' : 'text-white'
                        }`}>
                        {activeEffect}
                    </h2>
                </div>
            )}

            {showChests && (
                <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in zoom-in">
                    <h2 className="text-4xl font-black text-amber-400 mb-12 animate-bounce">PICK A CHEST!</h2>
                    <div className="flex gap-8">
                        {[1, 2, 3].map((_, i) => (
                            <button key={i} onClick={() => openChest(i)} className="w-32 h-32 bg-amber-600 hover:bg-amber-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-transform hover:scale-110 active:scale-95">
                                <Gift size={64} className="text-white" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6 z-10">
                <div className="flex gap-3">
                    <span className="text-sm font-bold bg-indigo-600 px-4 py-2 rounded-xl shadow-lg">Score: {score}</span>
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
                <button onClick={() => useAbility('timeFreeze')} disabled={abilities.timeFreeze <= 0} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${abilities.timeFreeze > 0 ? 'border-blue-500 bg-blue-900/50 hover:bg-blue-800' : 'border-slate-700 bg-slate-800 opacity-50'}`}>
                    <Clock className="w-6 h-6 text-blue-400 mb-1" />
                </button>
                <button onClick={() => useAbility('doublePoints')} disabled={abilities.doublePoints <= 0} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${abilities.doublePoints > 0 ? 'border-emerald-500 bg-emerald-900/50 hover:bg-emerald-800' : 'border-slate-700 bg-slate-800 opacity-50'}`}>
                    <Sparkles className="w-6 h-6 text-emerald-400 mb-1" />
                </button>
                <button onClick={() => useAbility('shield')} disabled={abilities.shield <= 0} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${abilities.shield > 0 ? 'border-purple-500 bg-purple-900/50 hover:bg-purple-800' : 'border-slate-700 bg-slate-800 opacity-50'}`}>
                    <Shield className="w-6 h-6 text-purple-400 mb-1" />
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