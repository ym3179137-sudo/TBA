"use client";

import { useState, useEffect, useRef } from "react";
import { Flame, Clock, Shield, Sparkles, EyeOff, Terminal, Fingerprint, Lock, CheckCircle, AlertTriangle, Cpu, Skull, Crosshair, Coins, Gift, Fish, Anchor, Waves } from "lucide-react";
import { THEMES } from "@/lib/themes";
import { createClient } from "@/lib/supabase/client";

// --- CRYPTO HACK DATA ---
const ALL_PASSWORDS = ["PIZZA-PARTY", "ROCKET-SHIP", "NEON-CAT", "DINO-ROAR", "SUPER-HERO", "JELLY-BEAN", "ICE-CREAM", "MOON-BOUNCE", "TURBO-SNAIL", "MEGA-CHEESE"];
const PALS = [
    { id: "junkbit", name: "Junkbit", emoji: "🗑️", effect: "nothing", weight: 3, desc: "Corrupted data. Nothing gained." },
    { id: "pip", name: "Pip", emoji: "🐣", effect: "add", amount: 10, weight: 4, desc: "+10 Credits extracted." },
    { id: "munch", name: "Munch", emoji: "🟢", effect: "add", amount: 20, weight: 15, desc: "+20 Credits extracted." },
    { id: "bounce", name: "Bounce", emoji: "🟡", effect: "add", amount: 30, weight: 15, desc: "+30 Credits extracted." },
    { id: "rift", name: "Rift", emoji: "🌀", effect: "hack", weight: 9, desc: "EXPLOIT FOUND. Trigger a hack." },
];

export default function TBAArena({ gameData, gameMode, onScoreUpdate, onGameEnd, isPreview }: any) {
    const themeId = gameData?.theme || "classic";
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    const supabase = createClient();

    // Get Pin and Name safely
    let myPin = "";
    if (typeof window !== "undefined") {
        const parts = window.location.pathname.split("/");
        myPin = parts[parts.length - 1]; // Extracts the PIN from /play/123456
    }

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return "";
    };
    const myName = decodeURIComponent(getCookie("student_name") || "Student");

    // 🚨 Emoji Sender
    const sendEmoji = (emoji: string) => {
        if (!myPin) return;
        supabase.channel(`game-feed-${myPin}`).send({
            type: 'broadcast', event: 'emoji', payload: { emoji, sender: myName }
        });
    };

    // 🚨 Live Event Sender
    const sendFeedEvent = (message: string) => {
        if (!myPin) return;
        supabase.channel(`game-feed-${myPin}`).send({
            type: 'broadcast', event: 'feed_event', payload: { message }
        });
    };

    // 🚨 Emoji Bar Component
    const EmojiBar = () => (
        <div className="absolute bottom-4 right-4 z-[100] flex gap-2 bg-black/40 p-2 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto">
            {["🔥", "😂", "😭", "👑", "🤯"].map(e => (
                <button key={e} onClick={() => sendEmoji(e)} className="text-3xl hover:scale-125 transition-transform active:scale-95 drop-shadow-md">
                    {e}
                </button>
            ))}
        </div>
    );

    if (gameMode === 'hacker') return <CryptoHackArena gameData={gameData} onScoreUpdate={onScoreUpdate} myName={myName} myPin={myPin} sendFeedEvent={sendFeedEvent} EmojiBar={<EmojiBar />} />;
    if (gameMode === 'gold_quest') return <GoldQuestArena gameData={gameData} theme={theme} onScoreUpdate={onScoreUpdate} myName={myName} sendFeedEvent={sendFeedEvent} EmojiBar={<EmojiBar />} />;
    if (gameMode === 'fishing_frenzy') return <FishingFrenzyArena gameData={gameData} theme={theme} onScoreUpdate={onScoreUpdate} myName={myName} sendFeedEvent={sendFeedEvent} EmojiBar={<EmojiBar />} />;
    return <ClassicArena gameData={gameData} theme={theme} onScoreUpdate={onScoreUpdate} isPreview={isPreview} EmojiBar={<EmojiBar />} />;
}

// ==========================================
// 🚨 CRYPTO HACK ARENA (Targeting System)
// ==========================================
function CryptoHackArena({ gameData, onScoreUpdate, myName, myPin, sendFeedEvent, EmojiBar }: any) {
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [answersLog, setAnswersLog] = useState<any[]>([]);
    const [phase, setPhase] = useState<"password_select" | "question" | "reward" | "target" | "hack" | "hacked">("password_select");

    const [selectedPasswords, setSelectedPasswords] = useState<string[]>([]);
    const [rolledPal, setRolledPal] = useState<any>(null);
    const [hackOptions, setHackOptions] = useState<string[]>([]);
    const [hackResult, setHackResult] = useState<"success" | "fail" | null>(null);
    const [patchClicks, setPatchClicks] = useState(0);

    const [opponents, setOpponents] = useState<any[]>([]);
    const [targetPlayer, setTargetPlayer] = useState<any>(null);

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
            const roll = Math.floor(Math.random() * 100);
            let selected = roll < 10 ? PALS[0] : roll < 50 ? PALS[1] : roll < 80 ? PALS[2] : PALS[3];
            if (roll > 90) selected = PALS[4]; // Hack Pal
            setRolledPal(selected);
            setPhase("reward");
        } else {
            if (Math.random() < 0.1) setPhase("hacked");
            else moveToNextQuestion();
        }
    };

    const applyReward = async () => {
        if (rolledPal.effect === "hack") {
            const supabase = createClient();
            const { data } = await supabase.from("game_results").select("student_name, score").eq("game_pin", myPin).neq("student_name", myName).order("score", { ascending: false }).limit(5);
            setOpponents(data || []);
            setPhase("target");
        } else {
            let newScore = score;
            if (rolledPal.effect === "add") newScore += rolledPal.amount;
            setScore(newScore);
            onScoreUpdate(newScore);
            sendFeedEvent(`⚡ ${myName} found ${rolledPal.name} (+${rolledPal.amount} pts)`);
            moveToNextQuestion();
        }
    };

    const initiateHack = (opponent: any) => {
        setTargetPlayer(opponent);
        const options = [...ALL_PASSWORDS].sort(() => 0.5 - Math.random()).slice(0, 3);
        setHackOptions(options);
        setPhase("hack");
    };

    const submitHack = (guess: string) => {
        const isSuccess = Math.random() > 0.5;
        if (isSuccess) {
            setHackResult("success");
            const newScore = score + Math.floor(targetPlayer.score * 0.25) || 50;
            setScore(newScore);
            onScoreUpdate(newScore);
            sendFeedEvent(`💀 ${myName} HACKED ${targetPlayer.student_name}!`);
        } else {
            setHackResult("fail");
            sendFeedEvent(`🛡️ ${targetPlayer.student_name} blocked ${myName}'s hack!`);
            setTimeout(() => setPhase("hacked"), 2000);
        }
    };

    const moveToNextQuestion = () => {
        const nextQ = (currentQ + 1) % gameData.questions.length;
        setCurrentQ(nextQ);
        setPhase("question");
        setHackResult(null);
        setRolledPal(null);
        setPatchClicks(0);
        setTargetPlayer(null);
    };

    const bgStyle = "bg-black min-h-screen relative overflow-hidden font-mono text-emerald-400";
    const btnStyle = "bg-black border-2 border-emerald-800 hover:border-emerald-400 hover:bg-emerald-900/20 text-emerald-500 font-bold py-4 rounded transition-all duration-200 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]";

    return (
        <div className={bgStyle}>
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            {EmojiBar}

            {phase === "target" && (
                <div className="z-10 flex flex-col items-center justify-center h-screen w-full max-w-md mx-auto animate-in zoom-in px-4">
                    <Crosshair className="w-20 h-20 mb-4 text-red-500 animate-spin-slow" />
                    <h1 className="text-3xl font-black mb-2 text-red-500 text-center drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">SELECT A TARGET</h1>
                    <p className="text-emerald-700 mb-8 text-center text-sm">Choose an opponent to steal their credits.</p>
                    <div className="flex flex-col gap-3 w-full">
                        {opponents.length === 0 ? (
                            <p className="text-center text-slate-500">No opponents found!</p>
                        ) : (
                            opponents.map((opp, i) => (
                                <button key={i} onClick={() => initiateHack(opp)} className={`${btnStyle} flex justify-between items-center px-6`}>
                                    <span>{opp.student_name}</span>
                                    <span className="text-xs text-cyan-400">{opp.score} pts</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {phase === "password_select" && (
                <div className="z-10 flex flex-col items-center justify-center h-screen w-full max-w-3xl mx-auto animate-in zoom-in px-4">
                    <Shield className="w-24 h-24 mb-6 text-emerald-500 animate-pulse" />
                    <h1 className="text-4xl md:text-5xl font-black mb-2 text-emerald-400 text-center drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">SECURE YOUR VAULT</h1>
                    <p className="text-emerald-700 mb-10 text-center max-w-lg">&gt; INITIALIZING SECURE CONNECTION...<br />&gt; Select one passkey from the 5 generated below.</p>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
                        {selectedPasswords.map(pass => (
                            <button key={pass} onClick={() => { setPhase("question"); }} className={`${btnStyle} text-sm`}>{pass}</button>
                        ))}
                    </div>
                </div>
            )}

            {phase === "question" && (
                <div className="w-full max-w-4xl z-10 animate-in fade-in flex flex-col items-center justify-center h-screen mx-auto px-4">
                    <div className="w-full flex justify-between items-center mb-8 border-b border-emerald-900 pb-4">
                        <span className="text-emerald-500 font-bold flex items-center gap-2 animate-pulse"><Terminal size={18} /> DATA_MINING_PHASE</span>
                        <span className="text-cyan-400 font-bold text-xl flex items-center gap-2"><Cpu size={18} /> {score} CR</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-emerald-300 text-center mb-8 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">{question.prompt}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        {question.options.map((opt: string, i: number) => (
                            <button key={i} onClick={() => handleAnswer(opt)} className={`${btnStyle} text-xl`}>{opt}</button>
                        ))}
                    </div>
                </div>
            )}

            {phase === "reward" && (
                <div className={`flex flex-col items-center justify-center h-screen mx-auto`}>
                    <div className={`bg-black border-2 border-emerald-500 rounded-lg p-10 text-center max-w-md w-full shadow-[0_0_80px_rgba(16,185,129,0.3)] animate-in zoom-in duration-300 relative z-10`}>
                        <h2 className="text-emerald-700 mb-4 uppercase tracking-[0.2em]">Data Packet Decrypted</h2>
                        <div className="text-8xl mb-6 animate-bounce">{rolledPal.emoji}</div>
                        <h1 className="text-4xl font-black text-emerald-400 mb-2">{rolledPal.name}</h1>
                        <p className="text-cyan-400 font-bold text-lg mb-8 border border-cyan-900 bg-cyan-950/30 p-2 rounded">{rolledPal.desc}</p>
                        <button onClick={applyReward} className={`w-full bg-emerald-900 text-emerald-300 hover:bg-emerald-500 hover:text-black font-black py-4 rounded text-lg border-2 transition-all uppercase tracking-widest ${rolledPal.effect === 'hack' ? 'border-red-500 text-red-500 hover:bg-red-500' : 'border-emerald-500'}`}>
                            {rolledPal.effect === 'hack' ? "FIND TARGET" : "EXTRACT DATA"}
                        </button>
                    </div>
                </div>
            )}

            {phase === "hack" && (
                <div className="z-10 flex flex-col items-center justify-center h-screen w-full max-w-md mx-auto animate-in slide-in-from-bottom-10 px-4">
                    <Fingerprint className="w-20 h-20 mb-4 text-red-500 animate-pulse" />
                    <h1 className="text-3xl font-black mb-2 text-red-500 text-center drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">BREACHING {targetPlayer?.student_name}</h1>
                    <p className="text-emerald-700 mb-8 text-center text-sm">&gt; Bypassing security protocols...<br />&gt; Select correct passkey to steal 25% Credits.</p>
                    {!hackResult ? (
                        <div className="flex flex-col gap-3 w-full">
                            {hackOptions.map(opt => (
                                <button key={opt} onClick={() => submitHack(opt)} className={`${btnStyle} text-left px-6`}>&gt; INPUT_KEY: {opt}</button>
                            ))}
                            <button onClick={() => setHackResult("fail")} className="text-slate-600 hover:text-red-500 mt-6 text-sm text-center">[ ABORT SEQUENCE ]</button>
                        </div>
                    ) : (
                        <div className="text-center w-full animate-in zoom-in">
                            {hackResult === 'success' ? (
                                <div className="border border-emerald-500 bg-emerald-900/20 p-8 rounded">
                                    <CheckCircle className="w-20 h-20 mx-auto text-emerald-500 mb-4" />
                                    <h2 className="text-3xl font-black text-emerald-400 mb-2">ACCESS GRANTED</h2>
                                    <p className="text-emerald-300 mb-8 font-bold">Credits stolen.</p>
                                    <button onClick={moveToNextQuestion} className="w-full bg-emerald-900 text-emerald-300 border border-emerald-500 py-3 hover:bg-emerald-500 hover:text-black font-bold">CONTINUE</button>
                                </div>
                            ) : (
                                <div className="border border-red-500 bg-red-900/20 p-8 rounded">
                                    <AlertTriangle className="w-20 h-20 mx-auto text-red-500 mb-4" />
                                    <h2 className="text-3xl font-black text-red-500 mb-2">ACCESS DENIED</h2>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {phase === "hacked" && (
                <div className="z-10 flex flex-col items-center justify-center h-screen mx-auto animate-flicker">
                    <Lock className="w-32 h-32 mb-6 text-red-500 animate-bounce" />
                    <h1 className="text-5xl md:text-6xl font-black mb-4 text-red-500 text-center drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">SYSTEM LOCKED</h1>
                    <p className="text-red-200 mb-10 text-center max-w-md">&gt; UNAUTHORIZED ACCESS DETECTED.<br />&gt; Rapidly execute patch protocol.</p>
                    <button onClick={() => {
                        const newClicks = patchClicks + 1;
                        setPatchClicks(newClicks);
                        if (newClicks >= 10) moveToNextQuestion();
                    }} className="bg-black border-2 border-red-500 text-red-500 font-black px-12 py-8 rounded-lg text-2xl hover:bg-red-500 hover:text-black transition-all transform active:scale-95 shadow-[0_0_40px_rgba(239,68,68,0.6)]">
                        EXECUTE PATCH ({patchClicks}/10)
                    </button>
                </div>
            )}
        </div>
    );
}

// ==========================================
// 🚨 GOLD QUEST ARENA
// ==========================================
function GoldQuestArena({ gameData, theme, onScoreUpdate, myName, sendFeedEvent, EmojiBar }: any) {
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [phase, setPhase] = useState<"question" | "chests" | "reveal" | "wrong">("question");

    const [chests, setChests] = useState<{ id: number, value: number, isBomb: boolean, opened: boolean }[]>([]);
    const [selectedChest, setSelectedChest] = useState<any>(null);

    if (!gameData || !gameData.questions) return null;
    const question = gameData.questions[currentQ];

    const handleAnswer = (option: string) => {
        if (option === question.correctAnswer) {
            const newChests = [
                { id: 1, value: 50, isBomb: false, opened: false },
                { id: 2, value: 20, isBomb: false, opened: false },
                { id: 3, value: 0, isBomb: true, opened: false }
            ].sort(() => 0.5 - Math.random());
            setChests(newChests);
            setPhase("chests");
        } else {
            setPhase("wrong");
            setTimeout(moveToNextQuestion, 2000);
        }
    };

    const openChest = (chest: any) => {
        if (chest.opened) return;
        setChests(chests.map(c => c.id === chest.id ? { ...c, opened: true } : c));
        setSelectedChest(chest);

        if (!chest.isBomb) {
            const newScore = score + chest.value;
            setScore(newScore);
            onScoreUpdate(newScore);
            sendFeedEvent(`💰 ${myName} found ${chest.value} Gold!`);
        } else {
            sendFeedEvent(`💥 ${myName} opened a BOMB!`);
        }
        setPhase("reveal");
    };

    const moveToNextQuestion = () => {
        setCurrentQ((currentQ + 1) % gameData.questions.length);
        setPhase("question");
        setChests([]);
        setSelectedChest(null);
    };

    return (
        <div className={`flex flex-col h-full ${theme.bg} ${theme.text} p-6 relative overflow-hidden font-sans`}>
            {EmojiBar}
            {phase === "wrong" && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-600/90 backdrop-blur-md">
                    <Skull className="w-24 h-24 text-white mb-4 animate-bounce" />
                    <h1 className="text-6xl font-black text-white">WRONG!</h1>
                </div>
            )}

            <div className="flex justify-between items-center mb-6 z-10">
                <span className={`text-lg font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg ${theme.btn}`}>
                    <Coins size={20} /> {score} Gold
                </span>
            </div>

            {phase === "question" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center z-10">
                    <h1 className="text-4xl font-black mb-12 drop-shadow-lg">{question.prompt}</h1>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
                        {question.options.map((opt: string, i: number) => (
                            <button key={i} onClick={() => handleAnswer(opt)} className={`p-8 rounded-2xl text-2xl font-bold transition-all shadow-lg hover:scale-105 border-2 ${theme.btn} ${theme.border}`}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {phase === "chests" && (
                <div className="flex-1 flex flex-col items-center justify-center z-10 animate-in zoom-in duration-300">
                    <h1 className={`text-4xl font-black mb-12 ${theme.accent}`}>CHOOSE A CHEST!</h1>
                    <div className="flex gap-8">
                        {chests.map((chest) => (
                            <button key={chest.id} onClick={() => openChest(chest)} disabled={chest.opened} className="group relative">
                                <Gift size={120} className={`transition-all duration-300 ${chest.opened ? 'opacity-30 scale-90' : 'text-amber-400 hover:text-amber-200 hover:-translate-y-4 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]'}`} />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {phase === "reveal" && selectedChest && (
                <div className="flex-1 flex flex-col items-center justify-center z-10 animate-in zoom-in duration-300">
                    {selectedChest.isBomb ? (
                        <>
                            <Skull size={160} className="text-red-500 mb-6 animate-pulse" />
                            <h1 className="text-5xl font-black text-red-500 mb-4">IT WAS A BOMB!</h1>
                        </>
                    ) : (
                        <>
                            <Coins size={160} className="text-amber-400 mb-6 animate-bounce drop-shadow-[0_0_30px_rgba(245,158,11,0.8)]" />
                            <h1 className={`text-5xl font-black mb-4 ${theme.accent}`}>+{selectedChest.value} GOLD!</h1>
                        </>
                    )}
                    <button onClick={moveToNextQuestion} className={`font-black px-12 py-4 rounded-xl text-xl mt-4 ${theme.btn}`}>CONTINUE</button>
                </div>
            )}
        </div>
    );
}

// ==========================================
// 🚨 FISHING FRENZY ARENA
// ==========================================
function FishingFrenzyArena({ gameData, theme, onScoreUpdate, myName, sendFeedEvent, EmojiBar }: any) {
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [phase, setPhase] = useState<"question" | "casting" | "reeling" | "wrong">("question");

    const [caughtFish, setCaughtFish] = useState<any>(null);

    if (!gameData || !gameData.questions) return null;
    const question = gameData.questions[currentQ];

    const handleAnswer = (option: string) => {
        if (option === question.correctAnswer) {
            setPhase("casting");
            setTimeout(() => {
                const roll = Math.random();
                let fish;
                if (roll > 0.8) fish = { name: "Golden Koi", emoji: "🐠", points: 100, color: "text-amber-400" };
                else if (roll > 0.4) fish = { name: "Salmon", emoji: "🐟", points: 50, color: "text-orange-400" };
                else fish = { name: "Old Boot", emoji: "🥾", points: 10, color: "text-slate-400" };

                setCaughtFish(fish);
                const newScore = score + fish.points;
                setScore(newScore);
                onScoreUpdate(newScore);
                sendFeedEvent(`🎣 ${myName} caught a ${fish.name}! (+${fish.points})`);
                setPhase("reeling");
            }, 2000);
        } else {
            setPhase("wrong");
            setTimeout(moveToNextQuestion, 2000);
        }
    };

    const moveToNextQuestion = () => {
        setCurrentQ((currentQ + 1) % gameData.questions.length);
        setPhase("question");
        setCaughtFish(null);
    };

    return (
        <div className={`flex flex-col h-full ${theme.bg} ${theme.text} p-6 relative overflow-hidden font-sans`}>
            {EmojiBar}
            {phase === "wrong" && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-600/90 backdrop-blur-md">
                    <Waves className="w-24 h-24 text-white mb-4 animate-bounce" />
                    <h1 className="text-6xl font-black text-white">MISSED!</h1>
                </div>
            )}

            <div className="flex justify-between items-center mb-6 z-10">
                <span className={`text-lg font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg ${theme.btn}`}>
                    <Fish size={20} /> {score} Points
                </span>
            </div>

            {phase === "question" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center z-10">
                    <h1 className="text-4xl font-black mb-12 drop-shadow-lg">{question.prompt}</h1>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
                        {question.options.map((opt: string, i: number) => (
                            <button key={i} onClick={() => handleAnswer(opt)} className={`p-8 rounded-2xl text-2xl font-bold transition-all shadow-lg hover:scale-105 border-2 ${theme.btn} ${theme.border}`}>
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {phase === "casting" && (
                <div className="flex-1 flex flex-col items-center justify-center z-10 animate-in fade-in">
                    <Anchor size={120} className={`mb-6 animate-bounce ${theme.accent}`} />
                    <h1 className={`text-4xl font-black mb-4 ${theme.accent}`}>CASTING LINE...</h1>
                    <p className="text-xl opacity-80">Wait for a bite!</p>
                </div>
            )}

            {phase === "reeling" && caughtFish && (
                <div className="flex-1 flex flex-col items-center justify-center z-10 animate-in zoom-in duration-300">
                    <div className="text-9xl mb-6 animate-bounce">{caughtFish.emoji}</div>
                    <h1 className={`text-5xl font-black mb-4 ${caughtFish.color}`}>{caughtFish.name}!</h1>
                    <p className="text-3xl font-bold mb-8">+{caughtFish.points} Points</p>
                    <button onClick={moveToNextQuestion} className={`font-black px-12 py-4 rounded-xl text-xl mt-4 ${theme.btn}`}>CAST AGAIN</button>
                </div>
            )}
        </div>
    );
}

// ==========================================
// 🚨 CLASSIC MODE
// ==========================================
function ClassicArena({ gameData, theme, onScoreUpdate, isPreview, EmojiBar }: any) {
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
        <div className={`flex flex-col h-full ${theme.bg} ${theme.text} p-6 relative overflow-hidden`}>
            {EmojiBar}
            {isTabHidden && <div className="absolute inset-0 z-[100] bg-red-600/95 flex flex-col items-center justify-center"><EyeOff className="w-24 h-24 mb-6" /><h1 className="text-5xl font-black text-white">DON'T LEAVE THE GAME!</h1></div>}

            {showWrongScreen && (
                <div onClick={handleContinueClick} className={`absolute inset-0 z-[80] flex flex-col items-center justify-center bg-red-600 ${canClickContinue ? 'cursor-pointer' : 'cursor-default'}`}>
                    <h1 className="text-8xl font-black text-white mb-4">X</h1>
                    {canClickContinue ? <p className="text-xl font-bold animate-pulse bg-black/20 px-6 py-3 rounded-xl text-white">Click to continue</p> : <p className="text-xl font-bold text-white/50">Wait...</p>}
                </div>
            )}

            {activeEffect && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80"><h2 className="text-6xl font-black text-white">{activeEffect}</h2></div>}

            <div className="flex justify-between items-center mb-6 z-10">
                <span className={`text-sm font-bold px-4 py-2 rounded-xl ${theme.btn}`}>Score: {score}</span>
                {streak > 0 && <span className="flex items-center gap-1 text-orange-400 font-bold bg-orange-950 px-4 py-2 rounded-xl"><Flame className="w-5 h-5 fill-current" /> {streak}</span>}
            </div>

            <div className="w-full bg-slate-800/50 h-3 rounded-full mb-8 z-10"><div className={`h-full ${timeLeft < 5 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${(timeLeft / 15) * 100}%` }}></div></div>

            <div className="flex justify-center gap-4 mb-10 z-10">
                <button onClick={() => useAbility('timeFreeze')} disabled={abilities.timeFreeze <= 0} className={`p-3 rounded-xl border-2 ${theme.border} ${theme.btn}`}><Clock /></button>
                <button onClick={() => useAbility('doublePoints')} disabled={abilities.doublePoints <= 0} className={`p-3 rounded-xl border-2 ${theme.border} ${theme.btn}`}><Sparkles /></button>
                <button onClick={() => useAbility('shield')} disabled={abilities.shield <= 0} className={`p-3 rounded-xl border-2 ${theme.border} ${theme.btn}`}><Shield /></button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center z-10">
                <h1 className="text-4xl font-black mb-12">{question.prompt}</h1>
                <div className="grid grid-cols-2 gap-4 w-full max-w-4xl">
                    {question.options.map((opt: string, i: number) => (
                        <button key={i} onClick={() => handleAnswer(opt)} className={`p-8 rounded-2xl text-2xl font-bold transition-all hover:scale-105 border-2 ${theme.btn} ${theme.border}`}>{opt}</button>
                    ))}
                </div>
            </div>
        </div>
    );
}