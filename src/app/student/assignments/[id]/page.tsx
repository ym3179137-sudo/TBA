"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { submitAssignment } from "@/app/actions/submissions";
import { CheckCircle, Loader2, Save, LogOut, AlertTriangle } from "lucide-react";
import Link from "next/link";
import BackButton from "@/components/BackButton"; // 🚨 Import the smart back button

export default function TakeAssignment() {
    const params = useParams();
    const router = useRouter();
    const assignmentId = params?.id as string;
    const supabase = createClient();

    const [assignment, setAssignment] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [violations, setViolations] = useState<string[]>([]);
    const [showViolationWarning, setShowViolationWarning] = useState(false);

    useEffect(() => {
        async function fetchAssignment() {
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
                return "";
            };
            const studentId = getCookie("student_id") || "";

            // 🚨 FORCE LOGIN: Kick guests out
            if (!studentId || studentId.startsWith("guest-")) {
                router.push("/student-login");
                return;
            }

            const { data } = await supabase.from("assignments").select("*").eq("id", assignmentId).maybeSingle();
            if (data) setAssignment(data);
            setLoading(false);
        }
        fetchAssignment();
    }, [assignmentId, supabase, router]);

    // 🚨 ANTI-CHEAT: Kicks them out if Lock Mode is on
    useEffect(() => {
        if (!assignment?.settings?.lockMode) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                const newViolations = [...violations, "Tab switched during quiz"];
                setViolations(newViolations);
                setShowViolationWarning(true);

                if (newViolations.length >= 3) {
                    alert("❌ QUIZ FAILED: You left the tab 3 times. Submitting your current answers now.");
                    handleSubmit(true);
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [assignment, violations]);

    const handleSubmit = async (forceQuit = false) => {
        setSubmitting(true);

        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return "";
        };
        const studentId = getCookie("student_id") || "";

        try {
            await submitAssignment({
                assignmentId: assignment.id,
                assignmentTitle: assignment.title,
                studentId: studentId,
                content: answers,
                violations: forceQuit ? [...violations, "FORCED QUIT: Failed Anti-Cheat"] : violations
            });
            setCompleted(true);
        } catch (err: any) {
            alert("❌ Submission Rejected: " + err.message);
            if (err.message.includes("logged in")) {
                router.push("/student-login");
            }
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin w-8 h-8" /></div>;
    if (!assignment) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Assignment not found.</div>;

    if (completed) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
                <div className="bg-slate-900 border-2 border-emerald-500 p-12 rounded-3xl text-center shadow-[0_0_100px_rgba(16,185,129,0.2)]">
                    <CheckCircle className="w-24 h-24 text-emerald-400 mx-auto mb-6 animate-bounce" />
                    <h1 className="text-3xl font-black text-white mb-2">Assignment Submitted!</h1>
                    <p className="text-slate-400 mb-8">Your teacher will review your work soon.</p>
                    <Link href="/student/assignments" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg">
                        Back to Assignments
                    </Link>
                </div>
            </div>
        );
    }

    const questions = assignment.settings?.questions || [];

    return (
        <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center">
            {showViolationWarning && !completed && (
                <div className="fixed inset-0 z-50 bg-red-950/90 flex items-center justify-center backdrop-blur-md p-4">
                    <div className="bg-black border-2 border-red-500 p-8 rounded-3xl max-w-md text-center">
                        <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-4 animate-pulse" />
                        <h2 className="text-3xl font-black text-red-500 mb-2">WARNING</h2>
                        <p className="text-red-200 mb-6">You left the tab! This violation has been logged and sent to the principal. If you do this 3 times, your quiz will automatically fail.</p>
                        <button onClick={() => setShowViolationWarning(false)} className="bg-red-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-red-500 w-full">Return to Quiz</button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-3xl">
                <div className="flex justify-between items-center mb-6">
                    {/* 🚨 SMART BACK BUTTON */}
                    <BackButton fallbackUrl="/student/assignments" label="Back" />

                    <button onClick={() => {
                        if (confirm("Are you sure you want to quit? Your progress will be lost.")) router.push("/student/assignments");
                    }} className="text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all">
                        <LogOut size={18} /> Quit Quiz
                    </button>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl">
                    <h1 className="text-3xl font-extrabold text-white mb-2">{assignment.title}</h1>
                    <p className="text-slate-400 mb-8">{assignment.description}</p>

                    <div className="space-y-6">
                        {questions.map((q: any, index: number) => (
                            <div key={q.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                                <h3 className="text-lg font-bold text-white mb-4">{index + 1}. {q.label}</h3>

                                {(q.type === "short_text" || q.type === "long_text") && (
                                    <input
                                        type="text"
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-pink-500 transition-colors"
                                        placeholder="Your answer..."
                                        value={answers[q.id] || ""}
                                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                    />
                                )}

                                {q.type === "multiple_choice" && (
                                    <div className="space-y-3">
                                        {q.options?.map((opt: string) => (
                                            <label key={opt} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[q.id] === opt ? 'border-pink-500 bg-pink-500/10' : 'border-slate-800 hover:border-slate-600'}`}>
                                                <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswers({ ...answers, [q.id]: opt })} className="w-5 h-5 text-pink-500 bg-slate-900 border-slate-700 focus:ring-pink-500" />
                                                <span className="text-white font-medium">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button onClick={() => handleSubmit()} disabled={submitting || questions.length === 0} className="w-full mt-8 bg-pink-600 hover:bg-pink-500 text-white font-black py-4 rounded-xl text-lg flex justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                        {submitting ? <><Loader2 className="animate-spin" /> Submitting...</> : <><Save size={20} /> Submit Assignment</>}
                    </button>
                </div>
            </div>
        </div>
    );
}