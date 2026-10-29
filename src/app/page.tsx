import Link from "next/link";
import { Blocks, Sparkles, Shield, Gamepad2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans relative overflow-hidden text-slate-200">

      {/* 🌌 AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Blocks className="text-white w-7 h-7" />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">
            The Baby Academy
          </span>
        </div>
        <div className="flex gap-4">
          <Link href="/sign-in" className="px-6 py-2.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
            Log In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 mt-12 mb-24">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium mb-8 backdrop-blur-md">
          <Sparkles size={16} /> Next-Generation Learning Platform
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight max-w-4xl">
          Where Education Meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Play.</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12">
          An immersive 3D world, live AI-powered classrooms, and interactive arcade games—all in one secure ecosystem for your students.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link href="/sign-up" className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group">
            Create Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/sign-in" className="flex-1 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white font-bold text-lg py-4 rounded-2xl transition-all backdrop-blur-md">
            Log In
          </Link>
        </div>
      </main>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto w-full px-6 grid md:grid-cols-3 gap-6 relative z-10 mb-20">
        {[
          { icon: <Gamepad2 />, title: "Gamified Learning", desc: "Earn coins, buy 3D avatars, and compete in live arenas." },
          { icon: <Shield />, title: "Secure & Monitored", desc: "Anti-cheat systems and live admin oversight keep it safe." },
          { icon: <Blocks />, title: "Live AI Classrooms", desc: "Instant AI-generated slide decks and live video meetings." }
        ].map((feature, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl hover:bg-slate-800/50 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
            <p className="text-slate-400">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}