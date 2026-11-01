"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, FileText, CheckCircle, AlertTriangle, User, Calendar } from "lucide-react";

export default function TeacherAssessments() {
    const supabase = useMemo(() => createClient(), []);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch assignments created by this teacher
            const { data: assignmentsData } = await supabase
                .from("assignments")
                .select("*")
                .eq("teacher_id", user.id)
                .order("created_at", { ascending: false });

            setAssignments(assignmentsData || []);
            if (assignmentsData && assignmentsData.length > 0) {
                setSelectedAssignment(assignmentsData[0]);
            }

            // 2. Fetch ALL submissions and manually join with children to avoid FK errors
            const { data: submissionsData } = await supabase
                .from("submissions")
                .select("*")
                .order("submitted_at", { ascending: false });

            if (submissionsData) {
                // Get unique student IDs from submissions
                const studentIds = [...new Set(submissionsData.map(s => s.student_id))];

                // Fetch profiles for these students
                const { data: childrenData } = await supabase
                    .from("children")
                    .select("id, full_name, class_name")
                    .in("id", studentIds.filter(id => !id.startsWith("guest-"))); // Don't query guests

                // Manually merge the data
                const enrichedSubmissions = submissionsData.map(sub => {
                    const student = childrenData?.find(c => c.id === sub.student_id);
                    return {
                        ...sub,
                        student_name: student?.full_name || "Guest Player",
                        student_class: student?.class_name || "N/A"
                    };
                });

                setSubmissions(enrichedSubmissions);
            }
            setLoading(false);
        }
        fetchData();
    }, [supabase]);

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin w-8 h-8" /></div>;
    }

    const filteredSubmissions = selectedAssignment
        ? submissions.filter(s => s.assignment_id === selectedAssignment.id)
        : [];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                            <FileText className="text-emerald-400" /> Assessments & Submissions
                        </h1>
                        <p className="text-slate-400 mt-2">Review student work and integrity scores.</p>
                    </div>
                    <Link href="/teacher/assignments/create" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2">
                        + Create New
                    </Link>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* LEFT: List of Assignments */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4">Your Assignments</h2>
                        {assignments.map((assignment) => {
                            const subCount = submissions.filter(s => s.assignment_id === assignment.id).length;
                            return (
                                <button
                                    key={assignment.id}
                                    onClick={() => setSelectedAssignment(assignment)}
                                    className={`w-full text-left p-5 rounded-2xl border transition-all ${selectedAssignment?.id === assignment.id ? 'bg-slate-800 border-emerald-500' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
                                >
                                    <h3 className="font-bold text-white text-lg">{assignment.title}</h3>
                                    <div className="flex items-center gap-3 mt-3 text-xs font-bold text-slate-400">
                                        <span className="bg-slate-950 px-2 py-1 rounded-md">{subCount} Submissions</span>
                                        {assignment.settings?.lockMode && (
                                            <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> Locked</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* RIGHT: Submissions */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[500px]">
                            <h2 className="text-xl font-bold text-white mb-6">
                                Submissions for: <span className="text-emerald-400">{selectedAssignment?.title || "Select an Assignment"}</span>
                            </h2>

                            {filteredSubmissions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                    <FileText className="w-12 h-12 mb-3 opacity-50" />
                                    <p>No students have submitted this yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredSubmissions.map((sub) => (
                                        <div key={sub.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white">{sub.student_name}</h3>
                                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                                            <Calendar size={12} /> {new Date(sub.submitted_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.integrity_score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        Integrity: {sub.integrity_score}%
                                                    </span>
                                                    {sub.violations && sub.violations.length > 0 && (
                                                        <div className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-950/30 px-2 py-1 rounded-md">
                                                            <AlertTriangle size={12} /> {sub.violations.length} Violations
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Render Answers */}
                                            <div className="space-y-3 mt-4 border-t border-slate-800 pt-4">
                                                {selectedAssignment?.settings?.questions?.map((q: any, idx: number) => {
                                                    const answer = sub.content?.[q.id];
                                                    return (
                                                        <div key={q.id} className="bg-slate-900 p-3 rounded-lg">
                                                            <p className="text-sm font-bold text-slate-300 mb-1">Q{idx + 1}: {q.label}</p>
                                                            <p className="text-white font-medium pl-4 border-l-2 border-emerald-500">
                                                                {Array.isArray(answer) ? answer.join(", ") : answer || <span className="text-slate-500 italic">No answer</span>}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}