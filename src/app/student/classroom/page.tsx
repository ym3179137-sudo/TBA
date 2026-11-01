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
    const [currentSlide, setCurrentSlide] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const laserCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<any>(null);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                if (canvasRef.current && canvasRef.current.width !== clientWidth) {
                    canvasRef.current.width = clientWidth;
                    canvasRef.current.height = clientHeight;
                }
                if (laserCanvasRef.current && laserCanvasRef.current.width !== clientWidth) {
                    laserCanvasRef.current.width = clientWidth;
                    laserCanvasRef.current.height = clientHeight;
                }
            }
        };
        updateSize();
        const timeoutId = setTimeout(updateSize, 200);
        const observer = new ResizeObserver(updateSize);
        if (containerRef.current) observer.observe(containerRef.current);
        return () => { clearTimeout(timeoutId); observer.disconnect(); };
    }, [liveData]);

    const laserPoints = useRef<{ x: number; y: number; life: number; color: string }[]>([]);
    useEffect(() => {
        let animationFrameId: number;
        const render = () => {
            const canvas = laserCanvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    laserPoints.current.forEach((p) => {
                        p.life -= 0.05; // Faster fade
                        if (p.life > 0) {
                            ctx.beginPath();
                            ctx.arc(p.x * canvas.width, p.y * canvas.height, 8, 0, Math.PI * 2);
                            ctx.fillStyle = p.color;
                            ctx.globalAlpha = p.life;
                            ctx.shadowBlur = 15;
                            ctx.shadowColor = p.color;
                            ctx.fill();
                            ctx.globalAlpha = 1.0;
                        }
                    });
                    ctx.shadowBlur = 0;
                    laserPoints.current = laserPoints.current.filter(p => p.life > 0);
                }
            }
            animationFrameId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    useEffect(() => {
        const getStudentData = () => {
            let id = localStorage.getItem("tba_student_id");
            if (!id) {
                id = `guest-${Math.random().toString(36).slice(2, 8)}`;
                localStorage.setItem("tba_student_id", id);
            }
            let name = localStorage.getItem("tba_student_name") || "Student";
            return { id, name: decodeURIComponent(name) };
        };
        const { id: studentId, name: studentName } = getStudentData();

        async function checkInitialSession() {
            const { data } = await supabase.from("live_sessions").select("*").eq("is_active", true).order('created_at', { ascending: false }).limit(1);
            if (data && data.length > 0) {
                const { data: pres } = await supabase.from("presentations").select("deck_data, title, file_url").eq("id", data[0].presentation_id).single();
                if (pres) {
                    setLiveData({ ...data[0], presentation: pres });
                    setCurrentSlide(data[0].current_slide || 0);
                    subscribeToChannel(data[0].id, studentId, studentName);
                }
            }
            setLoading(false);
        }
        checkInitialSession();

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [supabase]);

    function subscribeToChannel(sessionId: string, studentId: string, studentName: string) {
        if (channelRef.current) supabase.removeChannel(channelRef.current);

        channelRef.current = supabase.channel(`live-room-${sessionId}`, {
            config: { presence: { key: studentId } }
        });

        channelRef.current
            .on('broadcast', { event: 'slide_change' }, (payload: any) => {
                setCurrentSlide(payload.payload.slide);
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            })
            .on('broadcast', { event: 'laser' }, (payload: any) => {
                laserPoints.current.push({ x: payload.payload.x, y: payload.payload.y, life: 1.0, color: payload.payload.color || "#ef4444" });
            })
            .on('broadcast', { event: 'draw' }, (payload: any) => {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx && canvasRef.current) {
                    const { x, y, prevX, prevY, color } = payload.payload;
                    ctx.beginPath();
                    ctx.moveTo(prevX * canvasRef.current.width, prevY * canvasRef.current.height);
                    ctx.lineTo(x * canvasRef.current.width, y * canvasRef.current.height);
                    ctx.strokeStyle = color || "#ef4444";
                    ctx.lineWidth = 4;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";
                    ctx.stroke();
                }
            })
            .on('broadcast', { event: 'dot' }, (payload: any) => {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx && canvasRef.current) {
                    const { x, y, color } = payload.payload;
                    ctx.beginPath();
                    ctx.arc(x * canvasRef.current.width, y * canvasRef.current.height, 2, 0, Math.PI * 2);
                    ctx.fillStyle = color || "#ef4444";
                    ctx.fill();
                }
            })
            .on('broadcast', { event: 'text' }, (payload: any) => {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx && canvasRef.current) {
                    const { text, x, y, color } = payload.payload;
                    ctx.fillStyle = color || "#ef4444";
                    ctx.font = "bold 40px Arial";
                    ctx.fillText(text, x * canvasRef.current.width, y * canvasRef.current.height);
                }
            })
            .on('broadcast', { event: 'clear' }, () => {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            })
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') await channelRef.current.track({ role: 'student', name: studentName });
            });
    }

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    if (liveData) {
        return (
            <div className="h-screen w-screen bg-black flex flex-col overflow-hidden relative">
                <div className="absolute top-4 left-4 z-50 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></span><span className="relative rounded-full h-3 w-3 bg-white"></span></span>
                    LIVE: {liveData.presentation.title}
                </div>
                <div className="flex-1 overflow-hidden relative" ref={containerRef}>
                    <DeckViewer deck={liveData.presentation.deck_data} externalSlide={currentSlide} />
                    <canvas ref={canvasRef} className="absolute inset-0 z-40 pointer-events-none w-full h-full" />
                    <canvas ref={laserCanvasRef} className="absolute inset-0 z-50 pointer-events-none w-full h-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center p-8 font-sans">
            <div className="w-full max-w-4xl mt-20">
                <div className="bg-slate-900 border border-slate-800 p-16 rounded-3xl text-center shadow-2xl">
                    <Video className="w-20 h-20 text-blue-500 mx-auto mb-6 opacity-50" />
                    <h2 className="text-3xl font-bold text-white mb-4">Class is not in session</h2>
                    <p className="text-slate-400 text-lg max-w-md mx-auto mb-8">Wait for your teacher to start the live presentation.</p>
                    <Link href="/student" className="inline-flex items-center gap-2 bg-slate-800 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-700 transition-all">
                        <ArrowLeft size={20} /> Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}