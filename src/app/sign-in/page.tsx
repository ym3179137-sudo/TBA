"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, GraduationCap } from "lucide-react";

// 🚨 IMPORT YOUR LOGO HERE
import logoImg from "@/pic/FAV-ICO2.png";

export default function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    async function handleSignIn(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex text-slate-200 font-sans">

            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col items-center justify-center p-12 overflow-hidden border-r border-slate-800">
                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10 text-center flex flex-col items-center">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-8 p-2 overflow-hidden">
                        {/* 🚨 USING THE IMPORTED IMAGE */}
                        <Image src={logoImg} alt="Logo" className="object-contain w-full h-full" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">The Baby Academy</h1>
                    <p className="text-lg text-slate-400 max-w-md">Nurturing the next generation of curious minds with interactive, AI-powered learning.</p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
                <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium">
                    <ArrowLeft size={20} /> Back
                </Link>

                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold text-white mb-2">Welcome Back</h2>
                        <p className="text-slate-400">Please enter your details to sign in.</p>
                    </div>

                    {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">{error}</div>}

                    <form onSubmit={handleSignIn} className="space-y-5 bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-xl">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-lg py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>

                        <p className="text-center text-slate-400 text-sm pt-4">
                            Don't have an account? <Link href="/sign-up" className="text-indigo-400 hover:text-indigo-300 font-bold">Create one</Link>
                        </p>
                    </form>

                    {/* Student Login Button */}
                    <div className="mt-6 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 text-center backdrop-blur-xl">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Are you a student?</p>
                        <Link href="/student-login" className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-lg py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20">
                            <GraduationCap size={22} /> Student Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}