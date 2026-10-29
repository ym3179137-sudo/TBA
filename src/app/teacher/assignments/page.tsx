"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createAssignment } from "@/app/actions/assignments";
import {
    ArrowLeft, Save, Lock, Unlock, Plus, Trash2,
    FileText, ClipboardList, Loader2, AlertTriangle
} from "lucide-react";

export default function TeacherAssignmentsPage() {
    const router = useRouter();

    // Assignment State
    const [title, setTitle] = useState("");
    const [type, setType] = useState<"doc" | "form">("form");
    const [targetGrade, setTargetGrade] = useState("KG1");
    const [lockMode, setLockMode] = useState(false);

    // Form Builder State
    const [questions, setQuestions] = useState<any[]>([
        { id: "q1", type: "short_text", label: "Question 1", required: true }
    ]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Form Builder Helpers
    const addQuestion = (qType: string) => {
        setQuestions([...questions, {
            id: `q${Date.now()}`,
            type: qType,
            label: `New ${qType.replace('_', ' ')} question`,
            options: qType === 'multiple_choice' || qType === 'checkboxes' ? ["Option 1", "Option 2"] : undefined
        }]);
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const newQ = [...questions];
        newQ[index][field] = value;
        setQuestions(newQ);
    };

    const handleCreate = async () => {
        if (!title.trim()) return setError("Please enter an assignment title.");

        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            // 🚨 Call the Server Action (from Step 6)
            await createAssignment({
                title,
                type,
                target_grade: targetGrade,
                settings: {
                    lockMode,
                    questions: type === 'form' ? questions : []
                }
            });

            setSuccess(true);
            setTimeout(() => router.push("/teacher"), 2000); // Go back to hub after 2s

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/teacher" className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white">Create Assignment</h1>
                        <p className="text-slate-400 text-sm">Build a Google Doc or Google Form style assignment.</p>
                    </div>
                </div>

                {/* Errors & Success */}
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

                    {/* Title & Type */}
                    <div className="grid md:grid-cols-2 gap-6">
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
                            <label className="block text-sm font-bold text-slate-400 mb-2">Target Grade</label>
                            <select
                                value={targetGrade}
                                onChange={e => setTargetGrade(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                            >
                                <option value="Pre-K">Pre-K</option>
                                <option value="KG1">KG1</option>
                                <option value="KG2">KG2</option>
                                <option value="Grade 1">Grade 1</option>
                            </select>
                        </div>
                    </div>

                    {/* Assignment Type Toggle */}
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

                    {/* Lock Mode Toggle */}
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

                    {/* Form Builder (Only shows if 'form' is selected) */}
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
                                            {q.options.map((opt: string, optIdx: number) => (
                                                <div key={optIdx} className="flex items-center gap-2">
                                                    <div className={`w-4 h-4 rounded-full border border-slate-600 ${q.type === 'multiple_choice' ? 'rounded-full' : 'rounded-sm'}`}></div>
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOpts = [...q.options];
                                                            newOpts[optIdx] = e.target.value;
                                                            updateQuestion(i, 'options', newOpts);
                                                        }}
                                                        className="flex-1 bg-slate-900 border border-slate-700 text-sm text-white p-2 rounded-lg outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => updateQuestion(i, 'options', [...q.options, `Option ${q.options.length + 1}`])}
                                                className="text-xs text-emerald-400 font-bold mt-2 hover:text-emerald-300"
                                            >
                                                + Add Option
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add Question Buttons */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                <button onClick={() => addQuestion('short_text')} className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"><Plus size={16} /> Short Text</button>
                                <button onClick={() => addQuestion('long_text')} className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"><Plus size={16} /> Long Text</button>
                                <button onClick={() => addQuestion('multiple_choice')} className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"><Plus size={16} /> Multiple Choice</button>
                                <button onClick={() => addQuestion('checkboxes')} className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"><Plus size={16} /> Checkboxes</button>
                            </div>
                        </div>
                    )}

                    {/* Doc Description (Only shows if 'doc' is selected) */}
                    {type === "doc" && (
                        <div className="pt-6 border-t border-slate-800 text-center py-10">
                            <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4 opacity-50" />
                            <h3 className="text-xl font-bold text-white mb-2">Google Doc Mode</h3>
                            <p className="text-slate-400 max-w-md mx-auto">
                                Students will get a blank, distraction-free text editor to write their essay or short answers.
                                {lockMode ? " Paste tracking and tab-switching alerts are ACTIVE." : " Lock mode is off."}
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleCreate}
                        disabled={loading}
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