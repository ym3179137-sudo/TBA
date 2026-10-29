import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { Gamepad2, Box, BookOpen, Video, LogOut, FileText } from "lucide-react";
import { createClient } from "@supabase/supabase-js"; // 🚨 Use Admin Client to bypass RLS

// 🚨 IMPORT YOUR IMAGES
import studentBg from "@/pic/100a5ec1-5f72-4fa8-bf39-6a9868de1337.jpg";
import logoImg from "@/pic/FAV-ICO2.png";

export default async function StudentDashboard() {
    const cookieStore = await cookies();
    const studentId = cookieStore.get("student_id")?.value;
    const studentName = cookieStore.get("student_name")?.value;

    if (!studentId) redirect("/student-login");

    // 🛡️ Use Service Role Key to bypass RLS and fetch the real coins
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: studentData } = await supabaseAdmin
        .from("children")
        .select("coins")
        .eq("id", studentId)
        .single();

    // Now it will show the real database amount (e.g., 119557)
    const coins = studentData?.coins || 0;

    return (
        <div className="min-h-screen relative flex flex-col font-sans">

            {/* 🖼️ BACKGROUND IMAGE (Fully visible, no black overlay) */}
            <Image
                src={studentBg}
                alt="Student Background"
                fill
                className="object-cover z-0"
                priority
            />

            {/* Main Content Area */}
            <div className="relative z-10 flex flex-col min-h-screen">

                {/* Navbar (Dark glass background so text is readable over the picture) */}
                <nav className="p-4 flex justify-between items-center max-w-7xl mx-auto w-full bg-slate-950/70 backdrop-blur-lg rounded-b-3xl border-b border-white/10 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg p-1.5 overflow-hidden">
                            {/* 🚨 FIXED LOGO: Shows your image instead of "TBA" text */}
                            <Image src={logoImg} alt="Logo" className="object-contain w-full h-full" />
                        </div>
                        <span className="text-xl font-extrabold text-white tracking-tight drop-shadow-md">Student Portal</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-amber-500/90 text-slate-950 font-extrabold px-4 py-2 rounded-xl shadow-lg border border-amber-400">
                            {coins} 🪙
                        </div>

                        <form action={async () => {
                            "use server";
                            const cookieStore = await cookies();
                            cookieStore.delete("student_id");
                            cookieStore.delete("student_name");
                            redirect("/student-login");
                        }}>
                            <button type="submit" className="flex items-center gap-2 text-sm font-bold text-white hover:text-red-300 bg-red-500/80 hover:bg-red-500 px-4 py-2 rounded-xl transition-all shadow-lg">
                                <LogOut size={16} /> Sign Out
                            </button>
                        </form>
                    </div>
                </nav>

                {/* Dashboard Content */}
                <main className="flex-1 max-w-6xl w-full mx-auto p-6 mt-8">
                    <div className="mb-10 text-center">
                        <h1 className="text-5xl font-black text-white mb-2 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
                            Welcome back, {studentName}!
                        </h1>
                        <p className="text-white text-xl font-bold drop-shadow-md bg-black/30 inline-block px-4 py-1 rounded-full">Ready for today's adventure?</p>
                    </div>

                    {/* The Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                        <Link href="/student/avatar" className="group relative overflow-hidden bg-slate-900/85 border-2 border-indigo-500/50 p-6 rounded-3xl backdrop-blur-md hover:bg-slate-800/90 transition-all hover:-translate-y-1 shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/30 blur-3xl rounded-full" />
                            <Box className="w-10 h-10 text-indigo-400 mb-3" />
                            <h2 className="text-xl font-bold text-white mb-1">Avatar Studio</h2>
                            <p className="text-slate-300 text-sm">Customize your 3D character and buy new skins.</p>
                        </Link>

                        <Link href="/student/games" className="group relative overflow-hidden bg-slate-900/85 border-2 border-emerald-500/50 p-6 rounded-3xl backdrop-blur-md hover:bg-slate-800/90 transition-all hover:-translate-y-1 shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/30 blur-3xl rounded-full" />
                            <Gamepad2 className="w-10 h-10 text-emerald-400 mb-3" />
                            <h2 className="text-xl font-bold text-white mb-1">Arcade Arena</h2>
                            <p className="text-slate-300 text-sm">Play educational games and earn coins.</p>
                        </Link>

                        <Link href="/student/classroom" className="group relative overflow-hidden bg-slate-900/85 border-2 border-blue-500/50 p-6 rounded-3xl backdrop-blur-md hover:bg-slate-800/90 transition-all hover:-translate-y-1 shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/30 blur-3xl rounded-full" />
                            <Video className="w-10 h-10 text-blue-400 mb-3" />
                            <h2 className="text-xl font-bold text-white mb-1">Live Classroom</h2>
                            <p className="text-slate-300 text-sm">Join the live presentation and video meeting.</p>
                        </Link>

                        <Link href="/student/lessons" className="group relative overflow-hidden bg-slate-900/85 border-2 border-amber-500/50 p-6 rounded-3xl backdrop-blur-md hover:bg-slate-800/90 transition-all hover:-translate-y-1 shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/30 blur-3xl rounded-full" />
                            <BookOpen className="w-10 h-10 text-amber-400 mb-3" />
                            <h2 className="text-xl font-bold text-white mb-1">My Lessons</h2>
                            <p className="text-slate-300 text-sm">Review past AI presentations and notes.</p>
                        </Link>

                        <Link href="/student/assignments" className="group relative overflow-hidden bg-slate-900/85 border-2 border-pink-500/50 p-6 rounded-3xl backdrop-blur-md hover:bg-slate-800/90 transition-all hover:-translate-y-1 shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/30 blur-3xl rounded-full" />
                            <FileText className="w-10 h-10 text-pink-400 mb-3" />
                            <h2 className="text-xl font-bold text-white mb-1">Assignments</h2>
                            <p className="text-slate-300 text-sm">Check your quizzes, assessments, and homework.</p>
                        </Link>

                    </div>
                </main>
            </div>
        </div>
    );
}