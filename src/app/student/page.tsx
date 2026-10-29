import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Gamepad2, Box, BookOpen, Video, LogOut } from "lucide-react";
import SignOutButton from "../dashboard/sign-out-button"; // Adjust path if needed

export default async function StudentDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/sign-in");

    return (
        // 🖼️ THE BACKGROUND IMAGE WRAPPER
        <div
            className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col font-sans"
            style={{ backgroundImage: "url('/images/student-bg.jpg')" }}
        >
            {/* 🌑 Dark Overlay so text is readable */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-0" />

            {/* Main Content Area */}
            <div className="relative z-10 flex flex-col min-h-screen">

                {/* Navbar */}
                <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 p-1">
                            <img src="/images/logo.png" alt="Logo" className="object-contain" />
                        </div>
                        <span className="text-xl font-extrabold text-white tracking-tight">Student Portal</span>
                    </div>
                    <SignOutButton />
                </nav>

                {/* Dashboard Content */}
                <main className="flex-1 max-w-6xl w-full mx-auto p-6 mt-8">
                    <div className="mb-10">
                        <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">Welcome back!</h1>
                        <p className="text-slate-300 text-lg">Ready for today's adventure?</p>
                    </div>

                    {/* The Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">

                        {/* 3D Avatar Card */}
                        <Link href="/student/avatar" className="group relative overflow-hidden bg-slate-900/60 border border-white/10 p-8 rounded-3xl backdrop-blur-xl hover:bg-slate-800/80 transition-all hover:-translate-y-1 shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
                            <Box className="w-12 h-12 text-indigo-400 mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Avatar Studio</h2>
                            <p className="text-slate-400">Customize your 3D character and buy new skins with your coins.</p>
                        </Link>

                        {/* Games Card */}
                        <Link href="/student/games" className="group relative overflow-hidden bg-slate-900/60 border border-white/10 p-8 rounded-3xl backdrop-blur-xl hover:bg-slate-800/80 transition-all hover:-translate-y-1 shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full" />
                            <Gamepad2 className="w-12 h-12 text-emerald-400 mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Arcade Arena</h2>
                            <p className="text-slate-400">Play educational games, defeat challenges, and earn coins.</p>
                        </Link>

                        {/* Live Class Card */}
                        <Link href="/join" className="group relative overflow-hidden bg-slate-900/60 border border-white/10 p-8 rounded-3xl backdrop-blur-xl hover:bg-slate-800/80 transition-all hover:-translate-y-1 shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
                            <Video className="w-12 h-12 text-blue-400 mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Live Classroom</h2>
                            <p className="text-slate-400">Join the live video meeting and learn with your teacher.</p>
                        </Link>

                        {/* Lessons Card */}
                        <Link href="/student/lessons" className="group relative overflow-hidden bg-slate-900/60 border border-white/10 p-8 rounded-3xl backdrop-blur-xl hover:bg-slate-800/80 transition-all hover:-translate-y-1 shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-3xl rounded-full" />
                            <BookOpen className="w-12 h-12 text-amber-400 mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">My Lessons</h2>
                            <p className="text-slate-400">Review the AI-generated presentations and lesson notes.</p>
                        </Link>

                    </div>
                </main>
            </div>
        </div>
    );
}