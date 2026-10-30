"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Gamepad2, Loader2, Coins } from "lucide-react";
import TBAArena from "@/components/TBAArena";

export default function PlayGame() {
    const router = useRouter();
    const params = useParams();
    const pin = params?.pin as string;

    const supabase = useMemo(() => createClient(), []);

    const [status, setStatus] = useState("lobby");
    const [gameData, setGameData] = useState<any>(null);
    const [gameMode, setGameMode] = useState("classic");
    const [studentName, setStudentName] = useState("");
    const [studentId, setStudentId] = useState("");
    const [coinsEarned, setCoinsEarned] = useState(0);

    useEffect(() => {
        if (!pin) return;

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

        async function joinLobby() {
            await supabase.from("game_results").upsert({
                game_pin: pin, student_id: id, student_name: name, score: 0
            }, { onConflict: 'game_pin,student_id' });
        }
        joinLobby();

        const interval = setInterval(async () => {
            const { data } = await supabase.from("game_sessions").select("*").eq("pin", pin).single();
            if (data) {
                if (data.status === "playing" && data.game_data && status === "lobby") {
                    setGameData(data.game_data);
                    setGameMode(data.game_mode || "classic");
                    setStatus("playing");
                }
                if (data.status === "finished" && status === "playing") {
                    setStatus("finished");
                    clearInterval(interval);
                }
            }
        }, 1500);

        return () => clearInterval(interval);
    }, [pin, supabase, status]);

    const handleScoreUpdate = async (newScore: number) => {
        await supabase.from("game_results").update({ score: newScore }).eq("game_pin", pin).eq("student_id", studentId);
    };

    // 🚨 TAKE GOLD (Steal from 1st place)
    const handleTakeGold = async (percent: number, currentScore: number) => {
        // Find the highest scorer (not ourselves)
        const { data: topPlayers } = await supabase
            .from("game_results")
            .select("*")
            .eq("game_pin", pin)
            .neq("student_id", studentId)
            .order("score", { ascending: false })
            .limit(1);

        if (topPlayers && topPlayers.length > 0) {
            const victim = topPlayers[0];
            const stealAmount = Math.floor(victim.score * (percent / 100));

            // Deduct from victim
            await supabase.from("game_results").update({ score: Math.max(0, victim.score - stealAmount) }).eq("id", victim.id);
            // Add to self
            return currentScore + stealAmount;
        }
        return currentScore;
    };

    // 🚨 DRAGON TREASURE (Steal from global pool)
    const handleDragonTreasure = async (currentScore: number) => {
        // We store the dragon pool in game_sessions
        const { data: session } = await supabase.from("game_sessions").select("dragon_treasure").eq("pin", pin).single();
        const pool = session?.dragon_treasure || 0;

        // Reset the pool to 0
        await supabase.from("game_sessions").update({ dragon_treasure: 0 }).eq("pin", pin);

        return currentScore + pool;
    };

    const handleGameFinish = async () => {
        try {
            const res = await fetch("/api/game/reward", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, score: 50 })
            });
            const data = await res.json();
            if (res.ok) setCoinsEarned(data.added);
        } catch (e) {
            console.error(e);
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
                    <button onClick={() => router.push("/student")} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all">Back to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen overflow-hidden">
            <TBAArena
                gameData={gameData}
                gameMode={gameMode}
                onScoreUpdate={handleScoreUpdate}
                onTakeGold={handleTakeGold}
                onDragonTreasure={handleDragonTreasure}
            />
        </div>
    );
}