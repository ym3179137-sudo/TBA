"use client";

import { useState } from "react";
import { UploadCloud, RefreshCw, AlertTriangle } from "lucide-react";

export default function UploadForm() {
    const [uploading, setUploading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [itemType, setItemType] = useState("character");

    async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const file = formData.get("file") as File;

        // 🚨 Strict Client-Side Validation
        if (!file) return alert("Please select a file.");

        if (!file.name.endsWith('.glb')) {
            return alert("🚨 Invalid File Type. Only .glb files are allowed.");
        }

        const maxSize = 25 * 1024 * 1024; // 25MB limit
        if (file.size > maxSize) {
            return alert("🚨 File is too large. Maximum size is 25MB.");
        }

        formData.append("itemType", itemType);
        setUploading(true);

        try {
            const res = await fetch("/api/upload-model", { method: "POST", body: formData });
            const data = await res.json();

            if (res.ok) {
                alert(`✅ ${itemType === 'emote' ? 'Emote' : 'Character'} securely uploaded and saved to the database!`);
                (e.target as HTMLFormElement).reset();
            } else {
                alert("🚨 Upload Failed: " + data.error);
            }
        } catch (err) {
            alert("Failed to upload. Check your connection.");
        } finally {
            setUploading(false);
        }
    }

    async function handleSync() {
        setSyncing(true);
        try {
            const res = await fetch("/api/admin/sync-github", { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                alert(`🔄 Sync Complete! Found ${data.total} total .glb files. Added ${data.added} new models.`);
            } else {
                alert("🚨 Sync Error: " + data.error);
            }
        } catch (err) {
            alert("Failed to sync with GitHub.");
        } finally {
            setSyncing(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* 📤 MANUAL UPLOAD FORM */}
            <form onSubmit={handleUpload} className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">

                {/* Item Type Selector */}
                <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-700">
                    <button
                        type="button"
                        onClick={() => setItemType("character")}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${itemType === 'character' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        Character Model
                    </button>
                    <button
                        type="button"
                        onClick={() => setItemType("emote")}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${itemType === 'emote' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        Emote / Animation
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-400 mb-1">Item Name</label>
                    <input name="name" placeholder="e.g., Paw Patrol Chase or Fortnite Dance" required className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-xl focus:border-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-400 mb-1">Price (Coins)</label>
                    <input name="price" type="number" placeholder="100" required className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-xl focus:border-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-400 mb-1">3D File (.glb strictly)</label>
                    <input name="file" type="file" accept=".glb" required className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500" />
                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> Maximum file size: 25MB. Header must strictly be glTF.</p>
                </div>
                <button
                    type="submit"
                    disabled={uploading}
                    className={`w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${itemType === 'emote' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                >
                    {uploading ? "Validating & Uploading..." : <><UploadCloud className="w-5 h-5" /> Upload {itemType === 'emote' ? 'Emote' : 'Model'}</>}
                </button>
            </form>

            {/* 🔄 AUTO-SYNC BUTTON */}
            <div className="p-6 bg-blue-950/30 border border-blue-900/50 rounded-2xl">
                <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-2"><RefreshCw size={18} /> Auto-Sync from GitHub</h3>
                <p className="text-sm text-blue-200/70 mb-4">Pull all `.glb` files from your GitHub repository directly into the store database.</p>
                <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                    {syncing ? "Scanning GitHub Repo..." : <><RefreshCw className="w-5 h-5" /> Sync All Models</>}
                </button>
            </div>
        </div>
    );
}