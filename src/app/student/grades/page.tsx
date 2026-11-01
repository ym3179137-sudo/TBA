"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, ClipboardList, CheckCircle, AlertTriangle, Loader2, MessageSquare } from "lucide-react";

export default function StudentGrades() {
    const [grades, setGrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchGrades() {
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
                return "";
            };
            const studentId = getCookie("student_id");

            if (!studentId) return;

            // Fetch submissions with assignment titles
            const { data, error } = await supabase
                .from("submissions")
                .select(`
                    id,
                    score,
                    integrity_score,
                    teacher_feedback,
                    submitted_at,
                    assignments (title, subject)
                `)
                .eq("student_id", studentId)
                .order("submitted_at", { ascending: false });

            if (data) setGrades(data);
            setLoading(false);
        }
        fetchGrades();
    }, [supabase]);

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin w-10 h-10" /></div>;

    return (
        <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center font-sans">
            <div className="w-full max-w-4xl">
                <Link href="/student" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 font-bold transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-amber-500/20 rounded-2xl text-amber-400">
                        <ClipboardList size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold text-white">My Grades</h1>
                        <p className="text-slate-400">See your scores and teacher feedback.</p>
                    </div>
                </div>

                {grades.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-700 p-12 rounded-3xl text-center">
                        <ClipboardList className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">No Grades Yet</h2>
                        <p className="text-slate-400">Complete assignments to see your grades here!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {grades.map((grade) => {
                            const isPassing = grade.score >= 70;
                            return (
                                <div key={grade.id} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 pb-4 border-b border-slate-800 gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{grade.assignments?.title || "Unknown Assignment"}</h3>
                                            <p className="text-sm text-slate-400">{new Date(grade.submitted_at).toLocaleDateString()}</p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className={`px-4 py-2 rounded-xl text-lg font-black ${isPassing ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                Score: {grade.score || 0}%
                                            </span>

                                            <span className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1 ${grade.integrity_score >= 80 ? 'bg-slate-800 text-slate-300' : 'bg-red-500/20 text-red-400'}`}>
                                                {grade.integrity_score >= 80 ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                                Integrity: {grade.integrity_score}%
                                            </span>
                                        </div>
                                    </div>

                                    {grade.teacher_feedback ? (
                                        <div className="bg-slate-950 p-4 rounded-xl border-l-4 border-pink-500">
                                            <p className="text-sm font-bold text-pink-400 mb-1 flex items-center gap-2">
                                                <MessageSquare size={14} /> Teacher Feedback
                                            </p>
                                            <p className="text-slate-300 italic">"{grade.teacher_feedback}"</p>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-950 p-4 rounded-xl text-center text-slate-500 text-sm italic">
                                            No feedback written yet.
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}