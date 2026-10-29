"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Users, Mail, ShieldCheck, Video } from "lucide-react";

export default function TeacherRoster() {
    const supabase = createClient();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [meetingsEnabled, setMeetingsEnabled] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get Teacher's Students (Only the ones assigned to them by Admin)
            const { data: roster } = await supabase
                .from("children")
                .select("*")
                .eq("teacher_id", user.id)
                .eq("is_approved", true);

            if (roster) setStudents(roster);

            // 2. Check if Admin allowed meetings
            const { data: settings } = await supabase.from("school_settings").select("meetings_enabled_by_admin").single();
            if (settings) setMeetingsEnabled(settings.meetings_enabled_by_admin);

            setLoading(false);
        }
        fetchData();
    }, [supabase]);

    if (loading) return <div className="p-8 text-white">Loading roster...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <Link href="/teacher" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 font-bold">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                        <Users className="text-indigo-400" /> My Class Roster
                    </h1>

                    {meetingsEnabled ? (
                        <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg">
                            <Video size={20} /> Start Live Meeting
                        </button>
                    ) : (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 font-bold px-6 py-3 rounded-xl flex items-center gap-2">
                            <ShieldCheck size={20} /> Meetings Locked by Admin
                        </div>
                    )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                    {students.length === 0 ? (
                        <div className="text-center text-slate-500 py-12">
                            No students assigned to your class yet. The Admin must assign them.
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {students.map(student => (
                                <div key={student.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-white">{student.full_name}</p>
                                        <p className="text-xs text-slate-500">Grade: {student.class_name}</p>
                                    </div>
                                    <div className="bg-emerald-500/20 text-emerald-400 font-bold px-3 py-1 rounded-lg text-sm">
                                        {student.coins} Coins
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}