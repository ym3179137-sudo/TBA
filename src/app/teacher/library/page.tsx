"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
    MonitorPlay, Plus, Play, Edit3, Trash2,
    ArrowLeft, UploadCloud, FileText, Send, Users, X, Loader2, CheckCircle
} from "lucide-react";

export default function TeacherLibrary() {
    const router = useRouter();
    const supabase = createClient();

    const [presentations, setPresentations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Publish Modal States
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [selectedPresentation, setSelectedPresentation] = useState<any>(null);
    const [targetType, setTargetType] = useState<'class' | 'student'>('class');
    const [targetValue, setTargetValue] = useState("");

    // Dropdown Data
    const [classesList, setClassesList] = useState<any[]>([]);
    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        fetchPresentations();
        fetchDropdownData();
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

    async function fetchDropdownData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Classes
        const { data: cData } = await supabase.from("teacher_classes").select("*").eq("teacher_id", user.id);
        if (cData) {
            setClassesList(cData);
            if (cData.length > 0) setTargetValue(cData[0].id);
        }

        // 🚨 FIX: Fetch ALL approved students
        const { data: sData } = await supabase
            .from("children")
            .select("id, full_name")
            .eq("is_approved", true);

        if (sData) setStudentsList(sData);
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this presentation?")) return;
        await supabase.from("presentations").delete().eq("id", id);
        fetchPresentations();
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return setUploading(false);

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('presentations').upload(`uploads/${fileName}`, file);

        if (uploadError) {
            alert("Upload Error: " + uploadError.message);
            setUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from('presentations').getPublicUrl(`uploads/${fileName}`);

        await supabase.from("presentations").insert({
            teacher_id: user.id,
            title: file.name.replace('.pptx', ''),
            file_url: publicUrl,
            deck_data: {},
            target_type: 'class',
            target_value: null // Unassigned initially
        });

        setUploading(false);
        fetchPresentations();
    }

    const handlePublish = async () => {
        if (!selectedPresentation || !targetValue) return;
        setIsPublishing(true);

        const { error } = await supabase
            .from("presentations")
            .update({ target_type: targetType, target_value: targetValue })
            .eq("id", selectedPresentation.id);

        setIsPublishing(false);

        if (error) {
            alert("Failed to publish: " + error.message);
        } else {
            setIsPublishModalOpen(false);
            alert("✅ Presentation sent successfully!");
            fetchPresentations();
        }
    };

    const openPublishModal = (pres: any) => {
        setSelectedPresentation(pres);
        setTargetType('class');
        setTargetValue(classesList.length > 0 ? classesList[0].id : "");
        setIsPublishModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
            <div className="max-w-6xl mx-auto">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <Link href="/teacher" prefetch={false} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white mb-2 transition-colors">
                            <ArrowLeft size={16} /> Back to AI Designer
                        </Link>
                        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                            <MonitorPlay className="text-emerald-400 w-8 h-8" /> My Library
                        </h1>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <Link href="/teacher/classes" prefetch={false} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
                            <Users size={18} /> Manage Classes
                        </Link>
                        <label className="cursor-pointer flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg border border-slate-700">
                            {uploading ? <span className="animate-pulse">Uploading...</span> : <><UploadCloud size={18} /> Upload PPTX</>}
                            <input type="file" accept=".pptx" onChange={handleUpload} className="hidden" disabled={uploading} />
                        </label>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-slate-500 mt-20 animate-pulse">Loading your library...</div>
                ) : presentations.length === 0 ? (
                    <div className="text-center mt-20 bg-slate-900/50 border border-slate-800 rounded-3xl p-12">
                        <FileText className="w-20 h-20 mx-auto text-slate-700 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-500">No presentations yet</h2>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {presentations.map((pres) => (
                            <div key={pres.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-emerald-500/50 transition-all flex flex-col">
                                <div className="h-40 bg-slate-950 flex items-center justify-center relative overflow-hidden border-b border-slate-800">
                                    {pres.file_url ? <FileText className="w-12 h-12 text-amber-500 z-10" /> : <MonitorPlay className="w-12 h-12 text-emerald-500 z-10" />}
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-white text-lg truncate" title={pres.title}>{pres.title}</h3>
                                        <p className="text-xs text-slate-500 mt-1 mb-3">{new Date(pres.created_at).toLocaleDateString()}</p>
                                    </div>

                                    <div className="flex flex-col gap-2 mt-auto">
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => router.push(`/teacher/present/${pres.id}`)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all shadow-md">
                                                <Play size={14} /> Present
                                            </button>
                                            {pres.file_url ? (
                                                <button onClick={() => handleDelete(pres.id)} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all">
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            ) : (
                                                <Link href={`/teacher?edit=${pres.id}`} prefetch={false} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all">
                                                    <Edit3 size={14} /> Edit
                                                </Link>
                                            )}
                                        </div>
                                        <button onClick={() => openPublishModal(pres)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all shadow-md">
                                            <Send size={14} /> Send to Class
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 🚨 GOOGLE CLASSROOM STYLE MODAL */}
            {isPublishModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans text-slate-800">

                        {/* Header */}
                        <div className="bg-[#1a73e8] p-6 text-white flex justify-between items-center">
                            <h2 className="text-xl font-medium flex items-center gap-2">
                                <Send size={20} /> Assign to Class
                            </h2>
                            <button onClick={() => setIsPublishModalOpen(false)} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="text-sm text-slate-500 mb-4">
                                Select who should receive <strong className="text-slate-900">{selectedPresentation?.title}</strong>.
                            </div>

                            {/* Radio Options */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input type="radio" name="target" checked={targetType === 'class'} onChange={() => setTargetType('class')} className="w-5 h-5 text-[#1a73e8] focus:ring-[#1a73e8]" />
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">Specific Class Group</p>
                                        <p className="text-sm text-slate-500">Send to a custom group you created</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input type="radio" name="target" checked={targetType === 'student'} onChange={() => setTargetType('student')} className="w-5 h-5 text-[#1a73e8] focus:ring-[#1a73e8]" />
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">Individual Student</p>
                                        <p className="text-sm text-slate-500">Send to one specific student</p>
                                    </div>
                                </label>
                            </div>

                            {/* 🚨 FIX 2: Fixed Dropdown Styling (Added bg-white and appearance-none) */}
                            <div className="pt-4 border-t">
                                {targetType === 'class' && (
                                    <select
                                        value={targetValue}
                                        onChange={(e) => setTargetValue(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-300 text-slate-900 rounded-xl p-3 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all font-medium appearance-none"
                                    >
                                        <option value="" disabled>Select a class...</option>
                                        {classesList.length === 0 && <option value="">No classes created yet</option>}
                                        {classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                )}
                                {targetType === 'student' && (
                                    <select
                                        value={targetValue}
                                        onChange={(e) => setTargetValue(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-300 text-slate-900 rounded-xl p-3 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition-all font-medium appearance-none"
                                    >
                                        <option value="" disabled>Select a student...</option>
                                        {studentsList.length === 0 && <option value="">No students available</option>}
                                        {studentsList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                            <button onClick={() => setIsPublishModalOpen(false)} className="px-6 py-2 rounded-lg font-medium text-[#1a73e8] hover:bg-blue-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handlePublish} disabled={isPublishing || !targetValue} className="bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-all">
                                {isPublishing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />} Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}