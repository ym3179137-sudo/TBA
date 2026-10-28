import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PlayCircle, Blocks } from "lucide-react";

export default async function LibraryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/sign-in");

    const { data: lessons } = await supabase
        .from("lessons")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/teacher" className="text-emerald-600 font-medium hover:underline">← Back to Dashboard</Link>
                    <h1 className="text-2xl font-bold">My Presentation Library</h1>
                </div>

                {lessons?.length === 0 ? (
                    <div className="text-center p-12 bg-white rounded-2xl border">
                        <p className="text-slate-500">You haven't saved any presentations yet.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lessons?.map((lesson) => (
                            <Link
                                href={`/teacher/presentation/${lesson.id}`}
                                key={lesson.id}
                                className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow group block"
                            >
                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <PlayCircle className="w-6 h-6 text-emerald-600" />
                                </div>
                                <h3 className="font-bold text-lg mb-1">{lesson.title}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2">{lesson.topic || "Custom Design"}</p>
                                <p className="text-xs text-slate-400 mt-4">
                                    Created: {new Date(lesson.created_at).toLocaleDateString()}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}