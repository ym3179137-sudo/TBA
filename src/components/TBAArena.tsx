"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, Clock, Shield, Sparkles, EyeOff, Rocket, Key, Lock, Unlock, Zap, Star } from "lucide-react";

// 🚨 100+ FUN, KID-FRIENDLY SECRET CODES
const ALL_PASSWORDS = [
    "PIZZA-PARTY", "ROCKET-SHIP", "NEON-CAT", "DINO-ROAR", "SUPER-HERO",
    "JELLY-BEAN", "ICE-CREAM", "MOON-BOUNCE", "TURBO-SNAIL", "MEGA-CHEESE",
    "STAR-POWER", "GALAXY-QUEST", "SPACE-MONKEY", "ALIEN-FRIEND", "ROBOT-DANCE",
    "PIXEL-POWER", "RAINBOW-DASH", "CANDY-CRUSH", "SUPER-NOVA", "LASER-BEAM",
    "MAGIC-WAND", "DRAGON-FLY", "PIRATE-GOLD", "NINJA-TURTLE", "UNICORN-HORN",
    "BUBBLE-GUM", "FLYING-SAUCER", "PLANET-MARS", "COMET-STRIKE", "ASTRO-BLAST",
    "METEOR-SHOWER", "BLACK-HOLE", "WARP-SPEED", "TIME-TRAVEL", "HYPER-SPACE",
    "ZERO-GRAVITY", "SPACE-STATION", "LUNAR-MOON", "SUN-FLARE", "STAR-DUST",
    "COSMIC-WAVE", "NEBULA-CLOUD", "GALAXY-CORE", "QUASAR-BEAM", "PULSAR-STAR",
    "NEUTRON-BOMB", "SUPER-MASSIVE", "DARK-MATTER", "LIGHT-YEAR", "SOLAR-WIND",
    "ORBIT-SPIN", "GRAVITY-PULL", "ECLIPSE-SHADOW", "CRATER-LAKE", "RING-PLANET",
    "MOON-WALK", "SPACE-SUIT", "HELMET-VISOR", "OXYGEN-TANK", "FUEL-CELL",
    "JET-PACK", "ROCKET-BOOST", "TURBO-ENGINE", "WARP-DRIVE", "ION-THRUSTER",
    "PLASMA-CANNON", "LASER-SWORD", "PHASER-GUN", "ENERGY-SHIELD", "FORCE-FIELD",
    "CLOAKING-DEVICE", "TELEPORTER", "TRANSPORTER", "REPLICATOR", "HOLOGRAM"
];

const PALS = [
    { id: "glitch", name: "Glitch", emoji: "👾", effect: "nothing", weight: 3, desc: "Broken data. Nothing gained." },
    { id: "pip", name: "Pip", emoji: "🐣", effect: "add", amount: 10, weight: 4, desc: "+10 Stardust collected." },
    { id: "munch", name: "Munch", emoji: "🟢", effect: "add", amount: 20, weight: 15, desc: "+20 Stardust collected." },
    { id: "bounce", name: "Bounce", emoji: "🟡", effect: "add", amount: 30, weight: 15, desc: "+30 Stardust collected." },
    { id: "nimbus", name: "Nimbus", emoji: "☁️", effect: "add", amount: 50, weight: 14, desc: "+50 Stardust collected." },
    { id: "twin", name: "Twin", emoji: "👯", effect: "double", weight: 9, desc: "DOUBLE YOUR STARDUST!" },
    { id: "trine", name: "Trine", emoji: "💎", effect: "triple", weight: 5, desc: "TRIPLE YOUR STARDUST!" },
    { id: "rift", name: "Rift", emoji: "🌀", effect: "hack", weight: 9, desc: "WORMHOLE OPENED. Raid a player!" },
];

export default function TBAArena({
    gameData, gameMode, onScoreUpdate, onGameEnd, isPreview
}: any) {
    if (gameMode === 'hacker') {
        return <StarVaultArena gameData={gameData} onScoreUpdate={onScoreUpdate} onGameEnd={onGameEnd} isPreview={isPreview} />;
    }
    return <ClassicArena gameData={gameData} onScoreUpdate={onScoreUpdate} onGameEnd={onGameEnd} isPreview={isPreview} />;
}

// ==========================================
// 🚨 STAR VAULT (KID-FRIENDLY HACKER MODE)
// ==========================================
function StarVaultArena({ gameData, onScoreUpdate, onGameEnd }: any) {
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

    // Pick 5 random passwords on mount
    useEffect(() => {
        const shuffled = [...ALL_PASSWORDS].sort(() => 0.5 - Math.random());
        setSelectedPasswords(shuffled.slice(0, 5));
    }, []);

    if (!gameData || !gameData.questions) return null;
    const question = gameData.questions[currentQ];

    const handleAnswer = (option: string) => {
        const isCorrect = option === question.correctAnswer;
        setAnswersLog((prev: any) => [...prev, { question: question.prompt, correctAnswer: question.correctAnswer, studentAnswer: option, isCorrect }]);

        if (isCorrect) {
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
            moveToNextQuestion();
        }
    };

    const applyReward = () => {
        if (rolledPal.effect === "hack") {
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
        const isSuccess = Math.random() > 0.66;
        if (isSuccess) {
            setHackResult("success");
            const newScore = score + Math.floor(score * 0.25);
            setScore(newScore);
            onScoreUpdate(newScore);
        } else {
            setHackResult("fail");
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
        // 🚨 FIXED: Loops questions continuously so it never freezes if there is only 1 question
        const nextQ = (currentQ + 1) % gameData.questions.length;
        setCurrentQ(nextQ);
        setPhase("question");
        setHackResult(null);
        setRolledPal(null);
        setPatchClicks(0);
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#0a0514] p-6 font-sans overflow-hidden text-cyan-400">
            {/* Background Stars */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>

            {/* Show Secret Code Header */}
            {phase !== "password_select" && (
                <div className="absolute top-6 left-6 bg-black/50 border border-cyan-800 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.3)] z-50">
                    <Key className="w-5 h-5 text-amber-400" />
                    <span className="text-slate-300 font-bold">Your Secret Code:</span>
                    <span className="text-amber-400 font-black tracking-widest">{secretPassword}</span>
                </div>
            )}

            {/* PHASE: SECRET CODE SELECT */}
            {phase === "password_select" && (
                <div className="z-10 flex flex-col items-center w-full max-w-4xl animate-in zoom-in">
                    <Rocket className="w-24 h-24 mb-6 text-purple-400 animate-bounce" />
                    <h1 className="text-4xl md:text-5xl font-black mb-4 text-white text-center drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                        SECURE YOUR STAR VAULT
                    </h1>
                    <p className="text-slate-400 mb-10 text-center max-w-lg text-lg">
                        Choose a Secret Code. If an alien tries to raid your vault, they have to guess this exact code!
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
                        {selectedPasswords.map(pass => (
                            <button key={pass} onClick={() => { setSecretPassword(pass); setPhase("question"); }} className="bg-slate-900 border-2 border-purple-700 hover:border-cyan-400 hover:bg-purple-900/40 text-cyan-300 font-bold py-4 rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] text-sm hover:-translate-y-1">
                                {pass}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* PHASE: QUESTION */}
            {phase === "question" && (
                <div className="w-full max-w-4xl z-10 animate-in fade-in slide-in-from-bottom-5">
                    <div className="flex justify-between items-center mb-8 bg-slate-900/80 border border-slate-700 p-4 rounded-2xl shadow-lg">
                        <span className="text-cyan-400 font-bold flex items-center gap-2"><Star className="w-5 h-5 fill-cyan-400" /> STARDUST COLLECTED</span>
                        <span className="text-amber-400 font-black text-2xl flex items-center gap-2"><Sparkles size={24} /> {score}</span>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-700 p-8 rounded-3xl shadow-2xl backdrop-blur-md">
                        <h2 className="text-3xl font-bold text-white text-center mb-8">{question.prompt}</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {question.options.map((opt: string, i: number) => (
                                <button key={i} onClick={() => handleAnswer(opt)} className="bg-indigo-900/50 border-2 border-indigo-600 hover:border-cyan-400 hover:bg-indigo-800 text-white font-bold py-6 rounded-2xl text-xl transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* PHASE: REWARD */}
            {phase === "reward" && (
                <div className="bg-slate-900 border-2 border-cyan-500 rounded-3xl p-10 text-center max-w-md w-full shadow-[0_0_60px_rgba(6,182,212,0.3)] z-10 animate-in zoom-in duration-300">
                    <h2 className="text-purple-400 mb-4 font-bold tracking-widest uppercase">Alien Pod Opened!</h2>
                    <div className="text-8xl mb-6 animate-bounce drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{rolledPal.emoji}</div>
                    <h1 className="text-4xl font-black text-white mb-2">{rolledPal.name}</h1>
                    <p className="text-amber-300 font-bold text-lg mb-8 bg-amber-900/30 p-3 rounded-xl border border-amber-700/50">
                        {rolledPal.desc}
                    </p>
                    <button onClick={applyReward} className="w-full bg-cyan-600 text-white hover:bg-cyan-500 font-black py-4 rounded-2xl text-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95">
                        {rolledPal.effect === 'hack' ? "RAID A PLAYER" : "COLLECT STARDUST"}
                    </button>
                </div>
            )}

            {/* PHASE: HACK */}
            {phase === "hack" && (
                <div className="z-10 flex flex-col items-center w-full max-w-md animate-in slide-in-from-bottom-10">
                    <Unlock className="w-20 h-20 mb-4 text-red-400 animate-pulse" />
                    <h1 className="text-3xl font-black mb-2 text-white text-center">CRACKING THEIR VAULT</h1>
                    <p className="text-cyan-300 mb-8 text-center text-sm bg-cyan-950/50 p-4 rounded-xl border border-cyan-800">
                        You found a wormhole! Select the correct Secret Code to steal 25% of their Stardust.
                    </p>

                    {!hackResult ? (
                        <div className="flex flex-col gap-3 w-full">
                            {hackOptions.map(opt => (
                                <button key={opt} onClick={() => submitHack(opt)} className="bg-slate-900 border-2 border-purple-700 text-cyan-300 font-bold py-4 rounded-xl hover:bg-purple-900/40 transition-all text-center tracking-widest">
                                    {opt}
                                </button>
                            ))}
                            <button onClick={() => setHackResult("fail")} className="text-slate-500 hover:text-red-400 mt-6 text-sm text-center font-bold">
                                [ CANCEL RAID ]
                            </button>
                        </div>
                    ) : (
                        <div className="text-center w-full animate-in zoom-in">
                            {hackResult === 'success' ? (
                                <div className="border-2 border-emerald-500 bg-emerald-950/40 p-8 rounded-3xl shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                    <Zap className="w-20 h-20 mx-auto text-emerald-400 mb-4" />
                                    <h2 className="text-3xl font-black text-white mb-2">VAULT CRACKED!</h2>
                                    <p className="text-emerald-300 mb-8 font-bold">Stardust successfully stolen.</p>
                                </div>
                            ) : (
                                <div className="border-2 border-red-500 bg-red-950/40 p-8 rounded-3xl">
                                    <Lock className="w-20 h-20 mx-auto text-red-500 mb-4" />
                                    <h2 className="text-3xl font-black text-white mb-2">CODE FAILED</h2>
                                    <p className="text-red-300 mb-8 font-bold">Wrong code. The vault locked you out.</p>
                                </div>
                            )}
                            <button onClick={moveToNextQuestion} className="w-full bg-indigo-600 text-white py-4 mt-4 hover:bg-indigo-500 font-bold rounded-xl transition-all">
                                CONTINUE
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* PHASE: HACKED (VICTIM) */}
            {phase === "hacked" && (
                <div className="z-10 flex flex-col items-center animate-flicker">
                    <Lock className="w-32 h-32 mb-6 text-red-500 animate-bounce drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]" />
                    <h1 className="text-5xl md:text-6xl font-black mb-4 text-white text-center">VAULT LOCKED</h1>
                    <p className="text-red-200 mb-10 text-center max-w-md text-lg">
                        An alien raided your vault! Rapidly press the button to reboot your system.
                    </p>
                    <button onClick={handlePatchClick} className="bg-slate-900 border-4 border-red-500 text-red-500 font-black px-12 py-8 rounded-full text-2xl hover:bg-red-500 hover:text-white transition-all transform active:scale-90 shadow-[0_0_40px_rgba(239,68,68,0.5)]">
                        REBOOT ({patchClicks}/10)
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

            // Loop questions safely
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