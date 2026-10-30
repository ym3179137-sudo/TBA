"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Crown, Medal, ArrowLeft, Loader2, StopCircle } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function WinningAvatar({ modelUrl }: { modelUrl: string }) {
    const { scene } = useGLTF(modelUrl || "https://modelviewer.dev/shared-assets/models/Astronaut.glb");
    return <primitive object={scene.clone()} scale={1.5} position={[0, -1, 0]} />;
}

export default function GameHost() {
    const router = useRouter();
    const params = useParams();
    const pin = params?.pin as string;
    const supabase = useMemo(() => createClient(), []);

    const [scores, setScores] = useState<any[]>([]);
    const [isEnding, setIsEnding] = useState(false);
    const [winnerAvatar, setWinnerAvatar] = useState<string | null>(null);

    useEffect(() => {
        if (!pin) return;

        const interval = setInterval(async () => {
            const { data } = await supabase.from("game_results").select("*").eq("game_pin", pin);
            if (data) {
                const sorted = data.sort((a, b) => b.score - a.score);
                setScores(sorted);

                // 🚨 Fetch winner's avatar
                if (sorted.length > 0 && sorted[0].score > 0) {
                    const { data: student } = await supabase.from("children").select("equipped_skin").eq("id", sorted[0].student_id).single();
                    if (student?.equipped_skin) {
                        setWinnerAvatar(student.equipped_skin);
                    }
                }
            }
        }, 1500);

        return () => clearInterval(interval);
    }, [pin, supabase]);

    const endGame = async () => {
        setIsEnding(true);
        await supabase.from("game_sessions").update({ status: 'finished' }).eq("pin", pin);
        router.push("/teacher/arena");
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans flex flex-col items-center">
            <button onClick={() => router.push('/teacher/arena')} className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white font-bold bg-slate-900 px-5 py-2.5 rounded-xl border border-slate-800 z-50">
                <ArrowLeft size={20} /> Exit
            </button>

            <button onClick={endGame} disabled={isEnding} className="absolute top-8 right-8 flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg z-50">
                <StopCircle size={20} /> {isEnding ? "Ending..." : "End Game"}
            </button>

            <div className="w-full max-w-6xl mt-16 flex flex-col lg:flex-row gap-8">

                {/* LEFT: Live Leaderboard */}
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-center mb-8">Live Leaderboard</h1>
                    <div className="space-y-3">
                        {scores.map((s, i) => (
                            <div key={s.id} className={`flex justify-between items-center p-4 rounded-xl border ${i === 0 ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-900 border-slate-800'}`}>
                                <span className="font-bold text-lg">#{i + 1} {s.student_name}</span>
                                <span className={`font-black ${i === 0 ? 'text-amber-400' : 'text-slate-400'}`}>{s.score} pts</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Winner Podium */}
                <div className="flex-1 bg-slate-900 border-2 border-amber-500 rounded-3xl p-8 flex flex-col items-center justify-center relative shadow-[0_0_100px_rgba(245,158,11,0.15)] min-h-[400px]">
                    {scores.length > 0 && scores[0].score > 0 ? (
                        <>
                            <Crown className="w-20 h-20 text-amber-400 mb-4 animate-bounce z-10" />
                            <h2 className="text-3xl font-black text-white z-10">{scores[0].student_name}</h2>
                            <p className="text-amber-400 font-bold text-xl mb-4 z-10">WINS THE TOURNAMENT!</p>

                            {/* 🚨 3D AVATAR VIEWER */}
                            <div className="absolute inset-0 w-full h-full opacity-60 pointer-events-none">
                                <Canvas camera={{ position: [0, 1, 5], fov: 50 }}>
                                    <ambientLight intensity={1} />
                                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                                    <Suspense fallback={null}>
                                        <WinningAvatar modelUrl={winnerAvatar || ""} />
                                    </Suspense>
                                    <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={10} blur={2} />
                                    <Environment preset="city" />
                                    <OrbitControls autoRotate enableZoom={false} />
                                </Canvas>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-slate-500">
                            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>Waiting for a winner...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}