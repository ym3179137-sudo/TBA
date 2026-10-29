"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    ArrowLeft, FileText, ClipboardList, Lock, Unlock,
    AlertTriangle, CheckCircle, ChevronRight, X, User
} from "lucide-react";

export default function TeacherAssessmentsPage() {
    const router = useRouter();
    const supabase = createClient();

    const [assignments, setAssignments] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/sign-in");

        // 1. Fetch Teacher's Assignments
        const { data: assignData } = await supabase
            .from("assignments")
            .select("*")
            .eq("teacher_id", user.id)
            .order("created_at", { ascending: false });

        if (assignData) setAssignments(assignData);

        // 2. Fetch ALL submissions for these assignments (with student names)
        if (assignData && assignData.length > 0) {
            const assignIds = assignData.map(a => a.id);
            const { data: subData } = await supabase
                .from("submissions")
                .select(`
                    *,
                    children (full_name, class_name)
                `)
                .in("assignment_id", assignIds)
                .order("submitted_at", { ascending: false });

            if (subData) setSubmissions(subData);
        }

        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/teacher" className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl transition-all">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-extrabold text-white">Assessments & Submissions</h1>
                            <p className="text-slate-400 text-sm">Review student work and integrity scores.</p>
                        </div>
                    </div>
                    <Link href="/teacher/assignments" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all">
                        + Create New
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading assessments...</div>
                ) : assignments.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800">
                        <ClipboardList className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-500">No assignments yet</h2>
                        <p className="text-slate-600 mt-2 mb-6">Create your first Google Form or Doc assignment.</p>
                        <Link href="/teacher/assignments" className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold">Create Assignment</Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8 flex-1">

                        {/* LEFT SIDE: Assignment List */}
                        <div className="w-full lg:w-1/3 space-y-4">
                            <h2 className="text-xl font-bold text-white mb-4">Your Assignments</h2>
                            {assignments.map(assign => {
                                const subCount = submissions.filter(s => s.assignment_id === assign.id).length;
                                const isSelected = selectedAssignment?.id === assign.id;

                                return (
                                    <div
                                        key={assign.id}
                                        onClick={() => { setSelectedAssignment(assign); setSelectedSubmission(null); }}
                                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${isSelected
                                                ? 'bg-slate-800 border-emerald-500 shadow-lg'
                                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-white text-lg">{assign.title}</h3>
                                            {assign.type === 'form' ? <ClipboardList className="text-blue-400" size={20} /> : <FileText className="text-amber-400" size={20} />}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                                            <span className="bg-slate-950 px-2 py-1 rounded-md">Grade: {assign.target_grade}</span>
                                            <span className="bg-slate-950 px-2 py-1 rounded-md">{subCount} Submissions</span>
                                            {assign.settings?.lockMode ? (
                                                <span className="text-red-400 flex items-center gap-1"><Lock size={12} /> Locked</span>
                                            ) : (
                                                <span className="text-slate-500 flex items-center gap-1"><Unlock size={12} /> Open</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* RIGHT SIDE: Submissions for selected assignment */}
                        <div className="w-full lg:w-2/3">
                            {!selectedAssignment ? (
                                <div className="h-full flex flex-col items-center justify-center bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed p-12 text-center">
                                    <ChevronRight className="w-12 h-12 text-slate-700 mb-4" />
                                    <p className="text-slate-500 font-bold text-lg">Select an assignment on the left to view student submissions.</p>
                                </div>
                            ) : (
                                <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 h-full">
                                    <h2 className="text-xl font-bold text-white mb-6">
                                        Submissions for: <span className="text-emerald-400">{selectedAssignment.title}</span>
                                    </h2>

                                    {submissions.filter(s => s.assignment_id === selectedAssignment.id).length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">No students have submitted this yet.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {submissions.filter(s => s.assignment_id === selectedAssignment.id).map(sub => (
                                                <div
                                                    key={sub.id}
                                                    onClick={() => setSelectedSubmission(sub)}
                                                    className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center cursor-pointer hover:border-slate-600 transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                                                            <User size={18} className="text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white">{sub.children?.full_name}</p>
                                                            <p className="text-xs text-slate-500">{new Date(sub.submitted_at).toLocaleString()}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        {sub.violations?.length > 0 ? (
                                                            <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-red-500/20">
                                                                <AlertTriangle size={12} /> {sub.violations.length} Violations
                                                            </span>
                                                        ) : (
                                                            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-500/20">
                                                                <CheckCircle size={12} /> Clean
                                                            </span>
                                                        )}
                                                        <span className="font-extrabold text-white bg-slate-800 px-3 py-1 rounded-lg">{sub.integrity_score}%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>

            {/* 🚨 SUBMISSION DETAILS MODAL */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                            <div>
                                <h2 className="text-2xl font-extrabold text-white">{selectedSubmission.children?.full_name}'s Work</h2>
                                <p className="text-slate-400 text-sm">{selectedAssignment?.title}</p>
                            </div>
                            <button onClick={() => setSelectedSubmission(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Integrity Report */}
                        <div className={`p-4 flex items-center justify-between border-b border-slate-800 ${selectedSubmission.violations?.length > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                            <div className="flex items-center gap-2 font-bold">
                                {selectedSubmission.violations?.length > 0 ? <AlertTriangle className="text-red-400" /> : <CheckCircle className="text-emerald-400" />}
                                <span className={selectedSubmission.violations?.length > 0 ? 'text-red-400' : 'text-emerald-400'}>
                                    Integrity Score: {selectedSubmission.integrity_score}%
                                </span>
                            </div>
                            {selectedSubmission.violations?.length > 0 && (
                                <span className="text-sm text-red-300 bg-red-500/20 px-3 py-1 rounded-lg">
                                    {selectedSubmission.violations.length} issues logged
                                </span>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="p-6 overflow-y-auto">
                            {selectedSubmission.violations?.length > 0 && (
                                <div className="mb-6 bg-slate-950 p-4 rounded-xl border border-red-500/30">
                                    <h3 className="text-sm font-bold text-red-400 mb-2">Violation Log:</h3>
                                    <ul className="list-disc pl-4 text-xs text-red-300 space-y-1">
                                        {selectedSubmission.violations.map((v: any, i: number) => (
                                            <li key={i}>{typeof v === 'string' ? v : JSON.stringify(v)}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Student Answers:</h3>

                            {/* Render based on assignment type */}
                            {selectedAssignment?.type === 'doc' ? (
                                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-slate-300 whitespace-pre-wrap font-serif leading-relaxed">
                                    {selectedSubmission.content?.text || "No text submitted."}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedAssignment?.settings?.questions?.map((q: any, i: number) => (
                                        <div key={q.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                            <p className="font-bold text-white mb-2">{i + 1}. {q.label}</p>
                                            <p className="text-emerald-400 font-medium bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                                                {Array.isArray(selectedSubmission.content?.[q.id])
                                                    ? selectedSubmission.content[q.id].join(", ")
                                                    : selectedSubmission.content?.[q.id] || <span className="text-slate-500 italic">Skipped</span>}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}