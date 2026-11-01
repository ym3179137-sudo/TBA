"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { gradeSubmission, deleteAssignment, deleteSubmission } from "@/app/actions/grading";
import { FileText, CheckCircle, AlertTriangle, User, Calendar, Share2, ClipboardCheck, Edit3, Save, Trash2, Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function TeacherAssessments() {
    const supabase = useMemo(() => createClient(), []);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

    const [gradingSub, setGradingSub] = useState<any>(null);
    const [manualScore, setManualScore] = useState<string>("0");
    const [manualFeedback, setManualFeedback] = useState("");
    const [savingGrade, setSavingGrade] = useState(false);

    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: assignmentsData } = await supabase.from("assignments").select("*").eq("teacher_id", user.id).order("created_at", { ascending: false });
            setAssignments(assignmentsData || []);

            setSelectedAssignment((prev: any) => {
                if (!prev && assignmentsData && assignmentsData.length > 0) return assignmentsData[0];
                if (prev && assignmentsData) return assignmentsData.find(a => a.id === prev.id) || assignmentsData[0];
                return prev;
            });

            const { data: submissionsData } = await supabase.from("submissions").select("*").order("submitted_at", { ascending: false });

            if (submissionsData) {
                const studentIds = [...new Set(submissionsData.map(s => s.student_id))];
                const validUuids = studentIds.filter(id => id && id.length > 20 && !id.startsWith("guest-"));

                let childrenData: any[] = [];
                if (validUuids.length > 0) {
                    const { data: cData } = await supabase.from("children").select("id, full_name").in("id", validUuids);
                    childrenData = cData || [];
                }

                const enriched = submissionsData.map(sub => ({
                    ...sub,
                    student_name: childrenData.find(c => c.id === sub.student_id)?.full_name || "Guest Player",
                }));
                setSubmissions(enriched);
            }
            setLoading(false);
        }

        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [supabase]);

    const handleShare = () => {
        if (!selectedAssignment) return;
        const url = `${window.location.origin}/student/assignments/${selectedAssignment.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDeleteAssignment = async (id: string) => {
        if (!confirm("Are you sure you want to delete this assignment? All student submissions for it will be lost.")) return;
        try {
            await deleteAssignment(id);
            if (selectedAssignment?.id === id) setSelectedAssignment(null);
        } catch (err: any) {
            alert("Failed to delete: " + err.message);
        }
    };

    const handleDeleteSubmission = async (id: string) => {
        if (!confirm("Delete this student's submission?")) return;
        try {
            await deleteSubmission(id);
        } catch (err: any) {
            alert("Failed to delete: " + err.message);
        }
    };

    const openGradingModal = (sub: any) => {
        setGradingSub(sub);
        setManualScore(String(sub.score || 0));
        setManualFeedback(sub.teacher_feedback || "");
    };

    const saveGrade = async () => {
        setSavingGrade(true);
        try {
            await gradeSubmission(gradingSub.id, parseInt(manualScore) || 0, manualFeedback);
            setGradingSub(null);
        } catch (err: any) {
            alert("Failed to save grade: " + err.message);
        } finally {
            setSavingGrade(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin w-8 h-8" /></div>;

    const filteredSubmissions = selectedAssignment ? submissions.filter(s => s.assignment_id === selectedAssignment.id) : [];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-6xl mx-auto">

                {/* 🚨 SMART BACK BUTTON */}
                <div className="mb-6">
                    <BackButton fallbackUrl="/teacher" label="Back to Dashboard" />
                </div>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                            <FileText className="text-emerald-400" /> Assessments
                        </h1>
                    </div>
                    <div className="flex gap-4">
                        {selectedAssignment && (
                            <button onClick={handleShare} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2">
                                {copied ? <><ClipboardCheck className="text-emerald-400" /> Copied!</> : <><Share2 /> Share Quiz</>}
                            </button>
                        )}
                        <Link href="/teacher/assignments/create" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2">
                            + Create New
                        </Link>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* LIST OF ASSIGNMENTS */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4">Your Assignments</h2>
                        {assignments.map((assignment) => {
                            const subCount = submissions.filter(s => s.assignment_id === assignment.id).length;
                            return (
                                <div key={assignment.id} className="relative group">
                                    <button
                                        onClick={() => setSelectedAssignment(assignment)}
                                        className={`w-full text-left p-5 rounded-2xl border transition-all pr-12 ${selectedAssignment?.id === assignment.id ? 'bg-slate-800 border-emerald-500' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
                                    >
                                        <h3 className="font-bold text-white text-lg truncate">{assignment.title}</h3>
                                        <div className="flex items-center gap-3 mt-3 text-xs font-bold text-slate-400">
                                            <span className="bg-slate-950 px-2 py-1 rounded-md">{subCount} Submissions</span>
                                            {assignment.settings?.lockMode && <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> Locked</span>}
                                            {assignment.status === 'draft' && <span className="text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">Draft</span>}
                                        </div>
                                    </button>
                                    <button onClick={() => handleDeleteAssignment(assignment.id)} className="absolute top-1/2 -translate-y-1/2 right-4 p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* SUBMISSIONS VIEW */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[500px]">
                            <h2 className="text-xl font-bold text-white mb-6">
                                Submissions for: <span className="text-emerald-400">{selectedAssignment?.title || "None Selected"}</span>
                            </h2>

                            {filteredSubmissions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                    <FileText className="w-12 h-12 mb-3 opacity-50" />
                                    <p>No students have submitted this yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredSubmissions.map((sub) => (
                                        <div key={sub.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl relative group">
                                            <button onClick={() => handleDeleteSubmission(sub.id)} className="absolute top-4 right-4 p-1.5 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 size={16} />
                                            </button>

                                            <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-4 pr-8">
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
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-4 py-1 rounded-full text-sm font-black ${sub.score >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                            Score: {sub.score || 0}%
                                                        </span>
                                                        <button onClick={() => openGradingModal(sub)} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-all" title="Edit Grade">
                                                            <Edit3 size={16} />
                                                        </button>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.integrity_score >= 80 ? 'bg-slate-800 text-slate-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        Integrity: {sub.integrity_score}%
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {selectedAssignment?.settings?.questions?.map((q: any, idx: number) => {
                                                    const answer = sub.content?.[q.id];
                                                    const isExactMatch = q.type === 'multiple_choice' || (q.type === 'short_text' && q.correctAnswer);
                                                    const isCorrect = String(answer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

                                                    return (
                                                        <div key={q.id} className={`p-3 rounded-lg border ${isExactMatch ? (isCorrect ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-red-950/20 border-red-900/50') : 'bg-slate-900 border-slate-700'}`}>
                                                            <p className="text-sm font-bold text-slate-300 mb-1">Q{idx + 1}: {q.label}</p>
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-white font-medium pl-4 border-l-2 border-slate-500 whitespace-pre-wrap">
                                                                    {Array.isArray(answer) ? answer.join(", ") : answer || <span className="text-slate-500 italic">No answer</span>}
                                                                </p>
                                                                {isExactMatch && !isCorrect && <span className="text-xs text-red-400 font-bold ml-4 shrink-0">Correct: {q.correctAnswer}</span>}
                                                                {isExactMatch && isCorrect && <CheckCircle size={16} className="text-emerald-400 ml-4 shrink-0" />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {sub.teacher_feedback && (
                                                <div className="mt-4 bg-pink-500/10 border border-pink-500/20 p-3 rounded-lg">
                                                    <p className="text-xs font-bold text-pink-400 mb-1">Teacher Feedback:</p>
                                                    <p className="text-sm text-pink-200 italic">"{sub.teacher_feedback}"</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* GRADING MODAL */}
            {gradingSub && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-black text-white mb-1">Grade Submission</h2>
                        <p className="text-slate-400 mb-6">{gradingSub.student_name}</p>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Score (0 - 100)</label>
                                <input type="number" value={manualScore} onChange={(e) => setManualScore(e.target.value)} min="0" max="100" className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-bold text-xl" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Teacher Feedback</label>
                                <textarea value={manualFeedback} onChange={(e) => setManualFeedback(e.target.value)} placeholder="Great job! Next time try..." className="w-full h-32 bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-indigo-500 resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setGradingSub(null)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700">Cancel</button>
                                <button onClick={saveGrade} disabled={savingGrade} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-500 flex justify-center items-center gap-2">
                                    {savingGrade ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Grade
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}