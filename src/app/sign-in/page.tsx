"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Blocks, GraduationCap, ArrowRight } from "lucide-react";

export default function SignInPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setLoading(false);
            setError("Invalid email or password.");

            try {
                await fetch("/api/security/log-failure", {
                    method: "POST",
                    body: JSON.stringify({ email }),
                });
            } catch (err) { }
            return;
        }

        document.cookie = `tba_login_time=${Date.now()}; path=/; max-age=86400; SameSite=Lax`;
        router.push(searchParams.get("next") || "/dashboard");
        router.refresh();
    }

    return (
        <main className="min-h-screen flex bg-slate-50">
            {/* Left side - Branding */}
            <div className="hidden lg:flex w-1/2 bg-emerald-600 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-700 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

                <div className="relative z-10 text-center">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <Blocks className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h1 className="text-5xl font-extrabold mb-4">The Baby Academy</h1>
                    <p className="text-emerald-100 text-lg max-w-md mx-auto">
                        Nurturing the next generation of curious minds with interactive, AI-powered learning.
                    </p>
                </div>
            </div>

            {/* Right side - Forms */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
                <div className="w-full max-w-md space-y-6">

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
                        <p className="text-slate-500 mt-2">Please enter your details to sign in.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 space-y-5">
                        {searchParams.get("message") && (
                            <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-sm border border-amber-200 text-center font-medium">
                                {searchParams.get("message")}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && <p className="text-sm text-red-600 font-medium text-center bg-red-50 p-2 rounded-lg">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-md"
                        >
                            {loading ? "Signing in…" : "Sign In"}
                        </button>

                        <p className="text-sm text-slate-500 text-center pt-2">
                            Don't have an account?{" "}
                            <Link href="/sign-up" className="text-emerald-600 font-bold hover:underline">
                                Create one
                            </Link>
                        </p>
                    </form>

                    {/* 🎒 THE STUDENT LOGIN BUTTON */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 text-center">
                        <p className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Are you a student?</p>
                        <Link
                            href="/student-login"
                            className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-amber-950 font-extrabold text-lg py-4 rounded-xl shadow-md transition-transform active:scale-95 group"
                        >
                            <GraduationCap className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                            Student Login
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}