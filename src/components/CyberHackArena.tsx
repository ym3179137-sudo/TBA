"use client";

import { useState, useEffect } from "react";
import { Shield, Terminal, Lock, CheckCircle, AlertTriangle, Fingerprint, Cpu, Wifi } from "lucide-react";

// 🚨 PREDEFINED PASSWORDS (School appropriate, hacker style)
const PASSWORD_OPTIONS = [
    "C0DEBUSTER", "N30N_V1P3R", "M4TR1X_RUN", "SYST3M_0V3R",
    "Z3R0_TR4C3", "GH0ST_PR0T0", "BYT3_M3", "R00T_ACC3SS"
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

export default function CyberHackArena({
    question, onAnswer, score, onScoreUpdate, onFinish
}: any) {
    const [phase, setPhase] = useState<"password_select" | "question" | "reward" | "hack" | "hacked">("password_select");

    // Game State
    const [secretPassword, setSecretPassword] = useState("");
    const [rolledPal, setRolledPal] = useState<any>(null);

    // Hacking State
    const [hackOptions, setHackOptions] = useState<string[]>([]);
    const [hackResult, setHackResult] = useState<"success" | "fail" | null>(null);
    const [patchClicks, setPatchClicks] = useState(0);

    // 1. INITIAL SETUP: CHOOSE PASSWORD
    const selectPassword = (pass: string) => {
        setSecretPassword(pass);
        setPhase("question");
    };

    // 2. ANSWER QUESTION
    const handleAnswer = (option: string) => {
        const isCorrect = option === question.correctAnswer;
        onAnswer(option, isCorrect);

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
            onFinish();
        }
    };

    // 3. APPLY REWARD
    const applyReward = () => {
        if (rolledPal.effect === "hack") {
            // Simulate an opponent's password being among 3 options
            const options = [...PASSWORD_OPTIONS].sort(() => 0.5 - Math.random()).slice(0, 3);
            setHackOptions(options);
            setPhase("hack");
        } else {
            let newScore = score;
            if (rolledPal.effect === "add") newScore += rolledPal.amount;
            if (rolledPal.effect === "double") newScore *= 2;
            if (rolledPal.effect === "triple") newScore *= 3;
            onScoreUpdate(newScore);
            onFinish();
        }
    };

    // 4. HACKING LOGIC
    const submitHack = (guess: string) => {
        const isSuccess = Math.random() > 0.66;
        if (isSuccess) {
            setHackResult("success");
            onScoreUpdate(score + Math.floor(score * 0.25));
        } else {
            setHackResult("fail");
        }
    };

    // 5. RECOVERY (Button spam)
    const handlePatchClick = () => {
        const newClicks = patchClicks + 1;
        setPatchClicks(newClicks);
        if (newClicks >= 10) {
            onFinish();
        }
    };

    // RENDERERS
    if (phase === "password_select") {
        return (
            <div className="relative flex flex-col items-center justify-center min-h-screen bg-black p-6 font-mono text-green-500 overflow-hidden">
                <div className="crt-overlay" />

                {/* Background Terminal Text */}
                <div className="absolute top-10 left-10 text-green-900/30 text-xs pointer-events-none select-none">
                    <p>SYS.INIT // LOADING KERNEL...</p>
                    <p>MEMORY CHECK: OK</p>
                    <p>ESTABLISHING SECURE CONNECTION...</p>
                </div>

                <Shield className="w-24 h-24 mb-6 animate-pulse text-green-500" />
                <h1 className="text-4xl md:text-5xl font-black mb-2 text-green-400 glitch-text" data-text="ENCRYPT YOUR VAULT">
                    ENCRYPT YOUR VAULT
                </h1>
                <p className="text-green-700 mb-10 text-center max-w-lg">
                    Select a passkey. If another operative attempts a breach, they must guess this key. It cannot be changed.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl z-10">
                    {PASSWORD_OPTIONS.map(pass => (
                        <button key={pass} onClick={() => selectPassword(pass)} className="bg-black border-2 border-green-800 hover:border-green-400 hover:bg-green-900/20 hover:text-green-300 text-green-600 font-bold py-4 rounded transition-all duration-200 shadow-[0_0_10px_rgba(34,197,94,0.1)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                            {pass}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (phase === "question") {
        return (
            <div className="relative flex flex-col items-center justify-center min-h-screen bg-black p-6 font-mono overflow-hidden">
                <div className="crt-overlay" />

                <div className="w-full max-w-4xl bg-black border border-green-800 p-8 rounded-lg shadow-[0_0_30px_rgba(34,197,94,0.15)] z-10">
                    <div className="flex justify-between items-center mb-8 border-b border-green-900 pb-4">
                        <span className="text-green-500 font-bold flex items-center gap-2 animate-pulse"><Terminal size={18} /> DATA_MINING_PHASE</span>
                        <span className="text-cyan-400 font-bold text-xl flex items-center gap-2"><Cpu size={18} /> {score} CR</span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-green-300 text-center mb-8">{question.prompt}</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {question.options.map((opt: string, i: number) => (
                            <button key={i} onClick={() => handleAnswer(opt)} className="bg-black border border-green-800 hover:bg-green-900/40 text-green-400 font-bold py-6 rounded text-xl transition-all hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] group relative overflow-hidden">
                                <span className="relative z-10">{opt}</span>
                                <div className="absolute inset-0 bg-green-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (phase === "reward") {
        return (
            <div className="relative flex flex-col items-center justify-center min-h-screen bg-black p-6 font-mono overflow-hidden">
                <div className="crt-overlay" />

                <div className="bg-black border-2 border-green-500 rounded-lg p-10 text-center max-w-md w-full shadow-[0_0_50px_rgba(34,197,94,0.3)] z-10 animate-in zoom-in duration-300">
                    <h2 className="text-green-700 mb-4 uppercase tracking-[0.2em]">Data Packet Decrypted</h2>
                    <div className="text-8xl mb-6 animate-bounce">{rolledPal.emoji}</div>
                    <h1 className="text-4xl font-black text-green-400 mb-2 glitch-text" data-text={rolledPal.name}>{rolledPal.name}</h1>
                    <p className="text-cyan-400 font-bold text-lg mb-8 border border-cyan-900 bg-cyan-950/30 p-2 rounded">
                        {rolledPal.desc}
                    </p>
                    <button onClick={applyReward} className={`w-full bg-green-900 text-green-300 hover:bg-green-500 hover:text-black font-black py-4 rounded text-lg border-2 transition-all uppercase tracking-widest ${rolledPal.effect === 'hack' ? 'border-red-500 text-red-500 hover:bg-red-500' : 'border-green-500'}`}>
                        {rolledPal.effect === 'hack' ? "EXECUTE EXPLOIT" : "EXTRACT DATA"}
                    </button>
                </div>
            </div>
        );
    }

    if (phase === "hack") {
        return (
            <div className="relative flex flex-col items-center justify-center min-h-screen bg-black p-6 font-mono overflow-hidden">
                <div className="crt-overlay" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20 pointer-events-none"></div>

                <div className="z-10 flex flex-col items-center w-full max-w-md">
                    <Fingerprint className="w-20 h-20 mb-4 text-red-500 animate-pulse" />
                    <h1 className="text-3xl font-black mb-2 text-red-500 glitch-text" data-text="BREACHING FIREWALL">BREACHING FIREWALL</h1>
                    <p className="text-green-700 mb-8 text-center text-sm">
                        &gt; Bypassing security protocols...<br />
                        &gt; Target: Operative #4082<br />
                        &gt; Select correct passkey to steal 25% Credits.
                    </p>

                    {!hackResult ? (
                        <div className="flex flex-col gap-3 w-full">
                            {hackOptions.map(opt => (
                                <button key={opt} onClick={() => submitHack(opt)} className="bg-black border border-green-800 text-green-500 font-bold py-4 rounded hover:bg-green-900/30 hover:text-green-300 transition-all text-left px-6">
                                    &gt; INPUT_KEY: {opt}
                                </button>
                            ))}
                            <button onClick={() => setHackResult("fail")} className="text-slate-600 hover:text-red-500 mt-6 text-sm text-center">
                                [ ABORT SEQUENCE ]
                            </button>
                        </div>
                    ) : (
                        <div className="text-center w-full animate-in zoom-in">
                            {hackResult === 'success' ? (
                                <div className="border border-green-500 bg-green-900/20 p-8 rounded">
                                    <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
                                    <h2 className="text-3xl font-black text-green-400 mb-2">ACCESS GRANTED</h2>
                                    <p className="text-green-300 mb-8 font-bold">Credits successfully stolen.</p>
                                </div>
                            ) : (
                                <div className="border border-red-500 bg-red-900/20 p-8 rounded">
                                    <AlertTriangle className="w-20 h-20 mx-auto text-red-500 mb-4" />
                                    <h2 className="text-3xl font-black text-red-500 mb-2">ACCESS DENIED</h2>
                                    <p className="text-red-300 mb-8 font-bold">Incorrect passkey. Trace failed.</p>
                                </div>
                            )}
                            <button onClick={onFinish} className="w-full bg-green-900 text-green-300 border border-green-500 py-3 mt-4 hover:bg-green-500 hover:text-black font-bold">
                                RETURN TO MINING
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (phase === "hacked") {
        return (
            <div className="relative flex flex-col items-center justify-center min-h-screen bg-red-950 p-6 font-mono overflow-hidden animate-flicker">
                <div className="crt-overlay" />
                <Lock className="w-32 h-32 mb-6 text-red-500 animate-bounce" />
                <h1 className="text-5xl md:text-6xl font-black mb-4 text-red-500 text-center glitch-text" data-text="SYSTEM LOCKED">
                    SYSTEM LOCKED
                </h1>
                <p className="text-red-200 mb-10 text-center max-w-md">
                    &gt; UNAUTHORIZED ACCESS DETECTED.<br />
                    &gt; Rapidly execute patch protocol to restore connection.
                </p>
                <button onClick={handlePatchClick} className="bg-black border-2 border-red-500 text-red-500 font-black px-12 py-8 rounded-lg text-2xl hover:bg-red-500 hover:text-black transition-all transform active:scale-95 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                    EXECUTE PATCH ({patchClicks}/10)
                </button>
            </div>
        );
    }

    return null;
}