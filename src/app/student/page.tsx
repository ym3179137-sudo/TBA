import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { Gamepad2, Box, BookOpen, Video, LogOut, FileText, Play } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// 🚨 Import the images
import studentBg from "@/pic/100a5ec1-5f72-4fa8-bf39-6a9868de1337.jpg";
import logoImg from "@/pic/FAV-ICO2.png";

export default async function StudentDashboard() {
    const cookieStore = await cookies();
    const studentId = cookieStore.get("student_id")?.value;
    const studentName = cookieStore.get("student_name")?.value;

    if (!studentId) redirect("/student-login");

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: studentData } = await supabaseAdmin
        .from("children")
        .select("coins, class_name")
        .eq("id", studentId)
        .single();

    const coins = studentData?.coins || 0;
    const className = studentData?.class_name || "KG1";

    // Fetch published presentations
    const { data: presentations } = await supabaseAdmin
        .from("presentations")
        .select("*")
        .or(`target_type.eq.all,target_type.eq.grade,target_type.eq.student`)
        .order('created_at', { ascending: false });

    const myPresentations = presentations?.filter(p =>
        p.target_type === 'all' ||
        (p.target_type === 'grade' && p.target_value === className) ||
        (p.target_type === 'student' && p.target_value === studentId)
    ) || [];

    return (
        <div className="min-h-screen relative flex flex-col font-sans">
            <Image src={studentBg} alt="Student Background" fill className="object-cover z-0" priority />

            <div className="relative z-10 flex flex-col min-h-screen">
                <nav className="p-4 flex justify-between items-center max-w-7xl mx-auto w-full bg-slate-950/70 backdrop-blur-lg rounded-b-3xl border-b border-white/10 shadow-2xl">
                    <div className="flex items-center gap-3">
                        {/* 🚨 FIXED LOGO HERE */}
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg p-1.5 overflow-hidden">
                            <Image
                                src={logoImg}
                                alt="TBA Logo"
                                className="object-contain w-full h-full"
                            />
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

                <main className="flex-1 max-w-6xl w-full mx-auto p-6 mt-8">
                    <div className="mb-10 text-center">
                        <h1 className="text-5xl font-black text-white mb-2 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">Welcome back, {studentName}!</h1>
                        <p className="text-white text-xl font-bold drop-shadow-md bg-black/30 inline-block px-4 py-1 rounded-full">Ready for today's adventure?</p>
                    </div>

                    {myPresentations.length > 0 && (
                        <div className="mb-12 bg-slate-900/80 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <BookOpen className="text-emerald-400" /> Lessons from your Teacher
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {myPresentations.map((pres) => (
                                    <div key={pres.id} className="bg-slate-950 border border-slate-700 p-5 rounded-2xl flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{pres.title}</h3>
                                            <p className="text-xs text-slate-400 mb-4">{new Date(pres.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <Link href={`/student/presentation/${pres.id}`} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-all">
                                            <Play size={16} /> Slide Show
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link href="/student/avatar" className="group relative overflow-hidden bg-slate-900/85 border-2 border-indigo-500/50 p-6 rounded-3xl backdrop-blur-md hover:bg-slate-800/90 transition-all hover:-translate-y-1 shadow-2xl">
                            <Box className="w-10 h-10 text-indigo-400 mb-3" />
                            <h2 className="text-xl font-bold text-white mb-1">Avatar Studio</h2>
                        </Link>
                        <Link href="/student/games" className="group relative overflow-hidden bg-slate-900/85 border-2 border-emerald-500/50 p-6 rounded-3xl backdrop-blur-md hover:bg-slate-800/90 transition-all hover:-translate-y-1 shadow-2xl">
                            <Gamepad2 className="w-10 h-10 text-emerald-400 mb-3" />
                            <h2 className="text-xl font-bold text-white mb-1">Arcade Arena</h2>
                        </Link>
                        <Link href="/student/classroom" className="group relative overflow-hidden bg-slate-900/85 border-2 border-blue-500/50 p-6 rounded-3xl backdrop-blur-md hover:bg-slate-800/90 transition-all hover:-translate-y-1 shadow-2xl">
                            <Video className="w-10 h-10 text-blue-400 mb-3" />
                            <h2 className="text-xl font-bold text-white mb-1">Live Classroom</h2>
                        </Link>
                    </div>
                </main>
            </div>
        </div>
    );
}