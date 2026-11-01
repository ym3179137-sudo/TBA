"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Gamepad2, Loader2, Coins } from "lucide-react";
import TBAArena from "@/components/TBAArena";
import { syncGameCoins } from "@/app/actions/game"; // 🚨 Import the sync function

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

    const answersLogRef = useRef<any[]>([]);
    const hasJoinedRef = useRef(false);
    const scoreRef = useRef(0); // 🚨 Track the final score here

    useEffect(() => {
        if (!pin || hasJoinedRef.current) return;

        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return "";
        };

        let id = getCookie("student_id");
        let name = getCookie("student_name");

        if (!id) {
            id = `guest-${Math.random().toString(36).slice(2, 8)}`;
            document.cookie = `student_id=${id}; path=/; max-age=86400`;
        }
        if (!name) {
            name = "Guest Player";
            document.cookie = `student_name=${encodeURIComponent(name)}; path=/; max-age=86400`;
        } else {
            name = decodeURIComponent(name);
        }

        setStudentId(id);
        setStudentName(name);
        hasJoinedRef.current = true;

        async function joinLobby() {
            await supabase.from("game_results").upsert({
                game_pin: pin, student_id: id, student_name: name, score: 0, answers_log: []
            }, { onConflict: 'game_pin,student_id' });
        }
        joinLobby();
    }, [pin, supabase]);

    useEffect(() => {
        if (!pin || !studentId) return;

        const interval = setInterval(async () => {
            const { data } = await supabase.from("game_sessions").select("*").eq("pin", pin).maybeSingle();
            if (data) {
                if (data.status === "playing" && data.game_data && status === "lobby") {
                    setGameData(data.game_data);
                    setGameMode(data.game_mode || "classic");
                    setStatus("playing");
                }
                if (data.status === "finished" && status === "playing") {
                    setStatus("finished");
                    clearInterval(interval);

                    // 🚨 Save final log and coins to DB
                    await supabase.from("game_results").update({
                        answers_log: answersLogRef.current
                    }).eq("game_pin", pin).eq("student_id", studentId);

                    // 🚨 Award Coins!
                    if (scoreRef.current > 0) {
                        setCoinsEarned(scoreRef.current);
                        await syncGameCoins(studentId, scoreRef.current);
                    }
                }
            }
        }, 1500);

        return () => clearInterval(interval);
    }, [pin, supabase, status, studentId]);

    const handleScoreUpdate = async (newScore: number) => {
        scoreRef.current = newScore; // 🚨 Update the score tracker
        await supabase.from("game_results").update({ score: newScore }).eq("game_pin", pin).eq("student_id", studentId);
    };

    const handleGameEnd = (log: any[]) => {
        answersLogRef.current = log;
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
                    <p className="text-xl text-slate-400 font-bold mb-4">Great job, {studentName}!</p>

                    {/* 🚨 SHOW THE COINS EARNED */}
                    {coinsEarned > 0 ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-black text-2xl py-4 rounded-xl mb-8">
                            +{coinsEarned} Coins Added! 🪙
                        </div>
                    ) : (
                        <div className="text-slate-500 mb-8 font-bold">
                            {studentId.startsWith("guest-") ? "Log in to save your coins!" : "No coins earned this round."}
                        </div>
                    )}

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
                onGameEnd={handleGameEnd}
            />
        </div>
    );
}