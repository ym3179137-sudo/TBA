"use client";
import { useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Lock } from "lucide-react";

// 🧸 The 3D Character
function Character({ color }: { color: string }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (ref.current) ref.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.2;
    });
    return (
        <group ref={ref}>
            <mesh position={[0, 1, 0]}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.4, 1, 32]} />
                <meshStandardMaterial color="#fcd34d" />
            </mesh>
        </group>
    );
}

export default function StudentLobby({ params }: { params: Promise<{ pin: string }> }) {
    const resolvedParams = params as any;
    const pin = resolvedParams.pin;

    const [student, setStudent] = useState<any>(null);
    const [gameSession, setGameSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    // Skins configuration
    const SKINS = [
        { id: "default", name: "Blue Buddy", color: "#3b82f6", requiredPoints: 0 },
        { id: "red", name: "Red Rocket", color: "#ef4444", requiredPoints: 100 },
        { id: "green", name: "Green Machine", color: "#10b981", requiredPoints: 250 },
        { id: "gold", name: "Golden Star", color: "#eab308", requiredPoints: 500 },
    ];

    useEffect(() => {
        async function init() {
            // 1. Get student info from cookie
            const cookies = document.cookie.split("; ");
            const idCookie = cookies.find(row => row.startsWith("student_id="));
            if (!idCookie) { router.push("/student-login"); return; }
            const studentId = idCookie.split("=")[1];

            // 2. Fetch student data (to check unlocked skins and total points)
            const { data: studentData } = await supabase.from("children").select("*").eq("id", studentId).single();
            setStudent(studentData);

            // 3. Fetch game session data (to check if it started)
            const { data: sessionData } = await supabase.from("game_sessions").select("*, games(*)").eq("pin", pin).single();
            setGameSession(sessionData);

            setLoading(false);

            // 4. Listen for the teacher to start the game
            const subscription = supabase
                .channel('game_start')
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `pin=eq.${pin}` },
                    (payload) => {
                        if (payload.new.status === 'playing') {
                            router.push(`/play/${pin}/arena`);
                        }
                    }
                )
                .subscribe();

            return () => { supabase.removeChannel(subscription); };
        }
        init();
    }, [pin, supabase, router]);

    async function equipSkin(skinId: string, requiredPoints: number) {
        if (student.total_points_earned < requiredPoints) return; // Can't afford it

        // Update in DB
        const { error } = await supabase.from("children").update({ equipped_skin: skinId }).eq("id", student.id);
        if (!error) {
            setStudent({ ...student, equipped_skin: skinId });
        }
    }

    if (loading || !student || !gameSession) return <div className="h-screen flex items-center justify-center bg-indigo-900 text-white font-bold text-2xl">Loading Lobby...</div>;

    const currentSkin = SKINS.find(s => s.id === student.equipped_skin) || SKINS[0];

    return (
        <main className="min-h-screen bg-indigo-900 text-white p-8">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 h-[80vh]">

                {/* Left: 3D Character View */}
                <div className="bg-indigo-800 rounded-3xl overflow-hidden relative flex flex-col items-center justify-center p-8">
                    <h2 className="absolute top-6 text-3xl font-extrabold">{student.full_name}</h2>
                    <div className="w-full h-[400px]">
                        <Canvas camera={{ position: [0, 1.5, 5], fov: 45 }}>
                            <ambientLight intensity={0.5} />
                            <directionalLight position={[10, 10, 5]} intensity={1.5} />
                            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                                <Character color={currentSkin.color} />
                            </Float>
                            <Environment preset="city" />
                        </Canvas>
                    </div>
                    <p className="text-xl font-bold text-emerald-400 bg-emerald-900/50 px-4 py-2 rounded-full">Waiting for teacher to start...</p>
                </div>

                {/* Right: Skin Inventory */}
                <div className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">My Skins</h2>
                        <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-bold">
                            ⭐ {student.total_points_earned} Lifetime Points
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3">
                        {SKINS.map(skin => {
                            const isUnlocked = student.total_points_earned >= skin.requiredPoints;
                            const isEquipped = student.equipped_skin === skin.id;

                            return (
                                <div key={skin.id} className={`p-4 rounded-2xl border-2 flex justify-between items-center ${isEquipped ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full shadow-inner" style={{ backgroundColor: skin.color }}></div>
                                        <div>
                                            <p className="font-bold text-lg">{skin.name}</p>
                                            <p className="text-sm text-slate-500">
                                                {isUnlocked ? "Unlocked" : `Requires ${skin.requiredPoints} Points`}
                                            </p>
                                        </div>
                                    </div>

                                    {isUnlocked ? (
                                        <button
                                            onClick={() => equipSkin(skin.id, skin.requiredPoints)}
                                            disabled={isEquipped}
                                            className={`px-4 py-2 rounded-lg font-bold ${isEquipped ? 'text-emerald-600' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                                        >
                                            {isEquipped ? <CheckCircle2 className="w-5 h-5" /> : "Equip"}
                                        </button>
                                    ) : (
                                        <Lock className="w-6 h-6 text-slate-400" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </main>
    );
}