"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, Clock, Shield, Sparkles, EyeOff, Terminal, Fingerprint, Lock, CheckCircle, AlertTriangle, Cpu } from "lucide-react";

// 🚨 THE MASSIVE PASSWORD POOL
const ALL_PASSWORDS = [
    "PIZZA-PARTY", "ROCKET-SHIP", "NEON-CAT", "DINO-ROAR", "SUPER-HERO",
    "JELLY-BEAN", "ICE-CREAM", "MOON-BOUNCE", "TURBO-SNAIL", "MEGA-CHEESE",
    "STAR-POWER", "GALAXY-QUEST", "SPACE-MONKEY", "ALIEN-FRIEND", "ROBOT-DANCE",
    "PIXEL-POWER", "RAINBOW-DASH", "CANDY-CRUSH", "SUPER-NOVA", "LASER-BEAM"
];

const PALS = [
    { id: "junkbit", name: "Junkbit", emoji: "🗑️", effect: "nothing", weight: 3, desc: "Corrupted data. Nothing gained." },
    { id: "pip", name: "Pip", emoji: "🐣", effect: "add", amount: 10, weight: 4, desc: "+10 Credits extracted." },
    { id: "munch", name: "Munch", emoji: "🟢", effect: "add", amount: 20, weight: 15, desc: "+20 Credits extracted." },
    { id: "bounce", name: "Bounce", emoji: "🟡", effect: "add", amount: 30, weight: 15, desc: "+30 Credits extracted." },
    { id: "nimbus", name: "Nimbus", emoji: "☁️", effect: "add", amount: 50, weight: 14, desc: "+50 Credits extracted." },
    { id: "twin", name: "Twin", emoji: "👯", effect: "double", weight: 9, desc: "DOUBLE YOUR CREDITS!" },
    { id: "trine", name: "Trine", emoji: "💎", effect: "triple", weight: 5, desc: "TRIPLE YOUR CREDITS!" },
    { id: "rift", name: "Rift", emoji: "🌀", effect: "hack", weight: 9, desc: "EXPLOIT FOUND. Trigger a hack." },
];

export default function TBAArena({ gameData, gameMode, onScoreUpdate, onGameEnd, isPreview }: any) {
    // Route to the correct game mode
    if (gameMode === 'hacker') {
        return <CryptoHackArena gameData={gameData} onScoreUpdate={onScoreUpdate} onGameEnd={onGameEnd} />;
    }
    return <ClassicArena gameData={gameData} onScoreUpdate={onScoreUpdate} onGameEnd={onGameEnd} isPreview={isPreview} />;
}

// ==========================================
// 🚨 CRYPTO HACK MODE (BLOOKET STYLE)
// ==========================================
function CryptoHackArena({ gameData, onScoreUpdate, onGameEnd }: any) {
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [answersLog, setAnswersLog] = useState<any[]>([]);
    const [phase, setPhase] = useState<"password_select" | "question" | "reward" | "hack" | "hacked">("password_select");

    const [secretPassword, setSecretPassword] = useState("");
    const [selectedPasswords, setSelectedPasswords] = useState<string[]>([]);
    const [rolledPal, setRolledPal] = useState<any>(null);
    const [hackOptions, setHackOptions] = useState<string[]>([]);
    const [hackResult, setHackResult] = useState<"success" | "fail" | null>(null);
    const [patchClicks, setPatchClicks] = useState(0);

    useEffect(() => {
        // Pick 5 random passwords for this game
        const shuffled = [...ALL_PASSWORDS].sort(() => 0.5 - Math.random());
        setSelectedPasswords(shuffled.slice(0, 5));
    }, []);

    if (!gameData || !gameData.questions) return null;
    const question = gameData.questions[currentQ];

    const handleAnswer = (option: string) => {
        const isCorrect = option === question.correctAnswer;
        setAnswersLog((prev: any) => [...prev, { question: question.prompt, correctAnswer: question.correctAnswer, studentAnswer: option, isCorrect }]);

        if (isCorrect) {
            // Roll for a Pal (weighted out of 74)
            const roll = Math.floor(Math.random() * 74);
            let cum = 0;
            let selected = PALS[0];
            for (const p of PALS) {
                cum += p.weight;
                if (roll < cum) { selected = p; break; }
            }
            setRolledPal(selected);
            setPhase("reward");
        } else {
            // If they get the answer wrong, simulate a 10% chance they get hacked
            if (Math.random() < 0.1) {
                setPhase("hacked");
            } else {
                moveToNextQuestion();
            }
        }
    };

    const applyReward = () => {
        if (rolledPal.effect === "hack") {
            // Pick 3 random passwords for the hack screen (the correct one is NOT guaranteed to be in the list, just like Blooket)
            const options = [...ALL_PASSWORDS].sort(() => 0.5 - Math.random()).slice(0, 3);
            setHackOptions(options);
            setPhase("hack");
        } else {
            let newScore = score;
            if (rolledPal.effect === "add") newScore += rolledPal.amount;
            if (rolledPal.effect === "double") newScore *= 2;
            if (rolledPal.effect === "triple") newScore *= 3;

            setScore(newScore);
            onScoreUpdate(newScore);
            moveToNextQuestion();
        }
    };

    const submitHack = (guess: string) => {
        // 33% chance to guess the password correctly
        const isSuccess = Math.random() > 0.66;
        if (isSuccess) {
            setHackResult("success");
            const stolen = Math.floor(score * 0.25);
            const newScore = score + stolen;
            setScore(newScore);
            onScoreUpdate(newScore);
        } else {
            setHackResult("fail");
            // If you fail a hack, the system locks you out!
            setTimeout(() => {
                setPhase("hacked");
            }, 2000);
        }
    };

    const handlePatchClick = () => {
        const newClicks = patchClicks + 1;
        setPatchClicks(newClicks);
        if (newClicks >= 10) {
            moveToNextQuestion();
        }
    };

    const moveToNextQuestion = () => {
        const nextQ = (currentQ + 1) % gameData.questions.length;
        setCurrentQ(nextQ);
        setPhase("question");
        setHackResult(null);
        setRolledPal(null);
        setPatchClicks(0);
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-black p-6 font-mono overflow-hidden text-green-500">
            <div className="crt-overlay" />

            {/* PHASE 1: SECURE VAULT */}
            {phase === "password_select" && (
                <div className="z-10 flex flex-col items-center w-full max-w-3xl animate-in zoom-in">
                    <Shield className="w-24 h-24 mb-6 text-green-500 animate-pulse" />
                    <h1 className="text-4xl md:text-5xl font-black mb-2 text-green-400 glitch-text text-center" data-text="SECURE YOUR VAULT">
                        SECURE YOUR VAULT
                    </h1>
                    <p className="text-green-700 mb-10 text-center max-w-lg">
                        Select one passkey from the 5 generated below. If an enemy breaches your firewall, they must guess this exact key.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
                        {selectedPasswords.map(pass => (
                            <button key={pass} onClick={() => { setSecretPassword(pass); setPhase("question"); }} className="bg-black border-2 border-green-800 hover:border-green-400 hover:bg-green-900/20 hover:text-green-300 text-green-600 font-bold py-4 rounded transition-all text-sm shadow-[0_0_10px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                                {pass}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* PHASE 2: QUESTION */}
            {phase === "question" && (
                <div className="w-full max-w-4xl z-10 animate-in fade-in">
                    <div className="flex justify-between items-center mb-8 border-b border-green-900 pb-4">
                        <span className="text-green-500 font-bold flex items-center gap-2 animate-pulse"><Terminal size={18} /> DATA_MINING_PHASE</span>
                        <span className="text-cyan-400 font-bold text-xl flex items-center gap-2"><Cpu size={18} /> {score} CR</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-green-300 text-center mb-8">{question.prompt}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {question.options.map((opt: string, i: number) => (
                            <button key={i} onClick={() => handleAnswer(opt)} className="bg-black border border-green-800 hover:bg-green-900/40 text-green-400 font-bold py-6 rounded text-xl transition-all hover:shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* PHASE 3: REWARD */}
            {phase === "reward" && (
                <div className="bg-black border-2 border-green-500 rounded-lg p-10 text-center max-w-md w-full shadow-[0_0_50px_rgba(34,197,94,0.3)] z-10 animate-in zoom-in duration-300">
                    <h2 className="text-green-700 mb-4 uppercase tracking-[0.2em]">Data Packet Decrypted</h2>
                    <div className="text-8xl mb-6 animate-bounce">{rolledPal.emoji}</div>
                    <h1 className="text-4xl font-black text-green-400 mb-2">{rolledPal.name}</h1>
                    <p className="text-cyan-400 font-bold text-lg mb-8 border border-cyan-900 bg-cyan-950/30 p-2 rounded">{rolledPal.desc}</p>
                    <button onClick={applyReward} className={`w-full bg-green-900 text-green-300 hover:bg-green-500 hover:text-black font-black py-4 rounded text-lg border-2 transition-all uppercase tracking-widest ${rolledPal.effect === 'hack' ? 'border-red-500 text-red-500 hover:bg-red-500' : 'border-green-500'}`}>
                        {rolledPal.effect === 'hack' ? "EXECUTE EXPLOIT" : "EXTRACT DATA"}
                    </button>
                </div>
            )}

            {/* PHASE 4: HACK */}
            {phase === "hack" && (
                <div className="z-10 flex flex-col items-center w-full max-w-md animate-in slide-in-from-bottom-10">
                    <Fingerprint className="w-20 h-20 mb-4 text-red-500 animate-pulse" />
                    <h1 className="text-3xl font-black mb-2 text-red-500 text-center">BREACHING FIREWALL</h1>
                    <p className="text-green-700 mb-8 text-center text-sm">&gt; Bypassing security protocols...<br />&gt; Select correct passkey to steal 25% Credits.</p>
                    {!hackResult ? (
                        <div className="flex flex-col gap-3 w-full">
                            {hackOptions.map(opt => (
                                <button key={opt} onClick={() => submitHack(opt)} className="bg-black border border-green-800 text-green-500 font-bold py-4 rounded hover:bg-green-900/30 hover:text-green-300 transition-all text-left px-6">
                                    &gt; INPUT_KEY: {opt}
                                </button>
                            ))}
                            <button onClick={() => setHackResult("fail")} className="text-slate-600 hover:text-red-500 mt-6 text-sm text-center">[ ABORT SEQUENCE ]</button>
                        </div>
                    ) : (
                        <div className="text-center w-full animate-in zoom-in">
                            {hackResult === 'success' ? (
                                <div className="border border-green-500 bg-green-900/20 p-8 rounded">
                                    <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
                                    <h2 className="text-3xl font-black text-green-400 mb-2">ACCESS GRANTED</h2>
                                    <p className="text-green-300 mb-8 font-bold">Credits successfully stolen.</p>
                                    <button onClick={moveToNextQuestion} className="w-full bg-green-900 text-green-300 border border-green-500 py-3 hover:bg-green-500 hover:text-black font-bold">CONTINUE</button>
                                </div>
                            ) : (
                                <div className="border border-red-500 bg-red-900/20 p-8 rounded">
                                    <AlertTriangle className="w-20 h-20 mx-auto text-red-500 mb-4" />
                                    <h2 className="text-3xl font-black text-red-500 mb-2">ACCESS DENIED</h2>
                                    <p className="text-red-300 mb-8 font-bold">Incorrect passkey. Trace detected.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* PHASE 5: HACKED (VICTIM RECOVERY) */}
            {phase === "hacked" && (
                <div className="z-10 flex flex-col items-center animate-flicker">
                    <Lock className="w-32 h-32 mb-6 text-red-500 animate-bounce" />
                    <h1 className="text-5xl md:text-6xl font-black mb-4 text-red-500 text-center glitch-text" data-text="SYSTEM LOCKED">SYSTEM LOCKED</h1>
                    <p className="text-red-200 mb-10 text-center max-w-md">&gt; UNAUTHORIZED ACCESS DETECTED.<br />&gt; Rapidly execute patch protocol to restore connection.</p>
                    <button onClick={handlePatchClick} className="bg-black border-2 border-red-500 text-red-500 font-black px-12 py-8 rounded-lg text-2xl hover:bg-red-500 hover:text-black transition-all transform active:scale-95 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                        EXECUTE PATCH ({patchClicks}/10)
                    </button>
                </div>
            )}
        </div>
    );
}

// ==========================================
// 🚨 CLASSIC MODE (NORMAL QUIZ)
// ==========================================
function ClassicArena({ gameData, onScoreUpdate, onGameEnd, isPreview }: any) {
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [answersLog, setAnswersLog] = useState<any[]>([]);

    const [abilities, setAbilities] = useState({ timeFreeze: 1, doublePoints: 1, shield: 1 });
    const [activeEffect, setActiveEffect] = useState<string | null>(null);
    const [isTabHidden, setIsTabHidden] = useState(false);
    const [showWrongScreen, setShowWrongScreen] = useState(false);
    const [canClickContinue, setCanClickContinue] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const wrongTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isPreview) return;
        const handleVisibilityChange = () => setIsTabHidden(document.hidden);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isPreview]);

    useEffect(() => {
        if (!gameData || isTabHidden || showWrongScreen) return;
        setTimeLeft(15);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { clearInterval(timerRef.current!); handleAnswer(null); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [currentQ, gameData, isTabHidden, showWrongScreen]);

    if (!gameData || !gameData.questions) return null;
    const question = gameData.questions[currentQ];

    function useAbility(type: "timeFreeze" | "doublePoints" | "shield") {
        if (abilities[type] <= 0 || isTabHidden || showWrongScreen) return;
        setAbilities(prev => ({ ...prev, [type]: prev[type] - 1 }));
        if (type === 'timeFreeze') { setTimeLeft(prev => prev + 10); setActiveEffect("TIME FROZEN! +10s"); }
        if (type === 'doublePoints') setActiveEffect("2x POINTS ACTIVE!");
        if (type === 'shield') setActiveEffect("SHIELD ACTIVE!");
        setTimeout(() => setActiveEffect(null), 2000);
    }

    async function handleAnswer(option: string | null) {
        if (isTabHidden || showWrongScreen) return;
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

            setCurrentQ((currentQ + 1) % gameData.questions.length);
        } else {
            setStreak(0);
            setShowWrongScreen(true);
            setCanClickContinue(false);
            wrongTimeoutRef.current = setTimeout(() => setCanClickContinue(true), 3000);
        }
    }

    function handleContinueClick() {
        if (!canClickContinue) return;
        setShowWrongScreen(false);
        setCurrentQ((currentQ + 1) % gameData.questions.length);
    }

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white p-6 relative overflow-hidden">
            {isTabHidden && <div className="absolute inset-0 z-[100] bg-red-600/95 flex flex-col items-center justify-center"><EyeOff className="w-24 h-24 mb-6" /><h1 className="text-5xl font-black">DON'T LEAVE THE GAME!</h1></div>}

            {showWrongScreen && (
                <div onClick={handleContinueClick} className={`absolute inset-0 z-[80] flex flex-col items-center justify-center bg-red-600 ${canClickContinue ? 'cursor-pointer' : 'cursor-default'}`}>
                    <h1 className="text-8xl font-black text-white mb-4">X</h1>
                    {canClickContinue ? <p className="text-xl font-bold animate-pulse bg-black/20 px-6 py-3 rounded-xl">Click to continue</p> : <p className="text-xl font-bold text-white/50">Wait...</p>}
                </div>
            )}

            {activeEffect && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80"><h2 className="text-6xl font-black text-white">{activeEffect}</h2></div>}

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