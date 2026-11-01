"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, FileText, CheckCircle, Clock, Lock, Loader2 } from "lucide-react";

export default function StudentAssignments() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchAssignments() {
            const studentId = localStorage.getItem("tba_student_id") || "";
            // Get class name from cookie or fallback
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
                return "";
            };
            const className = getCookie("student_class") || "KG1"; // Use cookie or default

            // Fetch assignments assigned to this grade or student
            const { data: allAssignments } = await supabase.from("assignments").select("*").order("created_at", { ascending: false });

            // Fetch submissions so we know what is already done
            const { data: mySubmissions } = await supabase.from("submissions").select("assignment_id").eq("student_id", studentId);
            const completedIds = mySubmissions?.map(s => s.assignment_id) || [];

            const filtered = allAssignments?.filter(a =>
                a.target_grade === className || a.target_student_id === studentId
            ).map(a => ({
                ...a,
                isCompleted: completedIds.includes(a.id)
            })) || [];

            setAssignments(filtered);
            setLoading(false);
        }
        fetchAssignments();
    }, [supabase]);

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl">
                <Link href="/student" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 font-bold">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>
                <h1 className="text-4xl font-extrabold text-white mb-8">My Assignments</h1>

                {assignments.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-700 p-12 rounded-3xl text-center">
                        <FileText className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">All caught up!</h2>
                        <p className="text-slate-400">You have no pending quizzes or assignments right now.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {assignments.map((assignment) => (
                            <div key={assignment.id} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{assignment.title}</h3>
                                    <p className="text-sm text-slate-400">{assignment.description || "No description"}</p>
                                    <div className="flex gap-4 mt-3 text-xs font-bold text-slate-500">
                                        <span className="flex items-center gap-1"><Clock size={14} /> {new Date(assignment.created_at).toLocaleDateString()}</span>
                                        {assignment.settings?.lockMode && <span className="flex items-center gap-1 text-red-400"><Lock size={14} /> Lock Mode</span>}
                                    </div>
                                </div>
                                <div>
                                    {assignment.isCompleted ? (
                                        <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-6 py-3 rounded-xl">
                                            <CheckCircle size={20} /> Completed
                                        </div>
                                    ) : (
                                        <Link href={`/student/assignments/${assignment.id}`} className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg">
                                            Start
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}