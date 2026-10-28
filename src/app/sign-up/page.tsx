"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignUpPage() {
    const router = useRouter();
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
            },
        });

        setLoading(false);

        if (error) {
            setError(error.message);
            return;
        }

        // 🔥 SET THE 24-HOUR TIMER COOKIE
        document.cookie = `tba_login_time=${Date.now()}; path=/; max-age=86400; SameSite=Lax`;

        router.push("/dashboard");
        router.refresh();
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm bg-white p-8 rounded-xl shadow border space-y-4 text-slate-900"
            >
                <h1 className="text-2xl font-bold">Create account</h1>

                <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                        type="password"
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full border rounded-lg px-3 py-2 bg-slate-50"
                    />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg disabled:opacity-50"
                >
                    {loading ? "Creating…" : "Sign up"}
                </button>

                <p className="text-sm text-slate-600 text-center pt-2">
                    Have an account?{" "}
                    <Link href="/sign-in" className="text-emerald-600 font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </main>
    );
}