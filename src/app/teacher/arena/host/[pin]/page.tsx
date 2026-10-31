"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    Trophy,
    Crown,
    ArrowLeft,
    Loader2,
    StopCircle,
    FileText,
    X,
    CheckCircle,
    AlertCircle,
    Download,
} from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
    Environment,
    ContactShadows,
    useGLTF,
    Html,
    useAnimations,
} from "@react-three/drei";
import * as THREE from "three";

// 🚨 THIS POINTS TO public/music/cheer.mp3
const CROWD_SOUND_SRC = "/music/cheer.mp3";

// 🚨 Multi-Avatar Podium
function AwardCeremony({
    players,
    isDancing,
}: {
    players: any[];
    isDancing: boolean;
}) {
    return (
        <>
            {players.map((player, index) => {
                const xOffset = (index - (players.length - 1) / 2) * 2.5;
                return (
                    <group key={player.student_id} position={[xOffset, 0, 0]}>
                        <SingleAvatar
                            modelUrl={player.equipped_skin}
                            emote={isDancing ? player.equipped_emote : "none"}
                        />
                    </group>
                );
            })}
        </>
    );
}

function SingleAvatar({
    modelUrl,
    emote,
}: {
    modelUrl: string;
    emote: string;
}) {
    const fallback =
        "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
    const safeUrl =
        modelUrl && modelUrl.startsWith("http") ? modelUrl : fallback;

    const { scene, animations } = useGLTF(safeUrl);
    const { actions, names } = useAnimations(animations, scene);
    const ref = useRef<THREE.Group>(null);

    useEffect(() => {
        if (actions && names.length > 0) {
            if (emote !== "none") {
                const action = actions[names[0]];
                action?.reset().fadeIn(0.5).play();
            } else {
                Object.values(actions).forEach((action) => action?.stop());
            }
        }
    }, [actions, names, emote]);

    useFrame((state) => {
        if (!ref.current) return;

        if (emote === "dance" && (!actions || names.length === 0)) {
            ref.current.rotation.y =
                Math.sin(state.clock.elapsedTime * 8) * 0.5;
            ref.current.position.y =
                Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.4;
        } else if (emote === "spin" && (!actions || names.length === 0)) {
            ref.current.rotation.y += 0.05;
        } else if (emote === "none") {
            ref.current.position.y =
                Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }
    });

    return (
        <group ref={ref}>
            <primitive
                object={scene.clone()}
                scale={1.2}
                position={[0, -1.5, 0]}
            />
        </group>
    );
}

function AvatarLoader() {
    return (
        <Html center>
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
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
    const [isDancing, setIsDancing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (!pin) return;

        const interval = setInterval(async () => {
            const { data } = await supabase
                .from("game_results")
                .select("*")
                .eq("game_pin", pin);

            if (data) {
                const sorted = data.sort((a, b) => b.score - a.score);

                const topPlayers = sorted.slice(0, 3);

                const enrichedPlayers = await Promise.all(
                    topPlayers.map(async (p) => {
                        const { data: student } = await supabase
                            .from("children")
                            .select("equipped_skin, equipped_emote")
                            .eq("id", p.student_id)
                            .single();

                        return { ...p, ...student };
                    })
                );

                setScores(enrichedPlayers);
            }
        }, 1500);

        return () => clearInterval(interval);
    }, [pin, supabase]);

    // 🚨 Play custom crowd/applause sound for 5 seconds when game ends
    useEffect(() => {
        if (isDancing && audioRef.current) {
            audioRef.current.volume = 0.7;
            audioRef.current.currentTime = 0;

            audioRef.current.play().catch((e) => {
                console.log("Audio play failed:", e);
            });

            const timer = setTimeout(() => {
                setIsDancing(false);

                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [isDancing]);

    const endGame = async () => {
        setIsEnding(true);

        await supabase
            .from("game_sessions")
            .update({ status: "finished" })
            .eq("pin", pin);

        setIsDancing(true);
    };

    // 🚨 Save Report Card to Library
    const saveReportToLibrary = async (student: any) => {
        setIsSaving(true);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setIsSaving(false);
            return;
        }

        const reportText = student.answers_log
            .map(
                (log: any) =>
                    `Q: ${log.question}\nStudent: ${log.studentAnswer} (${log.isCorrect ? "Correct" : "Wrong"
                    })\nCorrect: ${log.correctAnswer}\n`
            )
            .join("\n-------------------\n");

        const deckData = {
            title: `Report Card - ${student.student_name}`,
            slides: [
                {
                    heading: `${student.student_name}'s Report`,
                    bullets: [
                        `Score: ${student.score} pts`,
                        `Accuracy: ${Math.round(
                            (student.answers_log.filter((l: any) => l.isCorrect).length /
                                student.answers_log.length) *
                            100
                        )}%`,
                    ],
                    teacherPrompt: reportText,
                },
            ],
        };

        const { error } = await supabase.from("presentations").insert({
            teacher_id: user.id,
            title: `Report Card - ${student.student_name}`,
            deck_data: deckData,
            target_type: "student",
            target_value: student.student_id,
        });

        setIsSaving(false);

        if (error) {
            alert("Failed to save: " + error.message);
        } else {
            alert("✅ Report Card saved to Library and sent to Parents!");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans flex flex-col items-center">
            {/* 🚨 Custom crowd sound */}
            <audio ref={audioRef} src={CROWD_SOUND_SRC} preload="auto" />

            <button
                onClick={() => router.push("/teacher/arena")}
                className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white font-bold bg-slate-900 px-5 py-2.5 rounded-xl border border-slate-800 z-50"
            >
                <ArrowLeft size={20} /> Exit
            </button>

            {!isEnding ? (
                <button
                    onClick={endGame}
                    className="absolute top-8 right-8 flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg z-50"
                >
                    <StopCircle size={20} /> End & Dance
                </button>
            ) : (
                <div className="absolute top-8 right-8 text-amber-400 font-bold px-6 py-2.5 z-50 bg-black/50 rounded-xl">
                    {isDancing ? "🎉 PARTY TIME! 🎉" : "Ceremony Finished"}
                </div>
            )}

            <div className="w-full max-w-6xl mt-16 flex flex-col lg:flex-row gap-8">
                {/* LEFT: Live Leaderboard */}
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-center mb-8">
                        Final Leaderboard
                    </h1>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {scores.map((s, i) => (
                            <div
                                key={s.student_id}
                                className={`flex justify-between items-center p-4 rounded-xl border ${i === 0
                                        ? "bg-amber-500/20 border-amber-500"
                                        : "bg-slate-900 border-slate-800"
                                    }`}
                            >
                                <span className="font-bold text-lg flex items-center gap-2">
                                    {i === 0 && (
                                        <Crown size={18} className="text-amber-400" />
                                    )}
                                    {i + 1}. {s.student_name}
                                </span>

                                <div className="flex gap-4 items-center">
                                    <span className="font-black text-lg text-slate-300">
                                        {s.score} pts
                                    </span>

                                    {s.answers_log && s.answers_log.length > 0 && (
                                        <button
                                            onClick={() => setSelectedStudent(s)}
                                            className="bg-indigo-600 p-2 rounded-lg hover:bg-indigo-500"
                                        >
                                            <FileText size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: 3D Stage */}
                <div className="flex-1 bg-slate-900 border-2 border-amber-500 rounded-3xl p-8 flex flex-col items-center justify-center relative shadow-[0_0_100px_rgba(245,158,11,0.15)] h-[500px] overflow-hidden">
                    {scores.length > 0 ? (
                        <div className="absolute inset-0 z-0">
                            <Canvas
                                shadows
                                camera={{ position: [0, 2, 10], fov: 50 }}
                            >
                                <ambientLight intensity={0.8} />
                                <spotLight
                                    position={[10, 10, 10]}
                                    intensity={1.5}
                                    castShadow
                                />

                                <Suspense fallback={<AvatarLoader />}>
                                    <AwardCeremony
                                        players={scores}
                                        isDancing={isDancing}
                                    />
                                </Suspense>

                                <ContactShadows
                                    position={[0, -1.5, 0]}
                                    opacity={0.7}
                                    scale={15}
                                    blur={2}
                                />

                                <Environment preset="city" />
                            </Canvas>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 z-10">
                            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>Waiting for players...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 🚨 REPORT MODAL WITH SAVE */}
            {selectedStudent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative max-h-[90vh] flex flex-col">
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-black mb-1">
                            {selectedStudent.student_name}'s Report
                        </h2>

                        <p className="text-slate-400 mb-4">
                            Score: {selectedStudent.score} pts
                        </p>

                        <button
                            onClick={() => saveReportToLibrary(selectedStudent)}
                            disabled={isSaving}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-6 shadow-lg transition-all"
                        >
                            {isSaving ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <Download size={18} />
                            )}
                            {isSaving
                                ? "Saving to Library..."
                                : "Save Report Card & Send to Parents"}
                        </button>

                        <div className="overflow-y-auto space-y-3 pr-2">
                            {selectedStudent.answers_log.map(
                                (log: any, i: number) => (
                                    <div
                                        key={i}
                                        className={`p-4 rounded-xl border flex gap-4 ${log.isCorrect
                                                ? "bg-emerald-950/30 border-emerald-900/50"
                                                : "bg-red-950/30 border-red-900/50"
                                            }`}
                                    >
                                        <div className="mt-1 shrink-0">
                                            {log.isCorrect ? (
                                                <CheckCircle
                                                    className="text-emerald-400"
                                                    size={20}
                                                />
                                            ) : (
                                                <AlertCircle
                                                    className="text-red-400"
                                                    size={20}
                                                />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <p className="font-bold text-white mb-1">
                                                {log.question}
                                            </p>

                                            <p className="text-sm text-slate-400">
                                                Answer:{" "}
                                                <span
                                                    className={
                                                        log.isCorrect
                                                            ? "text-emerald-400"
                                                            : "text-red-400"
                                                    }
                                                >
                                                    {log.studentAnswer}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}