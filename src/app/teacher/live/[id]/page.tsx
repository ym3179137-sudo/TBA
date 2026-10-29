"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DeckViewer from "@/components/DeckViewer";
import { StopCircle, Loader2 } from "lucide-react";

export default function TeacherLivePresenter() {
    const router = useRouter();
    const params = useParams(); // Safely gets the ID
    const presentationId = params.id as string;

    const supabase = createClient();

    const [presentation, setPresentation] = useState<any>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Start live session on mount
    useEffect(() => {
        if (!presentationId) return;

        async function startLive() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/sign-in");
                return;
            }

            // 1. Fetch the presentation
            const { data: pres } = await supabase
                .from("presentations")
                .select("*")
                .eq("id", presentationId)
                .single();

            if (!pres) {
                router.push("/teacher/library");
                return;
            }

            setPresentation(pres);

            // 2. End any old active sessions for this teacher to prevent conflicts
            await supabase
                .from("live_sessions")
                .update({ is_active: false })
                .eq("teacher_id", user.id)
                .eq("is_active", true);

            // 3. Create the new live session
            const { data: session } = await supabase
                .from("live_sessions")
                .insert({
                    teacher_id: user.id,
                    presentation_id: pres.id,
                    is_active: true,
                    current_slide: 0
                })
                .select()
                .single();

            if (session) setSessionId(session.id);
            setLoading(false);
        }

        startLive();
    }, [presentationId, supabase, router]);

    // Update DB when slide changes
    const handleSlideChange = async (newSlide: number) => {
        setCurrentSlide(newSlide);
        if (sessionId) {
            await supabase
                .from("live_sessions")
                .update({ current_slide: newSlide })
                .eq("id", sessionId);
        }
    };

    const endLiveSession = async () => {
        if (sessionId) {
            await supabase
                .from("live_sessions")
                .update({ is_active: false })
                .eq("id", sessionId);
        }
        router.push("/teacher/library");
    };

    if (loading || !presentation) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin w-10 h-10 text-emerald-500 mb-4" />
                <p className="text-slate-400 font-bold">Starting Live Presentation...</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden">
            {/* Top Red Live Banner */}
            <div className="p-4 bg-red-600 text-white flex justify-between items-center z-50 shadow-lg shadow-red-900/20">
                <div className="flex items-center gap-3 font-bold text-lg">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    LIVE: {presentation.title}
                </div>
                <button
                    onClick={endLiveSession}
                    className="bg-black/30 hover:bg-black/50 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                    <StopCircle size={18} /> End Presentation
                </button>
            </div>

            {/* Presentation Area */}
            <div className="flex-1 overflow-hidden">
                <DeckViewer
                    deck={presentation.deck_data}
                    externalSlide={currentSlide}
                    onSlideChange={handleSlideChange}
                />
            </div>
        </div>
    );
}