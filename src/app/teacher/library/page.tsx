"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MonitorPlay, Plus, Play, Edit3, Trash2, ArrowLeft, UploadCloud, FileText } from "lucide-react";

export default function TeacherLibrary() {
    const router = useRouter();
    const supabase = createClient();

    const [presentations, setPresentations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchPresentations();
    }, []);

    async function fetchPresentations() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/sign-in");

        const { data } = await supabase
            .from("presentations")
            .select("*")
            .eq("teacher_id", user.id)
            .order("created_at", { ascending: false });

        if (data) setPresentations(data);
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this presentation?")) return;
        await supabase.from("presentations").delete().eq("id", id);
        fetchPresentations();
    }

    // 🚨 Handle PowerPoint Uploads
    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('presentations') // Make sure you create a public bucket called 'presentations' in Supabase Storage
            .upload(`uploads/${fileName}`, file);

        if (uploadError) {
            alert("Failed to upload file. Ensure you created a public bucket named 'presentations'.");
            setUploading(false);
            return;
        }

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('presentations')
            .getPublicUrl(`uploads/${fileName}`);

        // 3. Save to Database
        await supabase.from("presentations").insert({
            teacher_id: user.id,
            title: file.name.replace('.pptx', ''),
            file_url: publicUrl,
            deck_data: {}, // No AI data
            target_type: 'all'
        });

        setUploading(false);
        fetchPresentations();
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Link href="/teacher" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white mb-2">
                            <ArrowLeft size={16} /> Back to AI Designer
                        </Link>
                        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                            <MonitorPlay className="text-emerald-400 w-8 h-8" /> My Library
                        </h1>
                    </div>

                    <div className="flex gap-4">
                        <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg border border-slate-700">
                            {uploading ? <span className="animate-pulse">Uploading...</span> : <><UploadCloud size={18} /> Upload PowerPoint</>}
                            <input type="file" accept=".pptx" onChange={handleUpload} className="hidden" />
                        </label>
                        <Link href="/teacher" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
                            <Plus size={18} /> Create New
                        </Link>
                    </div>
                </div>

                {/* Presentations Grid */}
                {loading ? (
                    <div className="text-center text-slate-500 mt-20">Loading your library...</div>
                ) : presentations.length === 0 ? (
                    <div className="text-center mt-20">
                        <FileText className="w-20 h-20 mx-auto text-slate-700 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-500">No presentations yet</h2>
                        <p className="text-slate-600 mt-2">Create one with AI or upload a PowerPoint file.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {presentations.map((pres) => (
                            <div key={pres.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-emerald-500/50 transition-all group flex flex-col">

                                {/* Thumbnail Area */}
                                <div className="h-40 bg-slate-950 flex items-center justify-center relative overflow-hidden border-b border-slate-800">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                                    {pres.file_url ? (
                                        <FileText className="w-12 h-12 text-amber-500 z-10" />
                                    ) : (
                                        <MonitorPlay className="w-12 h-12 text-emerald-500 z-10" />
                                    )}
                                </div>

                                {/* Info & Actions */}
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-white text-lg truncate" title={pres.title}>{pres.title}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{new Date(pres.created_at).toLocaleDateString()}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-6">
                                        <Link href={`/teacher/present/${pres.id}`} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all shadow-md">
                                            <Play size={14} /> Present
                                        </Link>

                                        {pres.file_url ? (
                                            <button onClick={() => handleDelete(pres.id)} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all">
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        ) : (
                                            <Link href={`/teacher?edit=${pres.id}`} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all">
                                                <Edit3 size={14} /> Edit
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}