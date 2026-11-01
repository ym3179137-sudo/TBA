"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAssignment } from "@/app/actions/assignments";
import { CheckSquare, FileText, Lock, Loader2, ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import Link from "next/link";

export default function CreateAssignmentPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"doc" | "form">("form");
    const [targetGrade, setTargetGrade] = useState("KG1");
    const [lockMode, setLockMode] = useState(false);

    // 🚨 THIS IS WHERE THE QUESTIONS ARE STORED
    const [questions, setQuestions] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Add a new question
    const addQuestion = (qType: string) => {
        const newQ = {
            id: `q_${Date.now()}`,
            type: qType,
            label: "New Question",
            options: (qType === 'multiple_choice' || qType === 'checkboxes') ? ["Option 1", "Option 2"] : undefined
        };
        setQuestions([...questions, newQ]);
    };

    // Update a question field
    const updateQuestion = (index: number, field: string, value: any) => {
        const updated = [...questions];
        updated[index][field] = value;
        setQuestions(updated);
    };

    // Delete a question
    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handlePublish = async () => {
        if (!title.trim()) return setError("Title is required.");
        if (type === 'form' && questions.length === 0) return setError("Add at least one question to the form.");

        setLoading(true);
        setError(null);

        try {
            await createAssignment({
                title: title,
                description: description,
                type: type,
                target_grade: targetGrade,
                settings: {
                    lockMode: lockMode,
                    questions: type === 'form' ? questions : []
                }
            });

            router.push("/teacher/assignments");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to publish assignment.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-8 flex justify-center font-sans">
            <div className="w-full max-w-4xl">
                <Link href="/teacher/assignments" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 font-bold">
                    <ArrowLeft size={20} /> Back to Assignments
                </Link>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <h1 className="text-3xl font-extrabold text-white mb-8">Create Assignment</h1>

                    {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 font-bold">{error}</div>}

                    <div className="space-y-6">
                        {/* Title & Description */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Assignment Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Alphabet Quiz"
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Target Class</label>
                                <select
                                    value={targetGrade}
                                    onChange={(e) => setTargetGrade(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500"
                                >
                                    <option value="Pre-K">Pre-K</option>
                                    <option value="KG1">KG1</option>
                                    <option value="KG2">KG2</option>
                                    <option value="lovely studets">Lovely Studets</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">Description (Optional)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Instructions for the students..."
                                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500"
                            />
                        </div>

                        {/* Type Selector */}
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">Assignment Type</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setType("form")} className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${type === 'form' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                    <CheckSquare size={24} />
                                    <span className="font-bold text-lg">Google Form (Quiz)</span>
                                </button>
                                <button onClick={() => setType("doc")} className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${type === 'doc' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                    <FileText size={24} />
                                    <span className="font-bold text-lg">Google Doc (Writing)</span>
                                </button>
                            </div>
                        </div>

                        {/* Lock Mode */}
                        <div className="flex items-center justify-between bg-slate-950 p-5 rounded-xl border border-slate-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/10 rounded-lg text-red-400"><Lock size={24} /></div>
                                <div>
                                    <p className="font-bold text-white text-lg">Lock Mode (Anti-Cheat)</p>
                                    <p className="text-sm text-slate-400">Logs a violation if the student switches tabs.</p>
                                </div>
                            </div>
                            <button onClick={() => setLockMode(!lockMode)} className={`w-16 h-9 rounded-full transition-all relative ${lockMode ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-7 h-7 rounded-full bg-white transition-all shadow-md ${lockMode ? 'left-8' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* 🚨 QUESTION BUILDER (Only if Type is Form) */}
                        {type === 'form' && (
                            <div className="border-t-2 border-slate-800 pt-8 mt-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-white">Form Questions</h2>
                                    <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold">{questions.length} Questions Added</span>
                                </div>

                                <div className="space-y-4 mb-6">
                                    {questions.length === 0 && (
                                        <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
                                            No questions yet. Click the buttons below to add questions!
                                        </div>
                                    )}

                                    {questions.map((q, i) => (
                                        <div key={q.id} className="bg-slate-950 border border-slate-700 p-5 rounded-xl relative">
                                            <button onClick={() => removeQuestion(i)} className="absolute top-3 right-3 text-red-400 hover:bg-red-500/20 p-2 rounded-lg">
                                                <Trash2 size={18} />
                                            </button>

                                            <div className="flex gap-4 mb-3 pr-10">
                                                <span className="bg-slate-800 text-slate-300 font-bold px-3 py-1 rounded-lg text-sm h-fit">Q{i + 1}</span>
                                                <input
                                                    type="text"
                                                    value={q.label}
                                                    onChange={(e) => updateQuestion(i, 'label', e.target.value)}
                                                    className="flex-1 bg-transparent border-b border-slate-700 text-white outline-none focus:border-emerald-500 text-lg font-bold pb-1"
                                                />
                                            </div>

                                            {/* Question Options */}
                                            {(q.type === 'multiple_choice' || q.type === 'checkboxes') && (
                                                <div className="space-y-2 mt-4 pl-4 border-l-2 border-slate-700">
                                                    {q.options?.map((opt: string, optIdx: number) => (
                                                        <div key={optIdx} className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={opt}
                                                                onChange={(e) => {
                                                                    const newOpts = [...q.options];
                                                                    newOpts[optIdx] = e.target.value;
                                                                    updateQuestion(i, 'options', newOpts);
                                                                }}
                                                                className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm outline-none"
                                                            />
                                                            <button onClick={() => {
                                                                const newOpts = q.options.filter((_: any, idx: number) => idx !== optIdx);
                                                                updateQuestion(i, 'options', newOpts);
                                                            }} className="text-red-400 p-2"><Trash2 size={14} /></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => updateQuestion(i, 'options', [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`])} className="text-emerald-400 text-sm font-bold mt-2 hover:underline">+ Add Option</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-3 bg-slate-950 p-4 rounded-xl border border-slate-700">
                                    <span className="text-sm font-bold text-slate-400 py-2">Add Question:</span>
                                    <button onClick={() => addQuestion('short_text')} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus size={16} /> Short Text</button>
                                    <button onClick={() => addQuestion('long_text')} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus size={16} /> Long Text</button>
                                    <button onClick={() => addQuestion('multiple_choice')} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus size={16} /> Multiple Choice</button>
                                    <button onClick={() => addQuestion('checkboxes')} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus size={16} /> Checkboxes</button>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handlePublish}
                            disabled={loading}
                            className="w-full mt-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-lg flex justify-center items-center gap-3 transition-all disabled:opacity-50 shadow-lg"
                        >
                            {loading ? <><Loader2 className="animate-spin" /> Publishing...</> : <><Save size={22} /> Publish Assignment</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}   