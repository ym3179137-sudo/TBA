"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DeckViewer from "@/components/DeckViewer";
import { StopCircle, Loader2, MousePointer2, PenTool, Highlighter, Trash2, Type, Users, ChevronLeft, ChevronRight } from "lucide-react";

export default function TeacherLivePresenter() {
    const router = useRouter();
    const params = useParams();
    const presentationId = params?.id as string;
    const supabase = useMemo(() => createClient(), []);

    const [presentation, setPresentation] = useState<any>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [tool, setTool] = useState<'none' | 'laser' | 'pen' | 'highlighter' | 'text'>('pen');
    const [color, setColor] = useState("#ef4444"); // Default Red
    const [isDrawing, setIsDrawing] = useState(false);
    const [attendance, setAttendance] = useState<any[]>([]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const laserCanvasRef = useRef<HTMLCanvasElement>(null);
    const channelRef = useRef<any>(null);

    const prevPointRef = useRef<{ x: number, y: number } | null>(null);

    // 🚨 NEW: Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                handleSlideChange(Math.min(currentSlide + 1, (presentation?.deck_data?.slides?.length || 1) - 1));
            } else if (e.key === 'ArrowLeft') {
                handleSlideChange(Math.max(currentSlide - 1, 0));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide, presentation]);

    useEffect(() => {
        const updateSize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            if (canvasRef.current) {
                canvasRef.current.width = w;
                canvasRef.current.height = h;
            }
            if (laserCanvasRef.current) {
                laserCanvasRef.current.width = w;
                laserCanvasRef.current.height = h;
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [presentation]);

    // Laser fade effect
    useEffect(() => {
        let animationFrameId: number;
        const fade = () => {
            const canvas = laserCanvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
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
        if (!presentationId) return;

        async function startLive() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return router.push("/sign-in");

            const { data: pres } = await supabase.from("presentations").select("*").eq("id", presentationId).single();
            if (!pres) return router.push("/teacher/library");

            if (pres.file_url) {
                alert("⚠️ Slide sync and drawing do NOT work with uploaded PowerPoint files.");
                router.push("/teacher/library");
                return;
            }

            setPresentation(pres);

            await supabase.from("live_sessions").update({ is_active: false }).eq("teacher_id", user.id).eq("is_active", true);

            const { data: session } = await supabase.from("live_sessions").insert({
                teacher_id: user.id, presentation_id: pres.id, is_active: true, current_slide: 0
            }).select().single();

            if (session) {
                setSessionId(session.id);
                channelRef.current = supabase.channel(`live-room-${session.id}`, {
                    config: { presence: { key: user.id } }
                });

                channelRef.current
                    .on('presence', { event: 'sync' }, () => {
                        const state = channelRef.current.presenceState();
                        const users = Object.values(state).flat();
                        const students = users.filter((u: any) => u.role === 'student');
                        setAttendance(students);
                    })
                    .subscribe((status: string) => { console.log('Status:', status); });
            }
            setLoading(false);
        }
        startLive();

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [presentationId, supabase, router]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;

        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        if (tool === 'laser') {
            drawLaser(e.clientX, e.clientY);
            channelRef.current?.send({ type: 'broadcast', event: 'laser', payload: { x, y, color } });
        }
        if ((tool === 'pen' || tool === 'highlighter') && isDrawing) {
            drawPen(e);
        }
    };

    const drawLaser = (x: number, y: number) => {
        const canvas = laserCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
    };

    const startDraw = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;

        if (tool === 'pen' || tool === 'highlighter') {
            setIsDrawing(true);
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.arc(e.clientX, e.clientY, tool === 'highlighter' ? 10 : 3, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = tool === 'highlighter' ? 0.3 : 1.0;
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }

            const normX = e.clientX / window.innerWidth;
            const normY = e.clientY / window.innerHeight;
            prevPointRef.current = { x: normX, y: normY };
            channelRef.current?.send({ type: 'broadcast', event: 'dot', payload: { x: normX, y: normY, color, tool } });
        }
        if (tool === 'text') {
            const text = prompt("Enter text to display:");
            if (text) {
                const canvas = canvasRef.current;
                if (!canvas) return;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = color;
                    ctx.font = "bold 40px Arial";
                    ctx.fillText(text, e.clientX, e.clientY);
                }

                const normX = e.clientX / window.innerWidth;
                const normY = e.clientY / window.innerHeight;
                channelRef.current?.send({ type: 'broadcast', event: 'text', payload: { x: normX, y: normY, text, color } });
            }
        }
    };

    const drawPen = (e: React.MouseEvent) => {
        if (!isDrawing || !canvasRef.current || !prevPointRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const x = e.clientX;
        const y = e.clientY;

        const normX = x / window.innerWidth;
        const normY = y / window.innerHeight;

        ctx.lineTo(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = tool === 'highlighter' ? 20 : 5;
        ctx.globalAlpha = tool === 'highlighter' ? 0.3 : 1.0;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'draw',
                payload: { x: normX, y: normY, prevX: prevPointRef.current.x, prevY: prevPointRef.current.y, color, tool }
            });
        }

        prevPointRef.current = { x: normX, y: normY };
    };

    const stopDraw = () => {
        setIsDrawing(false);
        prevPointRef.current = null;
    };

    const clearCanvas = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        channelRef.current?.send({ type: 'broadcast', event: 'clear' });
    };

    const handleSlideChange = async (newSlide: number) => {
        setCurrentSlide(newSlide);
        clearCanvas();
        if (sessionId) await supabase.from("live_sessions").update({ current_slide: newSlide }).eq("id", sessionId);
        channelRef.current?.send({ type: 'broadcast', event: 'slide_change', payload: { slide: newSlide } });
    };

    const endLiveSession = async () => {
        if (sessionId) await supabase.from("live_sessions").update({ is_active: false }).eq("id", sessionId);
        router.push("/teacher/library");
    };

    if (loading || !presentation) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
    }

    const totalSlides = presentation.deck_data?.slides?.length || 1;
    const colors = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7"]; // Red, Blue, Green, Yellow, Purple

    return (
        <div
            className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden relative select-none"
            onMouseMove={handleMouseMove}
            onMouseDown={startDraw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
        >
            <div className="p-4 bg-red-600 text-white flex justify-between items-center relative z-[100]">
                <div className="flex items-center gap-3 font-bold text-lg">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></span><span className="relative rounded-full h-3 w-3 bg-white"></span></span>
                    LIVE: {presentation.title}
                </div>

                <div className="flex gap-2 bg-black/30 p-2 rounded-xl items-center">
                    <button onClick={() => setTool('none')} className={`p-2 rounded-lg ${tool === 'none' ? 'bg-white text-black' : 'hover:bg-white/20'}`}><MousePointer2 size={20} /></button>
                    <button onClick={() => setTool('laser')} className={`p-2 rounded-lg ${tool === 'laser' ? 'bg-red-500 text-white' : 'hover:bg-white/20'}`}><div className="w-5 h-5 rounded-full animate-pulse" style={{ backgroundColor: color }} /></button>
                    <button onClick={() => setTool('pen')} className={`p-2 rounded-lg ${tool === 'pen' ? 'bg-white text-black' : 'hover:bg-white/20'}`}><PenTool size={20} /></button>
                    <button onClick={() => setTool('highlighter')} className={`p-2 rounded-lg ${tool === 'highlighter' ? 'bg-white text-black' : 'hover:bg-white/20'}`}><Highlighter size={20} /></button>
                    <button onClick={() => setTool('text')} className={`p-2 rounded-lg ${tool === 'text' ? 'bg-white text-black' : 'hover:bg-white/20'}`}><Type size={20} /></button>

                    {/* Color Picker */}
                    <div className="flex gap-1 ml-2 pl-2 border-l border-white/20">
                        {colors.map(c => (
                            <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
                        ))}
                    </div>

                    <div className="w-px h-6 bg-white/20 mx-1"></div>
                    <button onClick={clearCanvas} className="p-2 rounded-lg hover:bg-white/20 text-red-200"><Trash2 size={20} /></button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-black/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                        <Users size={16} /> {attendance.length} Joined
                    </div>
                    <button onClick={endLiveSession} className="bg-black/30 hover:bg-black/50 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                        <StopCircle size={18} /> End
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <DeckViewer deck={presentation.deck_data} externalSlide={currentSlide} />

                <canvas
                    ref={canvasRef}
                    className={`absolute inset-0 z-40 ${tool === 'pen' || tool === 'highlighter' || tool === 'text' ? 'cursor-crosshair' : 'pointer-events-none'}`}
                />
                <canvas
                    ref={laserCanvasRef}
                    className={`absolute inset-0 z-50 ${tool === 'laser' ? 'cursor-crosshair' : 'pointer-events-none'}`}
                />

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-6 bg-black/80 backdrop-blur-xl px-6 py-3 rounded-full border-2 border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                    <button
                        onClick={() => handleSlideChange(Math.max(currentSlide - 1, 0))}
                        disabled={currentSlide === 0}
                        className="p-2 text-white hover:bg-white/20 rounded-full disabled:opacity-30 transition-all active:scale-90"
                    >
                        <ChevronLeft size={32} />
                    </button>

                    <span className="text-white font-bold text-sm tracking-widest min-w-[60px] text-center">
                        {currentSlide + 1} / {totalSlides}
                    </span>

                    <button
                        onClick={() => handleSlideChange(Math.min(currentSlide + 1, totalSlides - 1))}
                        disabled={currentSlide === totalSlides - 1}
                        className="p-2 text-white hover:bg-white/20 rounded-full disabled:opacity-30 transition-all active:scale-90"
                    >
                        <ChevronRight size={32} />
                    </button>
                </div>
            </div>
        </div>
    );
}