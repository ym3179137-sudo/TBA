import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export default function AssignmentsPage() {
    return (
        <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl">
                <Link href="/student" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 font-bold">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>
                <h1 className="text-4xl font-extrabold text-white mb-8">Assignments & Quizzes</h1>

                <div className="bg-slate-900 border border-slate-700 p-12 rounded-3xl text-center">
                    <FileText className="w-16 h-16 text-pink-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">All caught up!</h2>
                    <p className="text-slate-400">You have no pending quizzes or assignments right now.</p>
                </div>
            </div>
        </div>
    );
}