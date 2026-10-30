"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Crown, ArrowLeft, Loader2, StopCircle, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";

// 🚨 3D Avatar Component with Emote Animations
function WinningAvatar({ modelUrl, emote }: { modelUrl: string, emote: string }) {
    const fallback = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
    const safeUrl = modelUrl && modelUrl.startsWith("http") ? modelUrl : fallback;
    const { scene } = useGLTF(safeUrl);
    const ref = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!ref.current) return;

        // 🕺 Emote Logic
        if (emote === 'dance') {
            ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 8) * 0.5;
            ref.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.4;
        } else if (emote === 'spin') {
            ref.current.rotation.y += 0.05;
        } else {
            // Default idle float
            ref.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }
    });

    return (
        <group ref={ref}>
            <primitive object={scene.clone()} scale={1.5} position={[0, -1.5, 0]} />
        </group>
    );
}

function AvatarLoader() {
    return (
        <Html center>
            <div className="flex flex-col items-center justify-center bg-slate-900/90 p-6 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md">
                <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-3" />
                <p className="text-white font-bold whitespace-nowrap">Loading Winner...</p>
            </div>
        </Html>
    );
}

export default function GameHost() {
    const router = useRouter();
    const params = useParams();
    const pin = params?.pin as string;
    const supabase = useMemo(() => createClient(), []);

    const [scores, setScores] = useState<any[]>([]);
    const [isEnding, setIsEnding] = useState(false);

    // Winner States
    const [winnerAvatar, setWinnerAvatar] = useState<string>("");
    const [winnerEmote, setWinnerEmote] = useState<string>("none");

    // Report State
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    useEffect(() => {
        if (!pin) return;

        const interval = setInterval(async () => {
            // 1. Fetch live scores
            const { data } = await supabase.from("game_results").select("*").eq("game_pin", pin);

            if (data) {
                const sorted = data.sort((a, b) => b.score - a.score);
                setScores(sorted);

                // 2. Fetch winner's avatar & emote if there is a leader
                if (sorted.length > 0 && sorted[0].score > 0) {
                    const { data: student } = await supabase
                        .from("children")
                        .select("equipped_skin, equipped_emote")
                        .eq("id", sorted[0].student_id)
                        .single();

                    if (student) {
                        setWinnerAvatar(student.equipped_skin || "");
                        setWinnerEmote(student.equipped_emote || "none");
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

            {/* Top Navigation */}
            <button onClick={() => router.push('/teacher/arena')} className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white font-bold bg-slate-900 px-5 py-2.5 rounded-xl border border-slate-800 z-50 transition-colors">
                <ArrowLeft size={20} /> Exit
            </button>

            <button onClick={endGame} disabled={isEnding} className="absolute top-8 right-8 flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg z-50 transition-colors">
                <StopCircle size={20} /> {isEnding ? "Ending..." : "End Game"}
            </button>

            <div className="w-full max-w-6xl mt-16 flex flex-col lg:flex-row gap-8">

                {/* LEFT: Live Leaderboard */}
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-center mb-8">Live Leaderboard</h1>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {scores.map((s, i) => (
                            <div key={s.id} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${i === 0 ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-slate-900 border-slate-800'}`}>
                                <span className="font-bold text-lg flex items-center gap-2">
                                    {i === 0 && <Crown size={18} className="text-amber-400" />}
                                    {i + 1}. {s.student_name}
                                </span>
                                <div className="flex gap-4 items-center">
                                    <span className={`font-black text-lg ${i === 0 ? 'text-amber-400' : 'text-slate-400'}`}>{s.score} pts</span>

                                    {/* View Report Button */}
                                    {s.answers_log && s.answers_log.length > 0 && (
                                        <button onClick={() => setSelectedStudent(s)} className="bg-indigo-600 p-2 rounded-lg hover:bg-indigo-500 transition-colors" title="View Report">
                                            <FileText size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {scores.length === 0 && (
                            <div className="text-center text-slate-500 py-12">Waiting for players to join...</div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Winner Podium & 3D Model */}
                <div className="flex-1 bg-slate-900 border-2 border-amber-500 rounded-3xl p-8 flex flex-col items-center justify-center relative shadow-[0_0_100px_rgba(245,158,11,0.15)] h-[500px] overflow-hidden">
                    {scores.length > 0 && scores[0].score > 0 ? (
                        <>
                            {/* 3D Viewer */}
                            <div className="absolute inset-0 z-0 cursor-move">
                                <Canvas shadows camera={{ position: [0, 2, 6], fov: 50 }}>
                                    <ambientLight intensity={0.7} />
                                    <spotLight position={[10, 10, 10]} intensity={1.5} angle={0.15} penumbra={1} castShadow />
                                    <Suspense fallback={<AvatarLoader />}>
                                        <WinningAvatar modelUrl={winnerAvatar} emote={winnerEmote} />
                                    </Suspense>
                                    <ContactShadows position={[0, -1.5, 0]} opacity={0.7} scale={10} blur={2} />
                                    <Environment preset="city" />
                                    <OrbitControls autoRotate={winnerEmote === 'none'} enableZoom={true} />
                                </Canvas>
                            </div>

                            {/* Overlay Text */}
                            <div className="absolute top-8 z-10 flex flex-col items-center pointer-events-none">
                                <Crown className="w-16 h-16 text-amber-400 mb-2 animate-bounce drop-shadow-lg" />
                                <h2 className="text-3xl font-black text-white drop-shadow-md bg-black/50 px-4 py-1 rounded-xl backdrop-blur-sm">{scores[0].student_name}</h2>
                                <p className="text-amber-400 font-bold text-lg mt-2 drop-shadow-md bg-black/50 px-4 py-1 rounded-xl backdrop-blur-sm">WINS THE TOURNAMENT!</p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-slate-500 z-10">
                            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>Waiting for a winner...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 🚨 REPORT MODAL */}
            {selectedStudent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative max-h-[90vh] flex flex-col">

                        <button onClick={() => setSelectedStudent(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl transition-colors">
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-black mb-1">{selectedStudent.student_name}'s Report</h2>
                        <p className="text-slate-400 mb-6">Final Score: <span className="text-white font-bold">{selectedStudent.score} pts</span></p>

                        <div className="overflow-y-auto space-y-3 pr-2">
                            {selectedStudent.answers_log.map((log: any, i: number) => (
                                <div key={i} className={`p-4 rounded-xl border flex gap-4 ${log.isCorrect ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-red-950/30 border-red-900/50'}`}>
                                    <div className="mt-1 shrink-0">
                                        {log.isCorrect ? <CheckCircle className="text-emerald-400" size={20} /> : <AlertCircle className="text-red-400" size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-white mb-1">{log.question}</p>
                                        <p className="text-sm text-slate-400">Student answered: <span className={`font-bold ${log.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>{log.studentAnswer}</span></p>
                                        {!log.isCorrect && <p className="text-sm text-slate-500">Correct answer: <span className="font-bold text-emerald-500">{log.correctAnswer}</span></p>}
                                    </div>
                                </div>
                            ))}
                            {selectedStudent.answers_log.length === 0 && (
                                <p className="text-center text-slate-500 py-8">No questions answered yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}