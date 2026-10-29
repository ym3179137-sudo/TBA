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

    const [laserPos, setLaserPos] = useState({ x: 0, y: 0 });
    const [showLaser, setShowLaser] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const channelRef = useRef<any>(null);

    useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return "";
        };
        const studentId = getCookie("student_id");
        const studentName = decodeURIComponent(getCookie("student_name") || "Student");

        async function checkInitialSession() {
            const { data } = await supabase.from("live_sessions").select("*").eq("is_active", true).order('created_at', { ascending: false }).limit(1);
            if (data && data.length > 0) {
                const { data: pres } = await supabase.from("presentations").select("deck_data, title, file_url").eq("id", data[0].presentation_id).single();
                if (pres) {
                    setLiveData({ ...data[0], presentation: pres });
                    subscribeToChannel(data[0].id);

                    // 🚨 Log Attendance
                    if (studentId) {
                        await supabase.from("live_attendance").insert({
                            session_id: data[0].id,
                            student_id: studentId,
                            student_name: studentName
                        }).select();
                    }
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
                    if (pres) setLiveData({ ...session, presentation: pres });
                } else {
                    setLiveData(null);
                }
            }).subscribe();

        return () => {
            supabase.removeChannel(dbChannel);
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [supabase]);

    function subscribeToChannel(sessionId: string) {
        if (channelRef.current) supabase.removeChannel(channelRef.current);

        channelRef.current = supabase.channel(`live-room-${sessionId}`);

        channelRef.current
            .on('broadcast', { event: 'laser' }, (payload: any) => {
                setLaserPos({ x: payload.payload.x, y: payload.payload.y });
                setShowLaser(true);
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
            .subscribe();
    }

    useEffect(() => {
        if (showLaser) {
            const timer = setTimeout(() => setShowLaser(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [laserPos, showLaser]);

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

                    {showLaser && (
                        <div
                            className="absolute w-6 h-6 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-linear"
                            style={{ left: `${laserPos.x * 100}%`, top: `${laserPos.y * 100}%` }}
                        />
                    )}

                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 z-40 pointer-events-none"
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