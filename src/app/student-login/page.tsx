"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Smile, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// 🚨 IMPORT YOUR BACKGROUND IMAGE
import studentBg from "@/pic/100a5ec1-5f72-4fa8-bf39-6a9868de1337.jpg";

export default function StudentLogin() {
    const router = useRouter();
    const supabase = createClient();

    // Form states
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [pin, setPin] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Database states
    const [students, setStudents] = useState<{ id: string; full_name: string; class_name: string }[]>([]);
    const [fetchingStudents, setFetchingStudents] = useState(true);

    // 🛡️ FETCH REAL STUDENTS FROM DATABASE SECURELY
    useEffect(() => {
        async function fetchStudents() {
            // We ONLY fetch approved students. We only grab their ID and Name.
            // We NEVER fetch their PINs to the frontend.
            const { data, error } = await supabase
                .from("children")
                .select("id, full_name, class_name")
                .eq("is_approved", true)
                .order("full_name", { ascending: true });

            if (data) setStudents(data);
            setFetchingStudents(false);
        }
        fetchStudents();
    }, [supabase]);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedStudentId) {
            setError("Please select your name.");
            return;
        }

        setLoading(true);
        setError(null);

        // Send the secure Student ID (not the name) to the server
        const res = await fetch("/api/student-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentId: selectedStudentId, pin }),
        });

        if (res.ok) {
            router.push("/student");
            router.refresh();
        } else {
            const data = await res.json();
            setError(data.error || "Invalid PIN. Please try again.");
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center font-sans p-6 overflow-hidden">

            {/* 🖼️ BACKGROUND IMAGE (No more dark overlay!) */}
            <Image
                src={studentBg}
                alt="Student Background"
                fill
                className="object-cover z-0"
                priority
            />

            <Link href="/sign-in" className="absolute top-8 left-8 z-10 flex items-center gap-2 text-white hover:text-emerald-300 transition-colors font-bold bg-black/40 px-5 py-2.5 rounded-xl border border-white/20 backdrop-blur-md shadow-lg">
                <ArrowLeft size={20} /> Back to Login
            </Link>

            {/* 🛡️ The Glassmorphic Login Card */}
            <div className="w-full max-w-md bg-slate-950/85 backdrop-blur-xl border border-slate-700 p-8 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border-4 border-emerald-500/30">
                        <Smile className="w-10 h-10 text-emerald-400" />
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold text-white text-center mb-8 drop-shadow-md">Student Login</h1>

                {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl mb-6 text-sm font-semibold text-center backdrop-blur-md">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Select Your Name</label>

                        {/* 🛡️ DYNAMIC DROPDOWN */}
                        {fetchingStudents ? (
                            <div className="w-full bg-slate-900 border-2 border-slate-700 text-slate-400 rounded-2xl px-4 py-4 flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin w-5 h-5" /> Loading Students...
                            </div>
                        ) : (
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                required
                                className="w-full bg-slate-900 border-2 border-slate-700 text-white rounded-2xl px-4 py-4 text-lg font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 transition-all text-center appearance-none cursor-pointer"
                            >
                                <option value="" disabled hidden>Choose your name...</option>
                                {students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.full_name} ({student.class_name})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Enter 4-Digit PIN</label>
                        <input
                            type="password"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            required
                            className="w-full bg-slate-900 border-2 border-slate-700 text-white rounded-2xl px-4 py-4 text-3xl tracking-[0.5em] font-extrabold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 transition-all text-center"
                            placeholder="••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || fetchingStudents}
                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xl py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 mt-4"
                    >
                        {loading ? "Verifying..." : "Let's Play!"}
                    </button>
                </form>
            </div>
        </div>
    );
}