"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    UserPlus, LogOut, CheckCircle, Clock, Trash2,
    Trophy, BookOpen, MessageSquare, X, BarChart2, Loader2
} from "lucide-react";

import logoImg from "@/pic/FAV-ICO2.png";

export default function ParentPage() {
    const [children, setChildren] = useState<any[]>([]);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [className, setClassName] = useState("KG1");
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);

    // 🚨 State for the Grade Modal & DB Fetching
    const [selectedChild, setSelectedChild] = useState<any | null>(null);
    const [gradeData, setGradeData] = useState<{ rank: number, total: number, results: any[] } | null>(null);
    const [fetchingGrades, setFetchingGrades] = useState(false);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        fetchChildren();
    }, []);

    async function fetchChildren() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("children").select("*").eq("parent_id", user.id).order("created_at", { ascending: false });
        if (data) setChildren(data);
    }

    async function handleAddChild(e: React.FormEvent) {
        e.preventDefault();
        if (pin.length !== 4 || isNaN(Number(pin))) return alert("PIN must be 4 numbers.");

        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return alert("You must be logged in.");

        const fullName = `${firstName.trim()} ${lastName.trim()}`;

        const { error } = await supabase.from("children").insert({
            parent_id: user.id,
            full_name: fullName,
            class_name: className,
            student_pin: pin,
            is_approved: false
        });

        setLoading(false);

        if (error) {
            if (error.code === '23505') {
                alert("A student with this exact name and PIN already exists. Please choose a different PIN.");
            } else {
                alert(error.message);
            }
        } else {
            setFirstName(""); setLastName(""); setPin("");
            fetchChildren();
        }
    }

    async function handleDeleteChild(id: string) {
        if (!confirm("Are you sure you want to delete this child? This action cannot be undone.")) return;
        const { error } = await supabase.from("children").delete().eq("id", id);
        if (error) alert(error.message);
        else fetchChildren();
    }

    async function handleSignOut() {
        await supabase.auth.signOut();
        document.cookie = "tba_login_time=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/sign-in");
        router.refresh();
    }

    // 🚨 FETCH REAL GRADES FROM DATABASE
    async function openGradeModal(child: any) {
        setSelectedChild(child);
        setFetchingGrades(true);
        setGradeData(null);

        try {
            // 1. Fetch all students in the same class to calculate rank
            const { data: classmates } = await supabase
                .from("children")
                .select("id, total_points_earned")
                .eq("class_name", child.class_name)
                .order("total_points_earned", { ascending: false });

            let rank = 0;
            let total = classmates?.length || 1;

            if (classmates) {
                const index = classmates.findIndex((c) => c.id === child.id);
                if (index !== -1) rank = index + 1;
            }

            // 2. Fetch real assessment results for this child
            // (Adjust 'assessment_results' if your table is named differently)
            const { data: results, error } = await supabase
                .from("assessment_results")
                .select(`
                    id,
                    score,
                    max_score,
                    teacher_feedback,
                    created_at,
                    assignments (title, subject)
                `)
                .eq("student_id", child.id)
                .order("created_at", { ascending: false });

            setGradeData({
                rank: rank,
                total: total,
                results: results || []
            });

        } catch (error) {
            console.error("Failed to fetch grades", error);
        } finally {
            setFetchingGrades(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Navbar */}
            <nav className="relative z-10 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl px-8 py-4 flex justify-between items-center sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-emerald-500/20">
                        <Image src={logoImg} alt="Logo" className="object-contain w-full h-full" />
                    </div>
                    <span className="text-xl font-extrabold text-white tracking-tight">Parent Portal</span>
                </div>
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="text-sm font-bold text-slate-300 hover:text-white transition-colors">
                        Dashboard
                    </Link>
                    <button onClick={handleSignOut} className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20 transition-all">
                        <LogOut className="w-4 h-4" /> Sign out
                    </button>
                </div>
            </nav>

            <div className="relative z-10 max-w-7xl mx-auto p-8">
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* ADD CHILD FORM */}
                    <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 shadow-2xl h-fit">
                        <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2 text-white">
                            <UserPlus className="text-emerald-400 w-6 h-6" /> Add a Child
                        </h2>

                        <form onSubmit={handleAddChild} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">First Name</label>
                                    <input placeholder="Leo" value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Last Name</label>
                                    <input placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Class Level</label>
                                <select value={className} onChange={e => setClassName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer">
                                    <option value="Pre-K">Pre-K</option>
                                    <option value="KG1">KG1</option>
                                    <option value="KG2">KG2</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">4-Digit Student PIN</label>
                                <input type="text" maxLength={4} placeholder="••••" value={pin} onChange={e => setPin(e.target.value)} required className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center tracking-[0.5em] font-extrabold text-lg transition-all" />
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/25 disabled:opacity-50 mt-4 transition-all">
                                {loading ? "Adding..." : "Add Child"}
                            </button>
                        </form>
                    </div>

                    {/* MY CHILDREN LIST */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-extrabold mb-6 text-white">My Children</h2>
                        {children.length === 0 ? (
                            <div className="bg-slate-900/50 p-12 rounded-[2rem] border border-slate-800 text-center backdrop-blur-md">
                                <p className="text-slate-400 text-lg">No children added yet. Use the form to add your first child.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {children.map((child) => (
                                    <div key={child.id} className="group bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-800 shadow-xl hover:border-slate-600 transition-all flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="font-extrabold text-xl text-white">{child.full_name}</p>
                                                <p className="text-sm text-slate-400 font-medium mt-1">{child.class_name || "N/A"}</p>
                                            </div>
                                            <button onClick={() => handleDeleteChild(child.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="mt-4">
                                            {child.is_approved ? (
                                                <button
                                                    onClick={() => openGradeModal(child)}
                                                    className="w-full relative overflow-hidden bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-4 py-3 rounded-xl transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 group-hover:shadow-lg group-hover:shadow-indigo-500/25 flex items-center justify-center"
                                                >
                                                    <span className="flex items-center gap-2 group-hover:hidden transition-all">
                                                        <CheckCircle className="w-5 h-5" /> Approved
                                                    </span>
                                                    <span className="hidden group-hover:flex items-center gap-2 transition-all">
                                                        <BarChart2 className="w-5 h-5" /> View Grades
                                                    </span>
                                                </button>
                                            ) : (
                                                <div className="w-full flex items-center justify-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/30 font-bold px-4 py-3 rounded-xl">
                                                    <Clock className="w-5 h-5" /> Pending Admin Approval
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* 🚨 REAL GRADE MODAL */}
            {selectedChild && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">

                        <div className="bg-slate-800/50 p-6 border-b border-slate-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-extrabold text-white">{selectedChild.full_name}'s Report</h2>
                                <p className="text-slate-400">{selectedChild.class_name} • Academic Overview</p>
                            </div>
                            <button onClick={() => setSelectedChild(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                            {fetchingGrades ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                                    <p>Fetching secure data from database...</p>
                                </div>
                            ) : (
                                <>
                                    {/* 1. Leaderboard Rank */}
                                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-6 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                                                <Trophy className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-lg">Class Leaderboard</p>
                                                <p className="text-sm text-slate-400">Based on total points earned</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-extrabold text-amber-400">#{gradeData?.rank || "?"}</p>
                                            <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">Out of {gradeData?.total || "?"}</p>
                                        </div>
                                    </div>

                                    {/* 2. Real Assignments & Answers */}
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                            <BookOpen className="w-5 h-5 text-indigo-400" /> Assignment History
                                        </h3>

                                        {gradeData?.results.length === 0 ? (
                                            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
                                                No assignments completed yet.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {gradeData?.results.map((result: any) => {
                                                    const percentage = Math.round((result.score / (result.max_score || 100)) * 100);
                                                    const isPassing = percentage >= 70;

                                                    return (
                                                        <div key={result.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                                                            <div>
                                                                <p className="font-bold text-white">{result.assignments?.title || "Unknown Assignment"}</p>
                                                                <p className="text-sm text-slate-400">
                                                                    {result.assignments?.subject} • {new Date(result.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className={`font-bold text-lg ${isPassing ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                                    {percentage}%
                                                                </span>
                                                                <p className="text-xs text-slate-500">Score: {result.score}/{result.max_score}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Real Teacher Feedback */}
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                            <MessageSquare className="w-5 h-5 text-pink-400" /> Teacher Feedback
                                        </h3>

                                        {/* Fetch the most recent feedback that isn't empty */}
                                        {(() => {
                                            const latestFeedback = gradeData?.results.find(r => r.teacher_feedback);
                                            if (!latestFeedback) return (
                                                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-center text-slate-500">
                                                    No written feedback from teachers yet.
                                                </div>
                                            );
                                            return (
                                                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 relative">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-pink-500 rounded-l-xl"></div>
                                                    <p className="text-slate-300 italic">"{latestFeedback.teacher_feedback}"</p>
                                                    <p className="text-sm text-slate-500 mt-3 font-bold">- Regarding: {latestFeedback.assignments?.title}</p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}