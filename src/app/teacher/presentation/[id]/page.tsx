"use client";

import { useRef, useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DeckViewer from "@/components/DeckViewer";

export default function PresentationViewer({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const lessonId = resolvedParams.id;

    const [lesson, setLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchLesson() {
            const supabase = createClient();
            const { data } = await supabase
                .from("lessons")
                .select("*")
                .eq("id", lessonId)
                .single();

            if (data) setLesson(data);
            setLoading(false);
        }
        fetchLesson();
    }, [lessonId]);

    const handlePresent = () => {
        if (containerRef.current) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            } else if ((containerRef.current as any).webkitRequestFullscreen) {
                (containerRef.current as any).webkitRequestFullscreen();
            }
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    if (!lesson || !lesson.content) return <div className="h-screen flex items-center justify-center">Not found.</div>;

    return (
        <main className="h-screen w-screen flex flex-col bg-slate-900 overflow-hidden">
            <nav className="bg-white border-b px-6 py-3 flex justify-between items-center shrink-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/teacher/library" className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                    <span className="font-bold text-slate-800">{lesson.title}</span>
                </div>

                <button
                    onClick={handlePresent}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm"
                >
                    <Play className="w-4 h-4 fill-current" /> Present
                </button>
            </nav>

            <div ref={containerRef} className="flex-1 w-full relative bg-slate-50">
                <DeckViewer deck={lesson.content} />
            </div>
        </main>
    );
}