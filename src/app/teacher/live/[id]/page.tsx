"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DeckViewer from "@/components/DeckViewer";
import { StopCircle, Loader2, MousePointer2, PenTool, Trash2, Type, Users } from "lucide-react";

export default function TeacherLivePresenter() {
    const router = useRouter();
    const params = useParams();
    const presentationId = params?.id as string;
    const supabase = useMemo(() => createClient(), []);

    const [presentation, setPresentation] = useState<any>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Tools & Drawing State
    const [tool, setTool] = useState<'none' | 'laser' | 'pen' | 'text'>('pen');
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const channelRef = useRef<any>(null);

    // Attendance State
    const [attendance, setAttendance] = useState<any[]>([]);

    useEffect(() => {
        if (!presentationId) return;

        async function startLive() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return router.push("/sign-in");

            const { data: pres } = await supabase.from("presentations").select("*").eq("id", presentationId).single();
            if (!pres) return router.push("/teacher/library");
            setPresentation(pres);

            await supabase.from("live_sessions").update({ is_active: false }).eq("teacher_id", user.id).eq("is_active", true);

            const { data: session } = await supabase.from("live_sessions").insert({
                teacher_id: user.id, presentation_id: pres.id, is_active: true, current_slide: 0
            }).select().single();

            if (session) {
                setSessionId(session.id);
                channelRef.current = supabase.channel(`live-room-${session.id}`);
                channelRef.current.subscribe();

                // Listen for Attendance
                const attendChannel = supabase.channel(`attendance-${session.id}`)
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_attendance', filter: `session_id=eq.${session.id}` }, (payload) => {
                        setAttendance(prev => [...prev, payload.new]);
                    }).subscribe();

                // Fetch initial attendance
                const { data: initialAttend } = await supabase.from("live_attendance").select("*").eq("session_id", session.id);
                if (initialAttend) setAttendance(initialAttend);
            }
            setLoading(false);
        }
        startLive();

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [presentationId, supabase, router]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        if (tool === 'laser' && channelRef.current) {
            channelRef.current.send({ type: 'broadcast', event: 'laser', payload: { x, y } });
        }
        if (tool === 'pen' && isDrawing) {
            draw(e);
        }
    };

    const startDraw = (e: React.MouseEvent) => {
        if (tool === 'pen' || tool === 'laser') {
            setIsDrawing(true);
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (tool === 'pen') {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2); // Draw a dot on click
                    ctx.fillStyle = "#ef4444";
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                }
                channelRef.current?.send({ type: 'broadcast', event: 'dot', payload: { x: x / rect.width, y: y / rect.height } });
            }
        }
        if (tool === 'text') {
            const text = prompt("Enter text to display:");
            if (text) {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = "#ef4444";
                    ctx.font = "30px Arial";
                    ctx.fillText(text, x * rect.width, y * rect.height);
                }
                channelRef.current?.send({ type: 'broadcast', event: 'text', payload: { x, y, text } });
            }
        }
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        if (channelRef.current) {
            channelRef.current.send({ type: 'broadcast', event: 'draw', payload: { x: x / rect.width, y: y / rect.height } });
        }
    };

    const stopDraw = () => setIsDrawing(false);

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
    };

    const endLiveSession = async () => {
        if (sessionId) await supabase.from("live_sessions").update({ is_active: false }).eq("id", sessionId);
        router.push("/teacher/library");
    };

    if (loading || !presentation) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div
            className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden relative select-none"
            onMouseMove={handleMouseMove}
            onMouseDown={startDraw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
        >
            {/* Top Bar */}
            <div className="p-4 bg-red-600 text-white flex justify-between items-center z-50">
                <div className="flex items-center gap-3 font-bold text-lg">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></span><span className="relative rounded-full h-3 w-3 bg-white"></span></span>
                    LIVE: {presentation.title}
                </div>

                {/* Toolbar */}
                <div className="flex gap-2 bg-black/30 p-2 rounded-xl">
                    <button onClick={() => setTool('none')} className={`p-2 rounded-lg ${tool === 'none' ? 'bg-white text-black' : 'hover:bg-white/20'}`}><MousePointer2 size={20} /></button>
                    <button onClick={() => setTool('laser')} className={`p-2 rounded-lg ${tool === 'laser' ? 'bg-red-500 text-white' : 'hover:bg-white/20'}`}><div className="w-5 h-5 bg-red-400 rounded-full animate-pulse" /></button>
                    <button onClick={() => setTool('pen')} className={`p-2 rounded-lg ${tool === 'pen' ? 'bg-white text-black' : 'hover:bg-white/20'}`}><PenTool size={20} /></button>
                    <button onClick={() => setTool('text')} className={`p-2 rounded-lg ${tool === 'text' ? 'bg-white text-black' : 'hover:bg-white/20'}`}><Type size={20} /></button>
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
                {presentation.file_url ? (
                    <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(presentation.file_url)}`} className="w-full h-full border-none pointer-events-none" />
                ) : (
                    <DeckViewer deck={presentation.deck_data} externalSlide={currentSlide} onSlideChange={handleSlideChange} />
                )}

                <canvas
                    ref={canvasRef}
                    className={`absolute inset-0 z-40 ${tool !== 'none' ? 'cursor-crosshair' : 'pointer-events-none'}`}
                    width={window.innerWidth}
                    height={window.innerHeight}
                />
            </div>
        </div>
    );
}