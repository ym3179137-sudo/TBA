"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, Clock, Shield, Sparkles, EyeOff, Skull, Lock, Unlock, Terminal } from "lucide-react";

export default function TBAArena({
    gameData, gameMode, onScoreUpdate, onTakeGold, onDragonTreasure, onGameEnd, isPreview
}: any) {
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [answersLog, setAnswersLog] = useState<any[]>([]);

    // Abilities
    const [abilities, setAbilities] = useState({ timeFreeze: 1, doublePoints: 1, shield: 1 });
    const [activeEffect, setActiveEffect] = useState<string | null>(null);

    const [isTabHidden, setIsTabHidden] = useState(false);
    const [showWrongScreen, setShowWrongScreen] = useState(false);
    const [canClickContinue, setCanClickContinue] = useState(false);

    // 🚨 HACKER MODE STATES
    const [isHacking, setIsHacking] = useState(false);
    const [hackTarget, setHackTarget] = useState<any>(null);
    const [secretPassword, setSecretPassword] = useState("");
    const [isHacked, setIsHacked] = useState(false); // Victim state
    const [patchClicks, setPatchClicks] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const wrongTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isPreview) return;
        const handleVisibilityChange = () => setIsTabHidden(document.hidden);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isPreview]);

    useEffect(() => {
        if (!gameData || isTabHidden || showWrongScreen || isHacking || isHacked) return;
        setTimeLeft(15);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { clearInterval(timerRef.current!); handleAnswer(null); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [currentQ, gameData, isTabHidden, showWrongScreen, isHacking, isHacked]);

    if (!gameData || !gameData.questions) return null;
    const question = gameData.questions[currentQ];

    function useAbility(type: "timeFreeze" | "doublePoints" | "shield") {
        if (abilities[type] <= 0 || isTabHidden || showWrongScreen || isHacking || isHacked) return;
        setAbilities(prev => ({ ...prev, [type]: prev[type] - 1 }));
        if (type === 'timeFreeze') { setTimeLeft(prev => prev + 10); setActiveEffect("TIME FROZEN! +10s"); }
        if (type === 'doublePoints') setActiveEffect("2x POINTS ACTIVE!");
        if (type === 'shield') setActiveEffect("SHIELD ACTIVE!");
        setTimeout(() => setActiveEffect(null), 2000);
    }

    async function handleAnswer(option: string | null) {
        if (isTabHidden || showWrongScreen || isHacking || isHacked) return;
        if (timerRef.current) clearInterval(timerRef.current);

        const isCorrect = option === question.correctAnswer;
        setAnswersLog((prev: any) => [...prev, { question: question.prompt, correctAnswer: question.correctAnswer, studentAnswer: option || "Time Out", isCorrect }]);

        if (isCorrect) {
            let points = 10;
            let newStreak = streak + 1;
            setStreak(newStreak);
            if (activeEffect === "2x POINTS ACTIVE!") points = 20;
            if (newStreak >= 3) points += 10;

            let newScore = score + points;
            setScore(newScore);
            if (onScoreUpdate) onScoreUpdate(newScore);

            // 🚨 Trigger Hack Event in Cyber Mode
            if (gameMode === 'hacker' && Math.random() > 0.5) {
                const passOptions = ["ALPHA", "BETA", "GAMMA", "DELTA"];
                setSecretPassword(passOptions[Math.floor(Math.random() * passOptions.length)]);
                setIsHacking(true);
                return;
            }
            moveToNextQuestion();
        } else {
            setStreak(0);
            setShowWrongScreen(true);
            setCanClickContinue(false);
            wrongTimeoutRef.current = setTimeout(() => setCanClickContinue(true), 3000);
        }
    }

    function moveToNextQuestion() {
        setCurrentQ((currentQ + 1) % gameData.questions.length);
    }

    function handleContinueClick() {
        if (!canClickContinue) return;
        setShowWrongScreen(false);
        moveToNextQuestion();
    }

    // 🚨 Victim Patch Logic
    function handlePatchClick() {
        const newClicks = patchClicks + 1;
        setPatchClicks(newClicks);
        if (newClicks >= 5) {
            setIsHacked(false);
            setPatchClicks(0);
            moveToNextQuestion();
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white p-6 relative overflow-hidden">
            {/* TAB HIDDEN */}
            {isTabHidden && <div className="absolute inset-0 z-[100] bg-red-600/95 flex flex-col items-center justify-center"><EyeOff className="w-24 h-24 mb-6" /><h1 className="text-5xl font-black">DON'T LEAVE THE GAME!</h1></div>}

            {/* RED X WRONG ANSWER */}
            {showWrongScreen && (
                <div onClick={handleContinueClick} className={`absolute inset-0 z-[80] flex flex-col items-center justify-center bg-red-600 ${canClickContinue ? 'cursor-pointer' : 'cursor-default'}`}>
                    <h1 className="text-8xl font-black text-white mb-4">X</h1>
                    {canClickContinue ? <p className="text-xl font-bold animate-pulse bg-black/20 px-6 py-3 rounded-xl">Click to continue</p> : <p className="text-xl font-bold text-white/50">Wait...</p>}
                </div>
            )}

            {/* 🚨 HACKING SCREEN (Attacker) */}
            {isHacking && (
                <div className="absolute inset-0 z-[90] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md p-4">
                    <Terminal className="w-16 h-16 text-emerald-500 mb-4 animate-pulse" />
                    <h2 className="text-4xl font-mono text-emerald-500 mb-8">BREACH DETECTED. GUESS THE PASSWORD.</h2>
                    <div className="flex gap-4">
                        {["ALPHA", "BETA", "GAMMA", "DELTA"].map(pass => (
                            <button
                                key={pass}
                                onClick={async () => {
                                    if (pass === secretPassword) {
                                        setActiveEffect("HACK SUCCESSFUL! +50% GOLD");
                                        if (onTakeGold) {
                                            const newScore = await onTakeGold(50, score); // Steal 50%!
                                            setScore(newScore);
                                            if (onScoreUpdate) onScoreUpdate(newScore);
                                        }
                                    } else {
                                        setActiveEffect("HACK FAILED!");
                                    }
                                    setTimeout(() => { setActiveEffect(null); setIsHacking(false); moveToNextQuestion(); }, 2000);
                                }}
                                className="bg-emerald-900/50 border-2 border-emerald-500 text-emerald-400 font-mono text-xl px-8 py-4 rounded-xl hover:bg-emerald-500 hover:text-black transition-all"
                            >
                                {pass}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 🚨 HACKED SCREEN (Victim) */}
            {isHacked && (
                <div className="absolute inset-0 z-[90] bg-slate-900 flex flex-col items-center justify-center">
                    <Lock className="w-24 h-24 text-red-500 mb-4" />
                    <h2 className="text-4xl font-black text-red-500 mb-4">SYSTEM LOCKED</h2>
                    <p className="text-slate-400 mb-8">A hacker stole your credits! Patch the breach.</p>
                    <button onClick={handlePatchClick} className="bg-slate-800 border-2 border-slate-600 px-8 py-4 rounded-xl text-xl font-bold hover:bg-slate-700">
                        PATCHING... ({patchClicks}/5)
                    </button>
                </div>
            )}

            {/* EFFECT OVERLAY */}
            {activeEffect && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80"><h2 className="text-6xl font-black text-white">{activeEffect}</h2></div>}

            {/* UI */}
            <div className="flex justify-between items-center mb-6 z-10">
                <span className="text-sm font-bold bg-indigo-600 px-4 py-2 rounded-xl">Score: {score}</span>
                {streak > 0 && <span className="flex items-center gap-1 text-orange-400 font-bold bg-orange-950 px-4 py-2 rounded-xl"><Flame className="w-5 h-5 fill-current" /> {streak}</span>}
            </div>

            <div className="w-full bg-slate-800 h-3 rounded-full mb-8 z-10"><div className={`h-full ${timeLeft < 5 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${(timeLeft / 15) * 100}%` }}></div></div>

            <div className="flex justify-center gap-4 mb-10 z-10">
                <button onClick={() => useAbility('timeFreeze')} disabled={abilities.timeFreeze <= 0} className="p-3 bg-blue-900/50 rounded-xl border-2 border-blue-500"><Clock /></button>
                <button onClick={() => useAbility('doublePoints')} disabled={abilities.doublePoints <= 0} className="p-3 bg-emerald-900/50 rounded-xl border-2 border-emerald-500"><Sparkles /></button>
                <button onClick={() => useAbility('shield')} disabled={abilities.shield <= 0} className="p-3 bg-purple-900/50 rounded-xl border-2 border-purple-500"><Shield /></button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center z-10">
                <h1 className="text-4xl font-black mb-12">{question.prompt}</h1>
                <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
                    {question.options.map((opt: string, i: number) => (
                        <button key={i} onClick={() => handleAnswer(opt)} className={`bg-blue-600 p-8 rounded-2xl text-2xl font-bold hover:bg-blue-500`}>{opt}</button>
                    ))}
                </div>
            </div>
        </div>
    );
}