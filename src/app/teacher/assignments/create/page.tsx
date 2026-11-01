"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAssignment } from "@/app/actions/assignments";
import { CheckSquare, FileText, Lock, Loader2, ArrowLeft, Plus, Trash2, Save, CheckCircle2, CheckCircle } from "lucide-react";
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
    const [error, setError] = useState<string | null>(null);

    // Add a new question
    const addQuestion = (qType: string) => {
        const newQ = {
            id: `q_${Date.now()}`,
            type: qType,
            label: "",
            options: (qType === 'multiple_choice') ? ["Option 1", "Option 2", "Option 3", "Option 4"] : undefined,
            correctAnswer: ""
        };
        setQuestions([...questions, newQ]);
    };

    // Update a question field
    const updateQuestion = (index: number, field: string, value: any) => {
        const updated = [...questions];
        updated[index][field] = value;
        setQuestions(updated);
    };

    // Update a specific option for multiple choice
    const updateOption = (qIndex: number, optIndex: number, value: string) => {
        const updated = [...questions];
        updated[qIndex].options[optIndex] = value;

        // If the teacher was editing the correct answer, update that too
        if (updated[qIndex].correctAnswer === questions[qIndex].options[optIndex]) {
            updated[qIndex].correctAnswer = value;
        }
        setQuestions(updated);
    };

    // Delete a question
    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handlePublish = async (status: 'draft' | 'published') => {
        if (!title.trim()) return setError("Title is required.");

        if (status === 'published' && type === 'form') {
            if (questions.length === 0) return setError("Add at least one question to publish.");
            if (questions.some(q => !q.correctAnswer)) return setError("Please select or type a correct answer for every question.");
            if (questions.some(q => !q.label.trim())) return setError("Please fill in the text for every question.");
        }

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
                        <h1 className="text-3xl font-extrabold text-white">Create Quiz / Assignment</h1>
                    </div>

                    {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 font-bold">{error}</div>}

                    <div className="space-y-6">
                        {/* Title & Target Grade */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Quiz Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., The Alphabet Lesson"
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

                        {/* Description */}
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

                        {/* Type & Lock Mode */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <button onClick={() => setType("form")} className={`w-full p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${type === 'form' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                    <CheckSquare size={24} /> <span className="font-bold text-lg">Interactive Quiz</span>
                                </button>
                                <button onClick={() => setType("doc")} className={`w-full p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${type === 'doc' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                    <FileText size={24} /> <span className="font-bold text-lg">Writing Task (Doc)</span>
                                </button>
                            </div>

                            <div className="flex items-center justify-between bg-slate-950 p-5 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-500/10 rounded-lg text-red-400"><Lock size={24} /></div>
                                    <div>
                                        <p className="font-bold text-white text-lg">Lock Mode</p>
                                        <p className="text-xs text-slate-400">Anti-Cheat (3 strikes)</p>
                                    </div>
                                </div>
                                <button onClick={() => setLockMode(!lockMode)} className={`w-16 h-9 rounded-full transition-all relative ${lockMode ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                    <div className={`absolute top-1 w-7 h-7 rounded-full bg-white transition-all shadow-md ${lockMode ? 'left-8' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        {/* QUESTION BUILDER */}
                        {type === 'form' && (
                            <div className="border-t-2 border-slate-800 pt-8 mt-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Questions</h2>

                                <div className="space-y-6 mb-6">
                                    {questions.length === 0 && (
                                        <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
                                            No questions yet. Click the buttons below to add your first question!
                                        </div>
                                    )}

                                    {questions.map((q, i) => (
                                        <div key={q.id} className="bg-slate-950 border border-slate-700 p-6 rounded-xl relative shadow-lg">

                                            {/* Delete Button */}
                                            <button onClick={() => removeQuestion(i)} className="absolute top-4 right-4 text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>

                                            {/* Question Input */}
                                            <div className="flex gap-4 mb-5 pr-10">
                                                <span className="bg-slate-800 text-slate-300 font-bold px-3 py-1 rounded-lg text-sm h-fit">Q{i + 1}</span>
                                                <input
                                                    type="text"
                                                    value={q.label}
                                                    onChange={(e) => updateQuestion(i, 'label', e.target.value)}
                                                    placeholder="Type your question here..."
                                                    className="flex-1 bg-transparent border-b-2 border-slate-700 text-white outline-none focus:border-emerald-500 text-lg font-bold pb-2"
                                                />
                                            </div>

                                            {/* MULTIPLE CHOICE */}
                                            {q.type === 'multiple_choice' && (
                                                <div className="space-y-2 mt-4 pl-4 border-l-2 border-emerald-900/50">
                                                    {q.options?.map((opt: string, optIdx: number) => (
                                                        <div key={optIdx} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${q.correctAnswer === opt ? 'bg-emerald-500/10' : 'bg-slate-900'}`}>

                                                            {/* Correct Answer Checkbox */}
                                                            <button
                                                                onClick={() => updateQuestion(i, 'correctAnswer', opt)}
                                                                className={`p-1 rounded-full transition-all ${q.correctAnswer === opt ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-600 hover:text-slate-400'}`}
                                                                title="Mark as correct answer"
                                                            >
                                                                <CheckCircle2 size={20} />
                                                            </button>

                                                            <input
                                                                type="text"
                                                                value={opt}
                                                                onChange={(e) => updateOption(i, optIdx, e.target.value)}
                                                                className="flex-1 bg-transparent border-none text-slate-300 text-sm outline-none"
                                                            />

                                                            {/* Delete Option (Optional, but good for teachers) */}
                                                            {q.options.length > 2 && (
                                                                <button onClick={() => {
                                                                    const newOpts = q.options.filter((_: any, idx: number) => idx !== optIdx);
                                                                    updateQuestion(i, 'options', newOpts);
                                                                }} className="text-slate-600 hover:text-red-400 p-1">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Add Option Button */}
                                                    <button onClick={() => updateQuestion(i, 'options', [...q.options, `Option ${q.options.length + 1}`])} className="text-emerald-400 text-sm font-bold mt-2 hover:underline flex items-center gap-1">
                                                        <Plus size={14} /> Add Option
                                                    </button>
                                                </div>
                                            )}

                                            {/* SHORT TEXT */}
                                            {q.type === 'short_text' && (
                                                <div className="mt-4 pl-4 bg-slate-900 p-4 rounded-xl">
                                                    <label className="text-xs font-bold text-emerald-400 mb-2 block uppercase tracking-wider">Expected Correct Answer</label>
                                                    <input
                                                        type="text"
                                                        value={q.correctAnswer}
                                                        onChange={(e) => updateQuestion(i, 'correctAnswer', e.target.value)}
                                                        placeholder="Type the exact answer the student must type to get it right..."
                                                        className="w-full bg-slate-950 border border-emerald-900/50 text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Add Question Buttons */}
                                <div className="flex flex-wrap gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <span className="text-sm font-bold text-slate-500 py-2 mr-2">Add:</span>
                                    <button onClick={() => addQuestion('multiple_choice')} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
                                        <Plus size={16} /> Multiple Choice
                                    </button>
                                    <button onClick={() => addQuestion('short_text')} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
                                        <Plus size={16} /> Short Text
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ACTION BUTTONS */}
                        <div className="flex flex-col md:flex-row gap-4 mt-8 pt-6 border-t border-slate-800">
                            <button
                                onClick={() => handlePublish('draft')}
                                disabled={loading}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl text-lg flex justify-center items-center gap-2 transition-colors"
                            >
                                <Save size={20} /> Save as Draft
                            </button>
                            <button
                                onClick={() => handlePublish('published')}
                                disabled={loading}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-lg flex justify-center items-center gap-2 transition-colors shadow-lg"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20} /> Save & Publish</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}