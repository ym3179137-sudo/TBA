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
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
                return "";
            };
            const studentId = getCookie("student_id") || localStorage.getItem("tba_student_id") || "";

            // 1. Get the student's real class from the database (if they are a real student)
            let studentClass = "KG1";
            if (studentId && !studentId.startsWith("guest-")) {
                const { data: child } = await supabase.from("children").select("class_name").eq("id", studentId).maybeSingle();
                if (child?.class_name) studentClass = child.class_name;
            }

            // 2. Fetch assignments
            const { data: allAssignments } = await supabase.from("assignments").select("*").order("created_at", { ascending: false });

            // 3. Safely fetch submissions ONLY if the ID is a valid UUID (prevents 400 error)
            let completedIds: string[] = [];
            if (studentId && studentId.length > 20) { // Simple check if it's a real UUID
                const { data: mySubmissions } = await supabase.from("submissions").select("assignment_id").eq("student_id", studentId);
                if (mySubmissions) completedIds = mySubmissions.map(s => s.assignment_id);
            }

            // 4. Filter assignments
            const filtered = allAssignments?.filter(a => {
                // If guest, show everything so you can test it!
                if (studentId.startsWith("guest-")) return true;

                // Otherwise, show only their grade or directly assigned to them
                return a.target_grade === studentClass || a.target_student_id === studentId;
            }).map(a => ({
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