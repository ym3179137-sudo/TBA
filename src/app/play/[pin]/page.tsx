"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation"; // 🚨 Imported useParams
import { createClient } from "@/lib/supabase/client";
import { Gamepad2, Loader2, Coins } from "lucide-react";
import TBAArena from "@/components/TBAArena";

export default function PlayGame() {
    const router = useRouter();
    const params = useParams(); // 🚨 Get params using useParams hook
    const pin = params?.pin as string; // 🚨 Safely get the PIN

    const supabase = useMemo(() => createClient(), []);

    const [status, setStatus] = useState("lobby");
    const [gameData, setGameData] = useState<any>(null);
    const [gameMode, setGameMode] = useState("classic");
    const [studentName, setStudentName] = useState("");
    const [studentId, setStudentId] = useState("");
    const [coinsEarned, setCoinsEarned] = useState(0);

    useEffect(() => {
        if (!pin) return; // Wait until pin is loaded

        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return "";
        };
        const id = getCookie("student_id") || `guest-${Math.random().toString(36).slice(2, 6)}`;
        const name = decodeURIComponent(getCookie("student_name") || "Guest Player");

        setStudentId(id);
        setStudentName(name);

        // 🚨 1. Join Lobby in DB
        async function joinLobby() {
            const { error } = await supabase.from("game_results").upsert({
                game_pin: pin, // 🚨 Use the unwrapped pin
                student_id: id,
                student_name: name,
                score: 0
            }, { onConflict: 'game_pin,student_id' });

            if (error) {
                console.error("Failed to join lobby:", error);
                alert("Error joining game: " + error.message);
            }
        }
        joinLobby();

        // 🚨 2. Listen to DB for Game Start
        const channel = supabase.channel(`session-${pin}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'game_sessions',
                filter: `pin=eq.${pin}`
            }, (payload) => {
                if (payload.new.status === 'playing' && payload.new.game_data) {
                    setGameData(payload.new.game_data);
                    setGameMode(payload.new.game_mode || "classic");
                    setStatus("playing");
                }
            }).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [pin, supabase]);

    const handleGameFinish = async (finalScore: number) => {
        try {
            await supabase.from("game_results").update({ score: finalScore }).eq("game_pin", pin).eq("student_id", studentId);

            const res = await fetch("/api/game/reward", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, score: finalScore })
            });
            const data = await res.json();
            if (res.ok) setCoinsEarned(data.added);
        } catch (e) {
            console.error(e);
        } finally {
            setStatus("finished");
        }
    };

    if (status === "lobby") {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
                <div className="bg-slate-900 border-2 border-emerald-500 p-12 rounded-[3rem] shadow-[0_0_100px_rgba(16,185,129,0.2)] text-center max-w-md w-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 animate-pulse" />
                    <Gamepad2 className="w-24 h-24 text-emerald-400 mx-auto mb-6 animate-bounce" />
                    <h1 className="text-4xl font-black mb-2">{studentName}</h1>
                    <p className="text-xl text-slate-400 font-bold mb-8">You're in!</p>

                    <div className="flex items-center justify-center gap-3 text-emerald-400 font-bold bg-emerald-500/10 p-4 rounded-xl">
                        <Loader2 className="animate-spin" /> Waiting for teacher to start...
                    </div>
                </div>
            </div>
        );
    }

    if (status === "finished") {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
                <div className="bg-slate-900 border-2 border-amber-500 p-12 rounded-[3rem] shadow-[0_0_100px_rgba(245,158,11,0.2)] text-center max-w-md w-full relative overflow-hidden">
                    <Coins className="w-24 h-24 text-amber-400 mx-auto mb-6 animate-bounce" />
                    <h1 className="text-4xl font-black mb-2">Game Over!</h1>
                    <p className="text-xl text-slate-400 font-bold mb-8">Great job, {studentName}!</p>
                    <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-2xl mb-8">
                        <p className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-1">Coins Earned</p>
                        <p className="text-5xl font-black text-white">+{coinsEarned} 🪙</p>
                    </div>
                    <button onClick={() => router.push("/student")} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all">Back to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen overflow-hidden">
            <TBAArena gameData={gameData} gameMode={gameMode} onFinish={handleGameFinish} />
        </div>
    );
}