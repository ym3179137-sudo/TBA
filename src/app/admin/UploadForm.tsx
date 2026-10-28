"use client";

import { useState } from "react";
import { UploadCloud, RefreshCw } from "lucide-react";

export default function UploadForm() {
    const [uploading, setUploading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setUploading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch("/api/upload-model", { method: "POST", body: formData });
            const data = await res.json();

            if (res.ok) {
                alert("✅ Model securely uploaded to GitHub and saved to the database!");
                (e.target as HTMLFormElement).reset();
            } else {
                alert("🚨 " + data.error);
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
                alert(`🔄 Sync Complete! Found ${data.total} total .glb files. Added ${data.added} new models to the store.`);
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
            <form onSubmit={handleUpload} className="space-y-4 max-w-md bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Character Name</label>
                    <input name="name" placeholder="e.g., Paw Patrol Chase" required className="w-full border p-2 rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Price (Coins)</label>
                    <input name="price" type="number" placeholder="100" required className="w-full border p-2 rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">3D Model File (.glb)</label>
                    <input name="file" type="file" accept=".glb" required className="w-full border p-2 rounded-lg bg-white" />
                </div>
                <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                    {uploading ? "Scanning & Uploading to GitHub..." : <><UploadCloud className="w-5 h-5" /> Upload Model</>}
                </button>
            </form>

            {/* 🔄 AUTO-SYNC BUTTON */}
            <div className="max-w-md p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                <h3 className="font-bold text-blue-900 mb-2">Auto-Sync from GitHub</h3>
                <p className="text-sm text-blue-700 mb-4">Already uploaded files to your GitHub repository? Click here to instantly pull them all into the store database.</p>
                <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                    {syncing ? "Scanning GitHub Repo..." : <><RefreshCw className="w-5 h-5" /> Sync All Models from GitHub</>}
                </button>
            </div>
        </div>
    );
}