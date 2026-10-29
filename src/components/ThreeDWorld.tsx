"use client";

import React, { useRef, useState, Suspense, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { Coins, Palette, Shirt, CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { purchaseSkin } from "@/app/actions/purchase";

// 🚨 1. Nicer 3D Loading Spinner (Replaces the ugly pink box)
function LoadingFallback() {
    return (
        <Html center>
            <div className="flex flex-col items-center justify-center bg-slate-900/90 p-6 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
                <p className="text-white font-bold whitespace-nowrap text-sm">Loading Character...</p>
            </div>
        </Html>
    );
}

// 🚨 2. Error Boundary (If GitHub model is completely broken or fails to download)
class ModelErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}

function GLBAvatar({ modelUrl, hat }: { modelUrl: string, hat: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const fallbackUrl = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
    const safeUrl = (modelUrl && modelUrl.startsWith("http")) ? modelUrl : fallbackUrl;

    const { scene } = useGLTF(safeUrl);

    useFrame((state) => {
        if (ref.current) ref.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    });

    return (
        <group ref={ref}>
            <primitive object={scene.clone()} scale={1.2} position={[0, -1, 0]} />
            {hat && (
                <mesh position={[0, 1.8, 0]}>
                    <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
                    <meshStandardMaterial color="#fbbf24" metalness={0.8} />
                </mesh>
            )}
        </group>
    );
}

export default function AvatarStudio({
    studentId,
    initialCoins = 0,
    initialSkin = "",
    initialUnlockedSkins = []
}: {
    studentId: string,
    initialCoins: number,
    initialSkin: string,
    initialUnlockedSkins: string[]
}) {
    const fallbackModel = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
    const safeInitialSkin = (!initialSkin || initialSkin === "default") ? fallbackModel : initialSkin;

    const [coins, setCoins] = useState(initialCoins);
    const [storeItems, setStoreItems] = useState<any[]>([]);
    const [unlockedSkins, setUnlockedSkins] = useState<string[]>(
        initialUnlockedSkins.length > 0 ? initialUnlockedSkins : [fallbackModel]
    );
    const [equippedSkin, setEquippedSkin] = useState(safeInitialSkin);
    const [hasHat, setHasHat] = useState(false);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    // 🚨 3. PRELOAD the equipped skin instantly so it loads faster!
    useGLTF.preload(safeInitialSkin);

    useEffect(() => {
        async function fetchStore() {
            const res = await fetch("/api/store-items");
            const data = await res.json();

            if (data.items && data.items.length > 0) {
                setStoreItems(data.items);
            } else {
                setStoreItems([
                    { id: "1", name: "Astronaut", model_url: fallbackModel, price: 0 },
                    { id: "2", name: "Robot", model_url: "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb", price: 100 }
                ]);
            }
            setLoading(false);
        }
        fetchStore();
    }, []);

    const handlePurchase = async (item: any) => {
        if (unlockedSkins.includes(item.model_url)) {
            setEquippedSkin(item.model_url);
            await supabase.from("children").update({ equipped_skin: item.model_url }).eq("id", studentId);
            return;
        }

        if (coins < item.price) return alert("Not enough coins!");

        try {
            const res = await purchaseSkin(studentId, item.id, item.price, item.model_url);
            if (res.success) {
                setCoins(res.newCoins!);
                setUnlockedSkins([...unlockedSkins, item.model_url]);
                setEquippedSkin(item.model_url);
            }
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) return <div className="h-[650px] w-full flex items-center justify-center bg-slate-900 text-white font-bold text-xl rounded-3xl border-4 border-slate-800">Loading Studio...</div>;

    return (
        <div className="w-full max-w-6xl h-[650px] rounded-3xl overflow-hidden relative shadow-2xl border-4 border-slate-800 bg-slate-900 flex flex-col md:flex-row">

            {/* 3D CANVAS */}
            <div className="flex-1 relative bg-gradient-to-b from-indigo-900 to-slate-900">
                <div className="absolute top-4 left-4 z-10 bg-black/50 px-6 py-3 rounded-2xl shadow-lg border border-white/10 flex items-center gap-2 text-white font-bold text-xl pointer-events-none">
                    <Coins className="text-yellow-400" /> {coins}
                </div>

                {/* 🚨 Performance optimization: dpr={[1, 2]} */}
                <Canvas shadows camera={{ position: [0, 2, 6], fov: 45 }} dpr={[1, 2]}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
                    <Environment preset="city" />

                    <ModelErrorBoundary fallback={<LoadingFallback />}>
                        {/* 🚨 Replaced pink box with the new LoadingFallback spinner */}
                        <Suspense fallback={<LoadingFallback />}>
                            <GLBAvatar modelUrl={equippedSkin} hat={hasHat} />
                        </Suspense>
                    </ModelErrorBoundary>

                    <ContactShadows position={[0, -1.5, 0]} opacity={0.6} scale={10} blur={2} />
                    <OrbitControls enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2} />
                </Canvas>
            </div>

            {/* STORE UI */}
            <div className="w-full md:w-[400px] bg-white p-6 overflow-y-auto">
                <h2 className="text-2xl font-extrabold mb-6 text-slate-800 flex items-center gap-2">
                    <Palette className="text-emerald-500" /> Avatar Studio
                </h2>

                <div className="mb-8">
                    <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Characters</h3>
                    <div className="space-y-3">
                        {storeItems.map(item => {
                            const isOwned = unlockedSkins.includes(item.model_url) || item.price === 0;
                            const isEquipped = equippedSkin === item.model_url;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handlePurchase(item)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isEquipped ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Shirt className={isEquipped ? "text-emerald-500" : "text-slate-400"} />
                                        <span className="font-bold text-slate-700">{item.name}</span>
                                    </div>
                                    {isEquipped ? (
                                        <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Equipped</span>
                                    ) : isOwned ? (
                                        <span className="text-blue-600 font-bold text-sm">Equip</span>
                                    ) : (
                                        <span className="font-bold text-yellow-600">{item.price} 🪙</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={() => { if (!hasHat && coins >= 50) { setHasHat(true); setCoins(c => c - 50); } }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 ${hasHat ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
                >
                    <span className="font-bold text-slate-700">Golden Crown</span>
                    {hasHat ? <CheckCircle className="text-emerald-500" /> : <span className="font-bold text-yellow-600">50 🪙</span>}
                </button>
            </div>
        </div>
    );
}