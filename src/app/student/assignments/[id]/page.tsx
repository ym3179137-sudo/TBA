"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { submitAssignment } from "@/app/actions/submissions";
import { ArrowLeft, CheckCircle, Loader2, Save } from "lucide-react";
import Link from "next/link";

export default function TakeAssignment() {
    const params = useParams();
    const router = useRouter();
    const assignmentId = params?.id as string;
    const supabase = createClient();

    const [assignment, setAssignment] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [violations, setViolations] = useState<string[]>([]);

    useEffect(() => {
        async function fetchAssignment() {
            const { data } = await supabase.from("assignments").select("*").eq("id", assignmentId).maybeSingle();
            if (data) setAssignment(data);
            setLoading(false);
        }
        fetchAssignment();
    }, [assignmentId, supabase]);

    // Anti-cheat: Track tab switching if lock mode is enabled
    useEffect(() => {
        if (!assignment?.settings?.lockMode) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setViolations(prev => [...prev, "Tab switched or minimized during quiz"]);
                alert("⚠️ Warning: Do not leave the tab! This violation has been logged.");
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [assignment]);

    const handleSubmit = async () => {
        setSubmitting(true);
        const studentId = localStorage.getItem("tba_student_id") || "";

        try {
            await submitAssignment({
                assignmentId: assignment.id,
                assignmentTitle: assignment.title,
                studentId: studentId,
                content: answers,
                violations: violations
            });
            setCompleted(true);
        } catch (err: any) {
            alert("Failed to submit: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
    if (!assignment) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Assignment not found.</div>;

    if (completed) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
                <div className="bg-slate-900 border-2 border-emerald-500 p-12 rounded-3xl text-center shadow-[0_0_100px_rgba(16,185,129,0.2)]">
                    <CheckCircle className="w-24 h-24 text-emerald-400 mx-auto mb-6" />
                    <h1 className="text-3xl font-black text-white mb-2">Assignment Submitted!</h1>
                    <p className="text-slate-400 mb-8">Your teacher will review your work soon.</p>
                    <Link href="/student/assignments" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl transition-all">
                        Back to Assignments
                    </Link>
                </div>
            </div>
        );
    }

    const questions = assignment.settings?.questions || [];

    return (
        <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center">
            <div className="w-full max-w-3xl">
                <Link href="/student/assignments" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 font-bold">
                    <ArrowLeft size={20} /> Back to Assignments
                </Link>

                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl">
                    <h1 className="text-3xl font-extrabold text-white mb-2">{assignment.title}</h1>
                    <p className="text-slate-400 mb-8">{assignment.description}</p>

                    {questions.length === 0 ? (
                        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                            This assignment has no questions.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {questions.map((q: any, index: number) => (
                                <div key={q.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                                    <h3 className="text-lg font-bold text-white mb-4">{index + 1}. {q.label}</h3>

                                    {q.type === "short_text" && (
                                        <input
                                            type="text"
                                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-pink-500"
                                            placeholder="Your answer..."
                                            value={answers[q.id] || ""}
                                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                        />
                                    )}

                                    {q.type === "long_text" && (
                                        <textarea
                                            className="w-full h-32 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-pink-500 resize-none"
                                            placeholder="Your answer..."
                                            value={answers[q.id] || ""}
                                            onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                        />
                                    )}

                                    {q.type === "multiple_choice" && (
                                        <div className="space-y-2">
                                            {q.options?.map((opt: string) => (
                                                <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${answers[q.id] === opt ? 'border-pink-500 bg-pink-500/10' : 'border-slate-800 hover:border-slate-600'}`}>
                                                    <input
                                                        type="radio"
                                                        name={q.id}
                                                        value={opt}
                                                        checked={answers[q.id] === opt}
                                                        onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                                                        className="w-4 h-4 text-pink-500 bg-slate-900 border-slate-700"
                                                    />
                                                    <span className="text-white font-medium">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={submitting || questions.length === 0}
                        className="w-full mt-8 bg-pink-600 hover:bg-pink-500 text-white font-black py-4 rounded-xl text-lg flex justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        {submitting ? <><Loader2 className="animate-spin" /> Submitting...</> : <><Save size={20} /> Submit Assignment</>}
                    </button>
                </div>
            </div>
        </div>
    );
}