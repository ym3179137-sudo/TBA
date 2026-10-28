"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Coins, Gamepad2, Home, LogOut, FileText, ArrowRight } from "lucide-react";
import AvatarStudio from "@/components/ThreeDWorld";
import { createClient } from "@/lib/supabase/client";

export default function StudentDashboard() {
    const [studentName, setStudentName] = useState("");
    const [studentData, setStudentData] = useState<any>(null);
    const [assessments, setAssessments] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("world");
    const [loading, setLoading] = useState(true);
    const [gamePin, setGamePin] = useState("");
    const router = useRouter();
    const supabase = createClient();

    const fetchStudentData = useCallback(async () => {
        const cookies = document.cookie.split("; ");
        const idCookie = cookies.find(row => row.startsWith("student_id="));
        if (!idCookie) { router.push("/student-login"); return; }
        const studentId = idCookie.split("=")[1];

        // Fetch Profile (Now includes unlocked_skins)
        const { data, error } = await supabase.rpc("get_student_profile", { p_student_id: studentId });
        if (data && data.length > 0) {
            setStudentData(data[0]);
            setStudentName(data[0].full_name);
        }

        // Fetch Assessments
        const { data: forms } = await supabase.from("assessments").select("*").order("created_at", { ascending: false });
        if (forms) setAssessments(forms);

        setLoading(false);
    }, [supabase, router]);

    useEffect(() => {
        fetchStudentData();
        const interval = setInterval(fetchStudentData, 5000);
        return () => clearInterval(interval);
    }, [fetchStudentData]);

    const joinGame = (e: React.FormEvent) => {
        e.preventDefault();
        if (gamePin.length === 6) {
            router.push(`/play/${gamePin}`);
        } else {
            alert("Please enter a 6-digit PIN");
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-xl text-emerald-700">Loading your world...</div>;

    return (
        <main className="min-h-screen bg-slate-50 p-8 text-slate-900 flex flex-col">
            <div className="max-w-6xl mx-auto w-full space-y-6">

                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-emerald-600">Welcome, {studentName}! 👋</h1>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                        <button onClick={() => setActiveTab("world")} className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${activeTab === 'world' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <Home className="w-5 h-5" /> 3D World
                        </button>
                        <button onClick={() => setActiveTab("assessments")} className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${activeTab === 'assessments' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <FileText className="w-5 h-5" /> Homework
                        </button>
                        <button onClick={() => setActiveTab("games")} className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${activeTab === 'games' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <Gamepad2 className="w-5 h-5" /> Arcade
                        </button>
                        <div className="bg-yellow-100 text-yellow-800 px-6 py-3 rounded-xl font-extrabold text-xl flex items-center gap-2">
                            <Coins className="w-6 h-6" /> {studentData?.coins || 0}
                        </div>
                        <button onClick={() => { document.cookie = "student_id=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; document.cookie = "student_name=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; router.push("/student-login"); }} className="p-3 text-red-500 hover:bg-red-50 rounded-xl">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {activeTab === "world" && (
                    <AvatarStudio
                        studentId={studentData.id}
                        initialCoins={studentData.coins || 0}
                        initialSkin={studentData.equipped_skin}
                        initialUnlockedSkins={studentData.unlocked_skins || []} // 🛠️ Pass the skins here
                    />
                )}

                {activeTab === "assessments" && (
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                        <h2 className="text-2xl font-bold mb-6">My Homework</h2>
                        {assessments.length === 0 ? <p className="text-slate-500">No homework assigned yet!</p> : (
                            <div className="grid gap-4">
                                {assessments.map(a => (
                                    <div key={a.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-slate-50 cursor-pointer">
                                        <div>
                                            <p className="font-bold text-lg">{a.title}</p>
                                            <p className="text-sm text-slate-500">{a.questions?.length || 0} Questions</p>
                                        </div>
                                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Start</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "games" && (
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-2xl mx-auto">
                        <Gamepad2 className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-extrabold mb-2">Join a Live Game</h2>
                        <p className="text-slate-500 mb-8">Ask your teacher for the 6-digit PIN.</p>
                        <form onSubmit={joinGame} className="flex gap-4">
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="123456"
                                value={gamePin}
                                onChange={e => setGamePin(e.target.value)}
                                className="flex-1 border-4 border-purple-200 rounded-xl px-4 py-4 text-center text-3xl tracking-[1em] font-bold outline-none focus:border-purple-500"
                            />
                            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-8 rounded-xl font-bold flex items-center gap-2">
                                Join <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                )}

            </div>
        </main>
    );
}