import Link from "next/link";
import { Gamepad2, ArrowLeft } from "lucide-react";

export default function GamesPage() {
    return (
        <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl">
                <Link href="/student" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 font-bold">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>
                <h1 className="text-4xl font-extrabold text-white mb-8">Arcade Arena</h1>

                <div className="grid md:grid-cols-2 gap-6">
                    <Link href="/join" className="bg-slate-900 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800 transition-all text-center">
                        <Gamepad2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Join Live Game</h2>
                        <p className="text-slate-400">Enter a PIN to join your teacher's live quiz.</p>
                    </Link>
                    {/* Add other games here */}
                </div>
            </div>
        </div>
    );
}