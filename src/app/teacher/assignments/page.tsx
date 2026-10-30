"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    ArrowLeft, Save, Lock, Unlock, Plus, Trash2,
    FileText, ClipboardList, Loader2, AlertTriangle,
    UploadCloud, Link as LinkIcon
} from "lucide-react";

export default function TeacherAssignmentsPage() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    const [title, setTitle] = useState("");
    const [type, setType] = useState<"doc" | "form">("form");

    // Multiple Class States
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

    const [lockMode, setLockMode] = useState(false);

    // Form Builder State
    const [questions, setQuestions] = useState<any[]>([
        { id: "q1", type: "short_text", label: "Question 1", required: true, options: [] }
    ]);

    const [docUrl, setDocUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        async function fetchClasses() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from("teacher_classes")
                .select("id, name")
                .eq("teacher_id", user.id)
                .order("created_at", { ascending: true });

            if (data) setClasses(data);
        }
        fetchClasses();
    }, [supabase]);

    const toggleClass = (id: string) => {
        setSelectedClassIds(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const addQuestion = (qType: string) => {
        setQuestions([...questions, {
            id: `q${Date.now()}`,
            type: qType,
            label: `New ${qType.replace('_', ' ')} question`,
            options: qType === 'multiple_choice' || qType === 'checkboxes' ? ["Option 1", "Option 2"] : []
        }]);
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const newQ = [...questions];
        newQ[index][field] = value;
        setQuestions(newQ);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError("");

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `assignment-${Date.now()}.${fileExt}`;

            const { data, error: uploadError } = await supabase.storage
                .from('presentations')
                .upload(`assignments/${fileName}`, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('presentations')
                .getPublicUrl(`assignments/${fileName}`);

            setDocUrl(publicUrl);
        } catch (err: any) {
            setError("Failed to upload file. " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleCreate = async () => {
        if (!title.trim()) return setError("Please enter an assignment title.");
        if (selectedClassIds.length === 0) return setError("Please select at least one class.");

        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const settingsPayload: any = { lockMode };

            if (type === 'form') {
                settingsPayload.questions = questions;
            } else {
                settingsPayload.docUrl = docUrl;
            }

            const res = await fetch("/api/assignments/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    type,
                    target_class_ids: selectedClassIds,
                    settings: settingsPayload
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create assignment");
            }

            setSuccess(true);
            setTimeout(() => router.push("/teacher/assessments"), 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-4xl mx-auto">

                <div className="flex items-center gap-4 mb-8">
                    <Link href="/teacher" className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white">Create Assignment</h1>
                        <p className="text-slate-400 text-sm">Build a Google Doc or Google Form style assignment.</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3 font-bold">
                        <AlertTriangle /> {error}
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl mb-6 flex items-center gap-3 font-bold">
                        ✅ Assignment created successfully! Redirecting...
                    </div>
                )}

                <div className="space-y-6 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">

                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">Assignment Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Science Quiz - Water Cycle"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">Assign to Classes (Select Multiple)</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {classes.map(c => (
                                <label
                                    key={c.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedClassIds.includes(c.id) ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-950 border-slate-700 hover:border-slate-500'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedClassIds.includes(c.id)}
                                        onChange={() => toggleClass(c.id)}
                                        className="w-4 h-4 accent-emerald-500"
                                    />
                                    <span className="font-bold text-sm truncate">{c.name}</span>
                                </label>
                            ))}
                            {classes.length === 0 && <p className="text-slate-500 text-sm col-span-3">You haven't created any classes yet.</p>}
                        </div>
                    </div>

                    <div className="flex gap-4 p-2 bg-slate-950 rounded-xl border border-slate-800">
                        <button
                            onClick={() => setType("form")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${type === "form" ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}
                        >
                            <ClipboardList size={20} /> Google Form (Quiz)
                        </button>
                        <button
                            onClick={() => setType("doc")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${type === "doc" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}
                        >
                            <FileText size={20} /> Google Doc (Writing)
                        </button>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div>
                            <p className="font-bold text-white flex items-center gap-2">
                                {lockMode ? <Lock className="text-red-400" size={18} /> : <Unlock className="text-slate-400" size={18} />}
                                Lock Mode (Anti-Cheat)
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Logs a violation if the student switches tabs or pastes large text.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={lockMode} onChange={e => setLockMode(e.target.checked)} className="sr-only peer" />
                            <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
                        </label>
                    </div>

                    {type === "form" && (
                        <div className="space-y-4 pt-6 border-t border-slate-800">
                            <h2 className="text-xl font-bold text-white mb-4">Form Questions</h2>

                            {questions.map((q, i) => (
                                <div key={q.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative group">
                                    <button
                                        onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}
                                        className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <div className="flex gap-4 mb-3 pr-8">
                                        <input
                                            type="text"
                                            value={q.label}
                                            onChange={(e) => updateQuestion(i, 'label', e.target.value)}
                                            className="flex-1 bg-slate-900 border border-slate-700 text-white p-3 rounded-xl font-bold focus:border-emerald-500 outline-none"
                                            placeholder="Enter your question..."
                                        />
                                        <select
                                            value={q.type}
                                            onChange={(e) => updateQuestion(i, 'type', e.target.value)}
                                            className="bg-slate-800 text-sm font-bold text-slate-300 p-3 rounded-xl outline-none"
                                        >
                                            <option value="short_text">Short Text</option>
                                            <option value="long_text">Long Text</option>
                                            <option value="multiple_choice">Multiple Choice</option>
                                            <option value="checkboxes">Checkboxes</option>
                                        </select>
                                    </div>

                                    {(q.type === 'multiple_choice' || q.type === 'checkboxes') && (
                                        <div className="mt-4 space-y-2 pl-4 border-l-2 border-emerald-500/50">
                                            {(q.options || []).map((opt: string, optIdx: number) => (
                                                <div key={optIdx} className="flex items-center gap-2">
                                                    <div className={`w-4 h-4 rounded-full border border-slate-600 ${q.type === 'multiple_choice' ? 'rounded-full' : 'rounded-sm'}`}></div>
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOpts = [...(q.options || [])];
                                                            newOpts[optIdx] = e.target.value;
                                                            updateQuestion(i, 'options', newOpts);
                                                        }}
                                                        className="flex-1 bg-slate-900 border border-slate-700 text-sm text-white p-2 rounded-lg outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => updateQuestion(i, 'options', [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`])}
                                                className="text-xs text-emerald-400 font-bold mt-2 hover:text-emerald-300"
                                            >
                                                + Add Option
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="flex flex-wrap gap-2 mt-4">
                                <button onClick={() => addQuestion('short_text')} className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"><Plus size={16} /> Short Text</button>
                                <button onClick={() => addQuestion('long_text')} className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"><Plus size={16} /> Long Text</button>
                                <button onClick={() => addQuestion('multiple_choice')} className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"><Plus size={16} /> Multiple Choice</button>
                                <button onClick={() => addQuestion('checkboxes')} className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"><Plus size={16} /> Checkboxes</button>
                            </div>
                        </div>
                    )}

                    {type === "doc" && (
                        <div className="pt-6 border-t border-slate-800 space-y-6">
                            <div className="text-center py-6">
                                <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-bold text-white mb-2">Source Document (Optional)</h3>
                                <p className="text-slate-400 max-w-md mx-auto text-sm">
                                    Upload a Word/PDF file or paste a Google Drive link.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
                                    <UploadCloud className="w-8 h-8 text-emerald-400 mb-3" />
                                    <p className="font-bold text-white mb-2">Upload File</p>
                                    <p className="text-xs text-slate-500 mb-4">Word (.docx) or PDF</p>
                                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all">
                                        {uploading ? "Uploading..." : "Choose File"}
                                        <input type="file" accept=".docx, .pdf" onChange={handleFileUpload} className="hidden" />
                                    </label>
                                </div>

                                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 mb-3">
                                        <LinkIcon className="w-5 h-5 text-amber-400" />
                                        <p className="font-bold text-white">Google Drive Link</p>
                                    </div>
                                    <input
                                        type="text"
                                        value={docUrl}
                                        onChange={e => setDocUrl(e.target.value)}
                                        placeholder="https://docs.google.com/..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-amber-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleCreate}
                        disabled={loading || uploading || classes.length === 0}
                        className="w-full mt-8 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-lg py-4 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {loading ? "Saving..." : "Publish Assignment"}
                    </button>

                </div>
            </div>
        </div>
    );
}