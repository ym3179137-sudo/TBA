import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { Gamepad2, Box, BookOpen, Video, LogOut, FileText, Play, Radio, ClipboardList } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

import studentBg from "@/pic/100a5ec1-5f72-4fa8-bf39-6a9868de1337.jpg";
import logoImg from "@/pic/FAV-ICO2.png";

export const dynamic = 'force-dynamic';

export default async function StudentDashboard() {
    const cookieStore = await cookies();
    const studentId = cookieStore.get("student_id")?.value;
    const studentName = cookieStore.get("student_name")?.value;

    if (!studentId) redirect("/student-login");

    // 🛡️ Bypass RLS to get the actual data securely on the server
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch Student Data (Coins & Class)
    const { data: studentData } = await supabaseAdmin
        .from("children")
        .select("coins, class_name")
        .eq("id", studentId)
        .maybeSingle();

    const coins = studentData?.coins || 0;
    const className = studentData?.class_name || "KG1";

    // 2. Fetch Live Sessions
    const { data: liveSessions } = await supabaseAdmin
        .from("live_sessions")
        .select("*")
        .eq("is_active", true)
        .limit(1);
    const isLive = liveSessions && liveSessions.length > 0;

    // 3. Fetch Presentations
    const { data: presentations } = await supabaseAdmin
        .from("presentations")
        .select("*")
        .order('created_at', { ascending: false });

    const myPresentations = presentations?.filter(p =>
        p.target_type === 'all' ||
        (p.target_type === 'grade' && p.target_value === className) ||
        (p.target_type === 'student' && p.target_value === studentId)
    ) || [];

    // 4. Fetch Assignments
    const { data: allAssignments } = await supabaseAdmin
        .from("assignments")
        .select("*")
        .eq("status", "published");

    const myAssignments = allAssignments?.filter(a =>
        a.target_grade === className || a.target_student_id === studentId
    ) || [];

    // 5. Fetch Submissions (to show the count of graded assignments)
    const { data: mySubmissions } = await supabaseAdmin
        .from("submissions")
        .select("score")
        .eq("student_id", studentId);

    const gradedCount = mySubmissions?.filter(s => s.score !== undefined && s.score !== null).length || 0;

    return (
        <div className="min-h-screen relative flex flex-col font-sans pb-12">
            <Image src={studentBg} alt="Student Background" fill className="object-cover z-0" priority />

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* NAVBAR */}
                <nav className="p-4 flex justify-between items-center max-w-7xl mx-auto w-full bg-slate-950/70 backdrop-blur-lg border-b border-white/10 md:rounded-b-3xl shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg p-1.5">
                            <Image src={logoImg} alt="Logo" className="object-contain w-full h-full" />
                        </div>
                        <span className="text-lg md:text-xl font-extrabold text-white">Student Portal</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* 🚨 COINS DISPLAY */}
                        <div className="bg-amber-500/90 text-slate-950 font-extrabold px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-sm md:text-base shadow-lg border border-amber-400">
                            {coins} 🪙
                        </div>
                        <form action={async () => {
                            "use server";
                            const cookieStore = await cookies();
                            cookieStore.delete("student_id");
                            cookieStore.delete("student_name");
                            redirect("/student-login");
                        }}>
                            <button type="submit" className="flex items-center gap-2 text-sm font-bold text-white hover:text-red-300 bg-red-500/80 px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-colors">
                                <LogOut size={16} /> <span className="hidden md:inline">Sign Out</span>
                            </button>
                        </form>
                    </div>
                </nav>

                {/* MAIN CONTENT */}
                <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 mt-6">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                            Welcome, {studentName}!
                        </h1>
                        <p className="text-white text-base md:text-xl font-bold drop-shadow-md bg-black/40 inline-block px-4 py-1 rounded-full">
                            Ready for today's adventure?
                        </p>
                    </div>

                    {/* LIVE CLASS BANNER */}
                    {isLive && (
                        <div className="mb-8 bg-red-600/90 border border-red-500 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.5)] backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
                            <div className="text-center md:text-left">
                                <h2 className="text-xl md:text-2xl font-black text-white flex items-center justify-center md:justify-start gap-3">
                                    <Radio className="w-6 h-6 md:w-8 md:h-8" /> Your Teacher is Live!
                                </h2>
                                <p className="text-red-200 mt-1 font-bold text-sm md:text-base">Click below to join the live classroom.</p>
                            </div>
                            <Link href="/student/classroom" className="w-full md:w-auto bg-white text-red-600 font-black px-6 py-3 rounded-xl shadow-xl text-center text-sm md:text-base hover:bg-slate-100 transition-colors">
                                Join Live Class
                            </Link>
                        </div>
                    )}

                    {/* LESSONS */}
                    {myPresentations.length > 0 && (
                        <div className="mb-8 bg-slate-900/80 backdrop-blur-xl border border-emerald-500/30 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl">
                            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <BookOpen className="text-emerald-400" /> Lessons from your Teacher
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {myPresentations.map((pres) => (
                                    <div key={pres.id} className="bg-slate-950 border border-slate-700 p-4 rounded-xl flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-white text-base md:text-lg">{pres.title}</h3>
                                            <p className="text-xs text-slate-400 mb-4">{new Date(pres.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <Link href={`/student/presentation/${pres.id}`} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
                                            <Play size={16} /> Slide Show
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 🚨 5 MAIN BUTTONS GRID */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

                        <Link href="/student/avatar" className="bg-slate-900/85 border-2 border-indigo-500/50 p-6 rounded-2xl md:rounded-3xl backdrop-blur-md hover:bg-slate-800/90 transition-all flex flex-col items-center gap-4 text-center">
                            <Box className="w-10 h-10 text-indigo-400 shrink-0" />
                            <h2 className="text-lg md:text-xl font-bold text-white">Avatar Studio</h2>
                        </Link>

                        <Link href="/student/games" className="bg-slate-900/85 border-2 border-emerald-500/50 p-6 rounded-2xl md:rounded-3xl backdrop-blur-md hover:bg-slate-800/90 transition-all flex flex-col items-center gap-4 text-center">
                            <Gamepad2 className="w-10 h-10 text-emerald-400 shrink-0" />
                            <h2 className="text-lg md:text-xl font-bold text-white">Arcade Arena</h2>
                        </Link>

                        <Link href="/student/assignments" className="bg-slate-900/85 border-2 border-pink-500/50 p-6 rounded-2xl md:rounded-3xl backdrop-blur-md hover:bg-slate-800/90 transition-all flex flex-col items-center gap-4 text-center relative">
                            <FileText className="w-10 h-10 text-pink-400 shrink-0" />
                            <h2 className="text-lg md:text-xl font-bold text-white">Assignments</h2>
                            {myAssignments.length > 0 && (
                                <span className="absolute top-2 right-2 bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                    {myAssignments.length}
                                </span>
                            )}
                        </Link>

                        <Link href="/student/grades" className="bg-slate-900/85 border-2 border-amber-500/50 p-6 rounded-2xl md:rounded-3xl backdrop-blur-md hover:bg-slate-800/90 transition-all flex flex-col items-center gap-4 text-center relative">
                            <ClipboardList className="w-10 h-10 text-amber-400 shrink-0" />
                            <h2 className="text-lg md:text-xl font-bold text-white">My Grades</h2>
                            {gradedCount > 0 && (
                                <span className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                    {gradedCount}
                                </span>
                            )}
                        </Link>

                        <Link href="/student/classroom" className="bg-slate-900/85 border-2 border-blue-500/50 p-6 rounded-2xl md:rounded-3xl backdrop-blur-md hover:bg-slate-800/90 transition-all flex flex-col items-center gap-4 text-center">
                            <Video className="w-10 h-10 text-blue-400 shrink-0" />
                            <h2 className="text-lg md:text-xl font-bold text-white">Live Classroom</h2>
                        </Link>
                    </div>
                </main>
            </div>
        </div>
    );
}