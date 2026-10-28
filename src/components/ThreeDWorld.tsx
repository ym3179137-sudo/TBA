"use client";

import { useRef, useState, Suspense, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Coins, Palette, Shirt, CheckCircle, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { purchaseSkin } from "@/app/actions/purchase";

function ModelFallback() {
    return (
        <mesh position={[0, 1, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="hotpink" wireframe />
        </mesh>
    );
}

function GLBAvatar({ modelUrl, hat }: { modelUrl: string, hat: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const fallbackUrl = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

    let scene;
    try {
        const gltf = useGLTF(modelUrl);
        scene = gltf.scene;
    } catch (error) {
        const fallbackGltf = useGLTF(fallbackUrl);
        scene = fallbackGltf.scene;
    }

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
    initialCoins = 100,
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
    const [activeCategory, setActiveCategory] = useState("All");

    const supabase = createClient();

    // 🚀 Preload the equipped skin for instant loading
    useGLTF.preload(equippedSkin);

    useEffect(() => {
        async function fetchData() {
            const { data: items } = await supabase.from("store_items").select("*");
            if (items) setStoreItems(items);
            setLoading(false);
        }
        fetchData();
    }, [supabase]);

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

    // 🛠️ Sort Items by Category
    const categories = ["All", ...Array.from(new Set(storeItems.map(item => item.category || "Other")))];
    const filteredItems = activeCategory === "All"
        ? storeItems
        : storeItems.filter(item => (item.category || "Other") === activeCategory);

    if (loading) return <div className="h-[650px] flex items-center justify-center bg-slate-900 text-white font-bold text-xl">Loading Studio...</div>;

    return (
        <div className="w-full h-[650px] rounded-3xl overflow-hidden relative shadow-2xl border-4 border-slate-800 bg-slate-900 flex flex-col md:flex-row">
            <div className="flex-1 relative bg-gradient-to-b from-indigo-900 to-slate-900">
                <div className="absolute top-4 left-4 z-10 bg-black/50 px-6 py-3 rounded-2xl shadow-lg border border-white/10 flex items-center gap-2 text-white font-bold text-xl">
                    <Coins className="text-yellow-400" /> {coins}
                </div>

                <Canvas shadows camera={{ position: [0, 2, 6], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
                    <Environment preset="city" />

                    <Suspense fallback={<ModelFallback />}>
                        <GLBAvatar modelUrl={equippedSkin} hat={hasHat} />
                    </Suspense>

                    <ContactShadows position={[0, -1.5, 0]} opacity={0.6} scale={10} blur={2} />
                    <OrbitControls enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2} />
                </Canvas>
            </div>

            <div className="w-full md:w-[400px] bg-white p-6 overflow-y-auto flex flex-col">
                <h2 className="text-2xl font-extrabold mb-4 text-slate-800 flex items-center gap-2">
                    <Palette className="text-emerald-500" /> Avatar Studio
                </h2>

                {/* 🛠️ Category Tabs */}
                <div className="flex gap-2 overflow-x-auto mb-6 pb-2 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex-1 space-y-3">
                    {filteredItems.map(item => {
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
                                    <span className="font-bold text-yellow-600 flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> {item.price} 🪙
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => { if (!hasHat && coins >= 50) { setHasHat(true); setCoins(c => c - 50); } }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 mt-4 shrink-0 ${hasHat ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
                >
                    <span className="font-bold text-slate-700">Golden Crown</span>
                    {hasHat ? <CheckCircle className="text-emerald-500" /> : <span className="font-bold text-yellow-600">50 🪙</span>}
                </button>
            </div>
        </div>
    );
}