"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAssignment } from "@/app/actions/assignments";
import { CheckSquare, FileText, Lock, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TeacherAssignments() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"doc" | "form">("form");
    const [targetGrade, setTargetGrade] = useState("KG1");
    const [lockMode, setLockMode] = useState(false);
    const [questions, setQuestions] = useState<any[]>([{ id: "q1", type: "short_text", label: "1 + 1" }]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handlePublish = async () => {
        if (!title.trim()) return setError("Title is required.");
        setLoading(true);
        setError(null);
        setSuccess(false);

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

            setSuccess(true);
            setTimeout(() => {
                router.push("/teacher");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to publish assignment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-8 flex justify-center">
            <div className="w-full max-w-3xl">
                <Link href="/teacher" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 font-bold">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <h1 className="text-3xl font-extrabold text-white mb-8">Create Assignment</h1>

                    {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6">{error}</div>}
                    {success && <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl mb-6">✅ Assignment Published Successfully!</div>}

                    <div className="space-y-6">
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

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setType("form")} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${type === 'form' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-500'}`}>
                                <FileText className={type === 'form' ? 'text-emerald-400' : 'text-slate-400'} />
                                <span className="font-bold text-white">Google Form (Quiz)</span>
                            </button>
                            <button onClick={() => setType("doc")} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${type === 'doc' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-500'}`}>
                                <FileText className={type === 'doc' ? 'text-emerald-400' : 'text-slate-400'} />
                                <span className="font-bold text-white">Google Doc (Writing)</span>
                            </button>
                        </div>

                        <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-700">
                            <div className="flex items-center gap-3">
                                <Lock className="text-red-400" />
                                <div>
                                    <p className="font-bold text-white">Lock Mode (Anti-Cheat)</p>
                                    <p className="text-xs text-slate-400">Logs a violation if the student switches tabs.</p>
                                </div>
                            </div>
                            <button onClick={() => setLockMode(!lockMode)} className={`w-14 h-8 rounded-full transition-all relative ${lockMode ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${lockMode ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <button
                            onClick={handlePublish}
                            disabled={loading || success}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-lg flex justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {loading ? <><Loader2 className="animate-spin" /> Publishing...</> : "Publish Assignment"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}