"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClipboardList, User, Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function Gradebook() {
    const supabase = useMemo(() => createClient(), []);
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);

    useEffect(() => {
        async function fetchGradebook() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: assigns } = await supabase.from("assignments").select("*").eq("teacher_id", user.id).order("created_at", { ascending: true });
            setAssignments(assigns || []);

            const { data: studs } = await supabase.from("children").select("id, full_name, class_name").eq("teacher_id", user.id).eq("is_approved", true).order("full_name", { ascending: true });
            setStudents(studs || []);

            const { data: subs } = await supabase.from("submissions").select("*");
            setSubmissions(subs || []);

            setLoading(false);
        }
        fetchGradebook();
    }, [supabase]);

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin w-8 h-8" /></div>;

    return (
        <div className="min-h-screen bg-slate-950 p-8 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* 🚨 SMART BACK BUTTON */}
                <div className="mb-6">
                    <BackButton fallbackUrl="/teacher" label="Back to Dashboard" />
                </div>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                            <ClipboardList className="text-emerald-400" /> Master Gradebook
                        </h1>
                        <p className="text-slate-400 mt-2">Review all student grades across all assignments.</p>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 border-b border-slate-800">
                                    <th className="p-4 font-bold text-slate-400 sticky left-0 bg-slate-950 z-10 w-64 border-r border-slate-800">Student Name</th>
                                    <th className="p-4 font-bold text-slate-400 w-32">Class</th>
                                    {assignments.map((a) => (
                                        <th key={a.id} className="p-4 font-bold text-slate-400 min-w-[150px] border-l border-slate-800 text-center">
                                            {a.title}
                                        </th>
                                    ))}
                                    <th className="p-4 font-bold text-emerald-400 min-w-[120px] border-l border-slate-800 text-center bg-emerald-950/20">Average</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={assignments.length + 3} className="p-8 text-center text-slate-500">No students assigned to you yet.</td>
                                    </tr>
                                ) : (
                                    students.map((student) => {
                                        let totalScore = 0;
                                        let completedCount = 0;

                                        return (
                                            <tr key={student.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                <td className="p-4 font-bold text-white sticky left-0 bg-slate-900 z-10 border-r border-slate-800 flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400"><User size={16} /></div>
                                                    {student.full_name}
                                                </td>
                                                <td className="p-4 text-slate-400 text-sm">{student.class_name || "N/A"}</td>

                                                {assignments.map((assignment) => {
                                                    const sub = submissions.find(s => s.assignment_id === assignment.id && s.student_id === student.id);

                                                    if (sub && sub.score !== undefined && sub.score !== null) {
                                                        totalScore += sub.score;
                                                        completedCount++;
                                                    }

                                                    return (
                                                        <td key={assignment.id} className="p-4 text-center border-l border-slate-800">
                                                            {sub ? (
                                                                <span className={`px-3 py-1 rounded-full text-sm font-black ${sub.score >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                    {sub.score || 0}%
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-600 text-sm italic">Missing</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}

                                                <td className="p-4 text-center border-l border-slate-800 bg-emerald-950/10">
                                                    <span className="font-black text-lg text-emerald-400">
                                                        {completedCount > 0 ? Math.round(totalScore / completedCount) : 0}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}