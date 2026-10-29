"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DeckViewer from "@/components/DeckViewer";
import { ArrowLeft, Video, Loader2 } from "lucide-react";

export default function StudentClassroom() {
    const supabase = useMemo(() => createClient(), []);
    const [loading, setLoading] = useState(true);
    const [liveData, setLiveData] = useState<any>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const laserCanvasRef = useRef<HTMLCanvasElement>(null);
    const channelRef = useRef<any>(null);

    // 🚨 Laser Fading Effect Loop
    useEffect(() => {
        let animationFrameId: number;
        const fade = () => {
            const canvas = laserCanvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Fade speed
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.globalCompositeOperation = 'source-over';
                }
            }
            animationFrameId = requestAnimationFrame(fade);
        };
        fade();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return "";
        };
        const studentId = getCookie("student_id") || "";
        const studentName = decodeURIComponent(getCookie("student_name") || "Student");

        async function checkInitialSession() {
            const { data } = await supabase.from("live_sessions").select("*").eq("is_active", true).order('created_at', { ascending: false }).limit(1);
            if (data && data.length > 0) {
                const { data: pres } = await supabase.from("presentations").select("deck_data, title, file_url").eq("id", data[0].presentation_id).single();
                if (pres) {
                    setLiveData({ ...data[0], presentation: pres });
                    subscribeToChannel(data[0].id, studentId, studentName);
                }
            }
            setLoading(false);
        }
        checkInitialSession();

        const dbChannel = supabase.channel('live-db-changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_sessions' }, async (payload) => {
                const session = payload.new as any;
                if (session.is_active) {
                    const { data: pres } = await supabase.from("presentations").select("deck_data, title, file_url").eq("id", session.presentation_id).single();
                    if (pres) {
                        setLiveData({ ...session, presentation: pres });
                        if (!channelRef.current) subscribeToChannel(session.id, studentId, studentName);
                    }
                } else {
                    setLiveData(null);
                    if (channelRef.current) {
                        supabase.removeChannel(channelRef.current);
                        channelRef.current = null;
                    }
                }
            }).subscribe();

        return () => {
            supabase.removeChannel(dbChannel);
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [supabase]);

    const drawLaser = (x: number, y: number) => {
        const canvas = laserCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.arc(x * canvas.width, y * canvas.height, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ef4444';
        ctx.fill();
        ctx.shadowBlur = 0;
    };

    function subscribeToChannel(sessionId: string, studentId: string, studentName: string) {
        if (channelRef.current) supabase.removeChannel(channelRef.current);

        channelRef.current = supabase.channel(`live-room-${sessionId}`, {
            config: { presence: { key: studentId } }
        });

        channelRef.current
            .on('presence', { event: 'sync' }, () => { })
            .on('broadcast', { event: 'laser' }, (payload: any) => {
                drawLaser(payload.payload.x, payload.payload.y);
            })
            .on('broadcast', { event: 'dot' }, (payload: any) => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                const rect = canvas.getBoundingClientRect();
                ctx.beginPath();
                ctx.arc(payload.payload.x * rect.width, payload.payload.y * rect.height, 2, 0, Math.PI * 2);
                ctx.fillStyle = "#ef4444";
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(payload.payload.x * rect.width, payload.payload.y * rect.height);
            })
            .on('broadcast', { event: 'draw' }, (payload: any) => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                const rect = canvas.getBoundingClientRect();

                ctx.lineTo(payload.payload.x * rect.width, payload.payload.y * rect.height);
                ctx.strokeStyle = "#ef4444";
                ctx.lineWidth = 4;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.stroke();
            })
            .on('broadcast', { event: 'text' }, (payload: any) => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                const rect = canvas.getBoundingClientRect();
                ctx.fillStyle = "#ef4444";
                ctx.font = "30px Arial";
                ctx.fillText(payload.payload.text, payload.payload.x * rect.width, payload.payload.y * rect.height);
            })
            .on('broadcast', { event: 'clear' }, () => {
                const canvas = canvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            })
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    await channelRef.current.track({
                        role: 'student',
                        name: studentName,
                        joined_at: new Date().toISOString()
                    });
                }
            });
    }

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    if (liveData) {
        return (
            <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden relative">
                <div className="p-4 bg-emerald-600 text-white flex justify-between items-center z-50">
                    <div className="flex items-center gap-3 font-bold text-lg">
                        <span className="relative flex h-3 w-3"><span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></span><span className="relative rounded-full h-3 w-3 bg-white"></span></span>
                        LIVE CLASS: {liveData.presentation.title}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    {liveData.presentation.file_url ? (
                        <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(liveData.presentation.file_url)}`} className="w-full h-full border-none pointer-events-none" />
                    ) : (
                        <DeckViewer
                            deck={liveData.presentation.deck_data}
                            externalSlide={liveData.current_slide}
                            onSlideChange={() => { }}
                            isStudentView={true}
                        />
                    )}

                    {/* Annotation Canvas */}
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 z-40 pointer-events-none"
                        width={window.innerWidth}
                        height={window.innerHeight}
                    />

                    {/* 🚨 Laser Canvas */}
                    <canvas
                        ref={laserCanvasRef}
                        className="absolute inset-0 z-50 pointer-events-none"
                        width={window.innerWidth}
                        height={window.innerHeight}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center p-8 font-sans">
            <div className="w-full max-w-4xl">
                <Link href="/student" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 font-bold">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>
                <h1 className="text-4xl font-extrabold text-white mb-8">Live Classroom</h1>

                <div className="bg-slate-900 border border-slate-800 p-16 rounded-3xl text-center shadow-2xl">
                    <Video className="w-20 h-20 text-blue-500 mx-auto mb-6 opacity-50" />
                    <h2 className="text-3xl font-bold text-white mb-4">Class is not in session</h2>
                    <p className="text-slate-400 text-lg max-w-md mx-auto">
                        Wait for your teacher to start the live presentation.
                    </p>
                </div>
            </div>
        </div>
    );
}