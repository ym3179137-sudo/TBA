"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Smile, UploadCloud, Link as LinkIcon, Loader2 } from "lucide-react";

export default function EmoteManager() {
    const supabase = createClient();
    const [emotes, setEmotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [emoteName, setEmoteName] = useState("");
    const [emoteUrl, setEmoteUrl] = useState("");
    const [price, setPrice] = useState("50");

    useEffect(() => {
        fetchEmotes();
    }, []);

    async function fetchEmotes() {
        const { data } = await supabase
            .from("store_items")
            .select("*")
            .eq("item_type", "emote");
        if (data) setEmotes(data);
        setLoading(false);
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileName = `emote-${Date.now()}.${file.name.split('.').pop()}`;
            // 🚨 Make sure you have a public bucket named 'presentations' or 'emotes'
            const { error: uploadError } = await supabase.storage
                .from('presentations')
                .upload(`emotes/${fileName}`, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('presentations')
                .getPublicUrl(`emotes/${fileName}`);

            setEmoteUrl(publicUrl);
        } catch (err: any) {
            alert("Upload failed: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleAddEmote = async () => {
        if (!emoteName || !emoteUrl) return alert("Name and URL are required.");

        const { error } = await supabase.from("store_items").insert({
            name: emoteName,
            model_url: emoteUrl, // Reusing model_url column for the emote animation URL
            price: parseInt(price),
            item_type: 'emote',
            category: 'Emotes'
        });

        if (error) alert(error.message);
        else {
            setEmoteName("");
            setEmoteUrl("");
            fetchEmotes();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this emote?")) return;
        await supabase.from("store_items").delete().eq("id", id);
        fetchEmotes();
    };

    if (loading) return <div className="p-8 text-center text-slate-500"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Smile className="text-purple-400" /> Emote Manager
            </h2>

            {/* Add Form */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Emote Name (e.g., Fortnite Dance)"
                        value={emoteName}
                        onChange={e => setEmoteName(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white rounded-xl p-3 outline-none"
                    />
                    <input
                        type="number"
                        placeholder="Price (Coins)"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white rounded-xl p-3 outline-none"
                    />
                </div>

                <div className="flex gap-4 items-center">
                    <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 border border-slate-700">
                        {uploading ? "Uploading..." : <><UploadCloud size={18} /> Upload GLB File</>}
                        <input type="file" accept=".glb" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                    </label>
                    <span className="text-slate-500 font-bold">OR</span>
                    <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3">
                        <LinkIcon size={18} className="text-slate-500" />
                        <input
                            type="text"
                            placeholder="Paste GLB URL (e.g., from Mixamo)"
                            value={emoteUrl}
                            onChange={e => setEmoteUrl(e.target.value)}
                            className="flex-1 bg-transparent text-white py-3 outline-none text-sm"
                        />
                    </div>
                </div>

                <button onClick={handleAddEmote} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                    <Plus size={18} /> Add Emote
                </button>
            </div>

            {/* List */}
            <div className="grid md:grid-cols-2 gap-3">
                {emotes.map(emote => (
                    <div key={emote.id} className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div>
                            <p className="font-bold text-white">{emote.name}</p>
                            <p className="text-xs text-slate-500">{emote.price} Coins</p>
                        </div>
                        <button onClick={() => handleDelete(emote.id)} className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 rounded-lg">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {emotes.length === 0 && <p className="text-slate-500 text-sm col-span-2">No emotes added yet.</p>}
            </div>
        </div>
    );
}