"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Smile } from "lucide-react";

export default function StudentLogin() {
    const [students, setStudents] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function fetchStudents() {
            const { data } = await supabase.rpc("get_approved_students");
            if (data) setStudents(data);
        }
        fetchStudents();
    }, [supabase]);

    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const studentId = formData.get("studentId");
        const pin = formData.get("pin");

        const res = await fetch("/api/student-login", {
            method: "POST",
            body: JSON.stringify({ studentId, pin }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error);
            setLoading(false);
        } else {
            router.push("/student");
        }
    }

    return (
        <main className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6">
            <Link href="/sign-in" className="absolute top-8 left-8 flex items-center gap-2 text-emerald-700 font-bold bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all">
                <ArrowLeft className="w-4 h-4" /> Back
            </Link>

            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border-4 border-emerald-100">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Smile className="w-10 h-10 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-extrabold text-center text-slate-800 mb-2">Student Login</h1>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Select Your Name</label>
                        <select name="studentId" required className="w-full border-2 border-emerald-200 rounded-xl px-4 py-3 bg-slate-50 text-lg font-medium">
                            <option value="">-- Choose Name --</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.full_name} ({s.class_name})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Enter 4-Digit PIN</label>
                        <input type="password" name="pin" maxLength={4} required placeholder="••••" className="w-full border-2 border-emerald-200 rounded-xl px-4 py-3 bg-slate-50 text-center text-3xl tracking-[1em]" />
                    </div>

                    {error && <p className="text-center text-red-500 font-bold">{error}</p>}

                    <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg disabled:opacity-50">
                        {loading ? "Checking..." : "Let's Play!"}
                    </button>
                </form>
            </div>
        </main>
    );
}