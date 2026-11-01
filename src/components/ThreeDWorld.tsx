"use client";

import React, { useRef, useState, Suspense, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, useGLTF, Html, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { Coins, Palette, Shirt, CheckCircle, Loader2, Smile } from "lucide-react";
import { purchaseSkin, equipSkin, equipEmote } from "@/app/actions/purchase";
import { createClient } from "@/lib/supabase/client";

function LoadingFallback() {
    return <Html center><div className="text-white font-bold p-4 bg-slate-900 rounded-xl">Loading...</div></Html>;
}

class ModelErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError() { return { hasError: true }; }
    render() { if (this.state.hasError) return this.props.fallback; return this.props.children; }
}

function GLBAvatar({ modelUrl, hat, emote }: { modelUrl: string, hat: boolean, emote: string }) {
    const ref = useRef<THREE.Group>(null);
    const fallbackUrl = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
    const safeUrl = (modelUrl && modelUrl.startsWith("http")) ? modelUrl : fallbackUrl;

    // Load the character model
    const { scene } = useGLTF(safeUrl);

    // 🚨 If you want the emote to be an actual 3D animation from a file, you would load it here.
    // For now, we simulate the emote with code (dance/spin) since they are just names in the DB.

    useFrame((state) => {
        if (!ref.current) return;

        // Default idle float
        ref.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;

        // 🚨 Emote logic based on the name
        if (emote.toLowerCase().includes("dance")) {
            ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 8) * 0.5;
            ref.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.3;
        }
        if (emote.toLowerCase().includes("spin")) {
            ref.current.rotation.y += 0.05;
        }
        if (emote.toLowerCase().includes("jump")) {
            ref.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 4)) * 0.8;
        }
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
    initialEmote = "none",
    initialUnlockedSkins = []
}: {
    studentId: string,
    initialCoins: number,
    initialSkin: string,
    initialEmote: string,
    initialUnlockedSkins: string[]
}) {
    const fallbackModel = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
    const safeInitialSkin = (!initialSkin || initialSkin === "default") ? fallbackModel : initialSkin;

    const [coins, setCoins] = useState(initialCoins);
    const [equippedSkin, setEquippedSkin] = useState(safeInitialSkin);
    const [equippedEmote, setEquippedEmote] = useState(initialEmote || "none");
    const [unlockedSkins, setUnlockedSkins] = useState(initialUnlockedSkins.length > 0 ? initialUnlockedSkins : [fallbackModel]);

    const [activeTab, setActiveTab] = useState<'characters' | 'emotes'>('characters');
    const [hasHat, setHasHat] = useState(false);

    // 🚨 State for dynamic items
    const [storeCharacters, setStoreCharacters] = useState<any[]>([]);
    const [storeEmotes, setStoreEmotes] = useState<any[]>([]);
    const [loadingStore, setLoadingStore] = useState(true);

    const supabase = createClient();

    // 🚨 Fetch items from the database on load
    useEffect(() => {
        async function fetchStore() {
            const { data: items } = await supabase.from("store_items").select("*");

            if (items) {
                setStoreCharacters(items.filter(i => i.item_type === 'character'));
                setStoreEmotes(items.filter(i => i.item_type === 'emote'));
            }
            setLoadingStore(false);
        }
        fetchStore();
    }, [supabase]);

    const handleEquipSkin = async (item: any) => {
        if (unlockedSkins.includes(item.model_url)) {
            setEquippedSkin(item.model_url);
            await equipSkin(studentId, item.model_url);
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
        } catch (err: any) { alert(err.message); }
    };

    const handleEquipEmote = async (emote: any) => {
        // Note: If you want emotes to cost coins, you would deduct them here just like skins.
        setEquippedEmote(emote.name); // We use the name to trigger the animation
        await equipEmote(studentId, emote.name);
    };

    return (
        <div className="w-full max-w-6xl h-[650px] rounded-3xl overflow-hidden relative shadow-2xl border-4 border-slate-800 bg-slate-900 flex flex-col md:flex-row">
            {/* LEFT: 3D Viewer */}
            <div className="flex-1 relative bg-gradient-to-b from-indigo-900 to-slate-900">
                <div className="absolute top-4 left-4 z-10 bg-black/50 px-6 py-3 rounded-2xl flex items-center gap-2 text-white font-bold text-xl pointer-events-none">
                    <Coins className="text-yellow-400" /> {coins}
                </div>

                <Canvas shadows camera={{ position: [0, 2, 6], fov: 45 }} dpr={[1, 2]}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
                    <Environment preset="city" />
                    <ModelErrorBoundary fallback={<LoadingFallback />}>
                        <Suspense fallback={<LoadingFallback />}>
                            <GLBAvatar modelUrl={equippedSkin} hat={hasHat} emote={equippedEmote} />
                        </Suspense>
                    </ModelErrorBoundary>
                    <ContactShadows position={[0, -1.5, 0]} opacity={0.6} scale={10} blur={2} />
                    <OrbitControls enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2} />
                </Canvas>
            </div>

            {/* RIGHT: Store Menu */}
            <div className="w-full md:w-[400px] bg-white p-6 overflow-y-auto">
                <div className="flex gap-2 mb-6">
                    <button onClick={() => setActiveTab('characters')} className={`flex-1 py-2 font-bold rounded-lg ${activeTab === 'characters' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>Characters</button>
                    <button onClick={() => setActiveTab('emotes')} className={`flex-1 py-2 font-bold rounded-lg ${activeTab === 'emotes' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>Emotes</button>
                </div>

                {loadingStore ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400 w-8 h-8" /></div>
                ) : (
                    <>
                        {activeTab === 'characters' && (
                            <div className="space-y-3">
                                {storeCharacters.length === 0 && <p className="text-center text-slate-500 py-8">No characters in store yet.</p>}
                                {storeCharacters.map(item => {
                                    const isOwned = unlockedSkins.includes(item.model_url) || item.price === 0;
                                    const isEquipped = equippedSkin === item.model_url;
                                    return (
                                        <button key={item.id} onClick={() => handleEquipSkin(item)} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 ${isEquipped ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                                            <div className="flex items-center gap-3"><Shirt className={isEquipped ? "text-emerald-500" : "text-slate-400"} /><span className="font-bold text-slate-700">{item.name}</span></div>
                                            {isEquipped ? <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Equipped</span> : isOwned ? <span className="text-blue-600 font-bold text-sm">Equip</span> : <span className="font-bold text-yellow-600">{item.price} 🪙</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'emotes' && (
                            <div className="space-y-3">
                                {storeEmotes.length === 0 && <p className="text-center text-slate-500 py-8">No emotes in store yet.</p>}
                                {storeEmotes.map(emote => {
                                    const isEquipped = equippedEmote === emote.name;
                                    return (
                                        <button key={emote.id} onClick={() => handleEquipEmote(emote)} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 ${isEquipped ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                                            <div className="flex items-center gap-3"><Smile className={isEquipped ? "text-emerald-500" : "text-slate-400"} /><span className="font-bold text-slate-700">{emote.name}</span></div>
                                            {isEquipped ? <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Equipped</span> : <span className="text-blue-600 font-bold text-sm">Equip</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}