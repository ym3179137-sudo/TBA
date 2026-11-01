"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAssignment } from "@/app/actions/assignments";
import { CheckSquare, FileText, Lock, Loader2, ArrowLeft, Plus, Trash2, Save, CheckCircle2, CheckCircle, Sparkles } from "lucide-react";
import Link from "next/link";

export default function CreateAssignmentPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"doc" | "form">("form");
    const [targetGrade, setTargetGrade] = useState("KG1");
    const [lockMode, setLockMode] = useState(false);
    const [questions, setQuestions] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false); // 🚨 AI State
    const [error, setError] = useState<string | null>(null);

    // 🚨 AI MIX FUNCTION
    const handleAIGenerate = async () => {
        if (!title) return setError("Please enter a title so the AI knows what to generate.");
        setAiLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/ai/generate-quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lessonText: `${title} ${description}` })
            });
            const data = await res.json();
            if (data.questions) {
                setQuestions([...questions, ...data.questions]);
            }
        } catch (err) {
            setError("Failed to generate questions with AI.");
        } finally {
            setAiLoading(false);
        }
    };

    const addQuestion = (qType: string) => {
        const newQ = {
            id: `q_${Date.now()}`,
            type: qType,
            label: "New Question",
            options: (qType === 'multiple_choice') ? ["Option 1", "Option 2"] : undefined,
            correctAnswer: ""
        };
        setQuestions([...questions, newQ]);
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const updated = [...questions];
        updated[index][field] = value;
        setQuestions(updated);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handlePublish = async (status: 'draft' | 'published') => {
        if (!title.trim()) return setError("Title is required.");
        if (status === 'published' && type === 'form' && questions.length === 0) return setError("Add at least one question to publish.");

        setLoading(true);
        setError(null);

        try {
            await createAssignment({
                title: title,
                description: description,
                type: type,
                target_grade: targetGrade,
                status: status,
                settings: { lockMode: lockMode, questions: type === 'form' ? questions : [] }
            });
            router.push("/teacher/assignments");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to save assignment.");
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
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-extrabold text-white">Create Game/Assignment</h1>
                        <button onClick={handleAIGenerate} disabled={aiLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg disabled:opacity-50">
                            {aiLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} ✨ AI Mix Questions
                        </button>
                    </div>

                    {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 font-bold">{error}</div>}

                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Title (What is the topic?)</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., The Alphabet" className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Target Class</label>
                                <select value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500">
                                    <option value="Pre-K">Pre-K</option>
                                    <option value="KG1">KG1</option>
                                    <option value="KG2">KG2</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">Description / Paste Lesson Notes Here</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Paste your lesson text here for the AI to read..." className="w-full h-32 bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 resize-none" />
                        </div>

                        <div className="flex items-center justify-between bg-slate-950 p-5 rounded-xl border border-slate-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/10 rounded-lg text-red-400"><Lock size={24} /></div>
                                <div>
                                    <p className="font-bold text-white text-lg">Lock Mode (Anti-Cheat)</p>
                                </div>
                            </div>
                            <button onClick={() => setLockMode(!lockMode)} className={`w-16 h-9 rounded-full transition-all relative ${lockMode ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-7 h-7 rounded-full bg-white transition-all shadow-md ${lockMode ? 'left-8' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="border-t-2 border-slate-800 pt-8 mt-8">
                            <h2 className="text-2xl font-bold text-white mb-6">Game Questions ({questions.length})</h2>
                            <div className="space-y-4 mb-6">
                                {questions.length === 0 && <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-xl text-slate-500">No questions yet. Click "AI Mix Questions" or "Add Question".</div>}
                                {questions.map((q, i) => (
                                    <div key={q.id} className="bg-slate-950 border border-slate-700 p-5 rounded-xl relative">
                                        <button onClick={() => removeQuestion(i)} className="absolute top-3 right-3 text-red-400 hover:bg-red-500/20 p-2 rounded-lg"><Trash2 size={18} /></button>
                                        <div className="flex gap-4 mb-3 pr-10">
                                            <span className="bg-slate-800 text-slate-300 font-bold px-3 py-1 rounded-lg text-sm h-fit">Q{i + 1}</span>
                                            <input type="text" value={q.label} onChange={(e) => updateQuestion(i, 'label', e.target.value)} className="flex-1 bg-transparent border-b border-slate-700 text-white outline-none focus:border-emerald-500 text-lg font-bold pb-1" />
                                        </div>

                                        {q.type === 'multiple_choice' && (
                                            <div className="space-y-2 mt-4 pl-4 border-l-2 border-slate-700">
                                                {q.options?.map((opt: string, optIdx: number) => (
                                                    <div key={optIdx} className="flex items-center gap-3 bg-slate-900 p-2 rounded-lg">
                                                        <button onClick={() => updateQuestion(i, 'correctAnswer', opt)} className={`p-1 rounded-full ${q.correctAnswer === opt ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-600 hover:text-slate-400'}`}>
                                                            <CheckCircle2 size={20} />
                                                        </button>
                                                        <input type="text" value={opt} onChange={(e) => {
                                                            const newOpts = [...q.options];
                                                            newOpts[optIdx] = e.target.value;
                                                            updateQuestion(i, 'options', newOpts);
                                                            if (q.correctAnswer === opt) updateQuestion(i, 'correctAnswer', e.target.value);
                                                        }} className="flex-1 bg-transparent border-none text-slate-300 text-sm outline-none" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {q.type === 'short_text' && (
                                            <div className="mt-4 pl-4">
                                                <label className="text-xs font-bold text-emerald-400 mb-1 block">Expected Correct Answer</label>
                                                <input type="text" value={q.correctAnswer} onChange={(e) => updateQuestion(i, 'correctAnswer', e.target.value)} placeholder="Exact correct answer..." className="w-full bg-slate-900 border border-emerald-900/50 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-3 bg-slate-950 p-4 rounded-xl border border-slate-700 mb-8">
                                <button onClick={() => addQuestion('short_text')} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus size={16} /> Short Text</button>
                                <button onClick={() => addQuestion('multiple_choice')} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Plus size={16} /> Multiple Choice</button>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 pt-6 border-t border-slate-800">
                            <button onClick={() => handlePublish('draft')} disabled={loading || aiLoading} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl text-lg flex justify-center items-center gap-2">
                                <Save size={20} /> Save as Draft
                            </button>
                            <button onClick={() => handlePublish('published')} disabled={loading || aiLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-lg flex justify-center items-center gap-2">
                                {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20} /> Save & Publish</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}