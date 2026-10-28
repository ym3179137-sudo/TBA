import Link from "next/link";
import { Blocks } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans selection:bg-emerald-200">
      {/* Header */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Blocks className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            The Baby Academy
          </span>
        </div>
      </nav>

      {/* Center Login Portal */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Blocks className="w-10 h-10 text-emerald-600" />
          </div>

          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-slate-500 mb-10 text-lg">
            Sign in to access your academy dashboard, or create a new account to get started.
          </p>

          <div className="space-y-4">
            <Link
              href="/sign-in"
              className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg shadow-emerald-200"
            >
              Log In
            </Link>
            <Link
              href="/sign-up"
              className="block w-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-lg py-4 rounded-xl transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-slate-400 text-sm">
        © {new Date().getFullYear()} The Baby Academy. All rights reserved.
      </footer>
    </div>
  );
}