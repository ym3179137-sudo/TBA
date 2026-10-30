"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DeckViewer from "@/components/DeckViewer";
import { StopCircle, Loader2, MousePointer2, PenTool, Trash2, Type, Users, CheckCircle, XCircle, ArrowLeft, ArrowRight } from "lucide-react";

export default function TeacherLivePresenter() {
    const router = useRouter();
    const params = useParams();
    const presentationId = params?.id as string;
    const supabase = useMemo(() => createClient(), []);

    const [presentation, setPresentation] = useState<any>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [tool, setTool] = useState<'none' | 'laser' | 'pen' | 'text'>('pen');
    const [isDrawing, setIsDrawing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const laserCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<any>(null);

    const [attendance, setAttendance] = useState<any[]>([]);
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [showEndModal, setShowEndModal] = useState(false);
    const [excusedIds, setExcusedIds] = useState<string[]>([]);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                if (canvasRef.current) { canvasRef.current.width = clientWidth; canvasRef.current.height = clientHeight; }
                if (laserCanvasRef.current) { laserCanvasRef.current.width = clientWidth; laserCanvasRef.current.height = clientHeight; }
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [loading]);

    const laserPoints = useRef<{ x: number; y: number; life: number }[]>([]);
    useEffect(() => {
        let animationFrameId: number;
        const render = () => {
            const canvas = laserCanvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    laserPoints.current.forEach((p) => {
                        p.life -= 0.03;
                        if (p.life > 0) {
                            ctx.beginPath();
                            ctx.arc(p.x * canvas.width, p.y * canvas.height, 6, 0, Math.PI * 2);
                            ctx.fillStyle = `rgba(239, 68, 68, ${p.life})`;
                            ctx.shadowBlur = 15;
                            ctx.shadowColor = '#ef4444';
                            ctx.fill();
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
        if (!presentationId) return;

        async function startLive() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return router.push("/sign-in");

            const { data: pres } = await supabase.from("presentations").select("*").eq("id", presentationId).single();
            if (!pres) return router.push("/teacher/library");
            setPresentation(pres);

            const { data: studentsData } = await supabase.from("children").select("id, full_name").eq("teacher_id", user.id);
            if (studentsData) setAllStudents(studentsData);

            await supabase.from("live_sessions").update({ is_active: false }).eq("teacher_id", user.id).eq("is_active", true);

            const { data: session } = await supabase.from("live_sessions").insert({
                teacher_id: user.id, presentation_id: pres.id, is_active: true, current_slide: 0
            }).select().single();

            if (session) {
                setSessionId(session.id);

                channelRef.current = supabase.channel(`live-room-${session.id}`, {
                    config: { presence: { key: `teacher-${user.id}` } }
                });

                channelRef.current
                    .on('presence', { event: 'sync' }, () => {
                        const state = channelRef.current.presenceState();
                        const users = Object.values(state).flat();
                        const students = users.filter((u: any) => u.role === 'student');
                        setAttendance(students);
                    })
                    .subscribe(async (status: string) => {
                        if (status === 'SUBSCRIBED') {
                            await channelRef.current.track({ role: 'teacher', name: 'Teacher' });
                        }
                    });
            }
            setLoading(false);
        }
        startLive();

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [presentationId, supabase, router]);

    const handleSlideChange = async (newSlide: number) => {
        if (!presentation.deck_data) return;
        const maxSlides = presentation.deck_data.slides.length;
        const target = Math.max(0, Math.min(newSlide, maxSlides - 1));

        setCurrentSlide(target);
        clearCanvas();

        // 1. Update DB first (Guaranteed sync)
        if (sessionId) await supabase.from("live_sessions").update({ current_slide: target }).eq("id", sessionId);

        // 2. Broadcast to WebSocket (Instant UI update)
        channelRef.current?.send({
            type: 'broadcast',
            event: 'slide_change',
            payload: { slide: target }
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        if (tool === 'laser') {
            laserPoints.current.push({ x, y, life: 1.0 });
            channelRef.current?.send({ type: 'broadcast', event: 'laser', payload: { x, y } });
        }
        if (tool === 'pen' && isDrawing) {
            drawPen(e, rect);
        }
    };

    const startDraw = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (tool === 'pen') {
            setIsDrawing(true);
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fillStyle = "#ef4444";
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(x, y);
            }
            channelRef.current?.send({ type: 'broadcast', event: 'dot', payload: { x: x / rect.width, y: y / rect.height } });
        }
        if (tool === 'text') {
            const text = prompt("Enter text to display:");
            if (text) {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = "#ef4444";
                    ctx.font = "bold 30px Arial";
                    ctx.fillText(text, x, y);
                }
                channelRef.current?.send({ type: 'broadcast', event: 'text', payload: { x: x / rect.width, y: y / rect.height, text } });
            }
        }
    };

    const drawPen = (e: React.MouseEvent, rect: DOMRect) => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        channelRef.current?.send({ type: 'broadcast', event: 'draw', payload: { x: x / rect.width, y: y / rect.height } });
    };

    const stopDraw = () => setIsDrawing(false);

    const clearCanvas = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        channelRef.current?.send({ type: 'broadcast', event: 'clear' });
    };

    const endLiveSession = async () => {
        if (!sessionId) return;

        const presentIds = attendance.map((a: any) => a.key);
        const records = allStudents.map(s => ({
            session_id: sessionId,
            student_id: s.id,
            student_name: s.full_name,
            is_present: presentIds.includes(s.id),
            is_excused: excusedIds.includes(s.id)
        }));

        await supabase.from("live_attendance").insert(records);
        await supabase.from("live_sessions").update({ is_active: false }).eq("id", sessionId);
        router.push("/teacher/library");
    };

    if (loading || !presentation) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
    }

    const absentStudents = allStudents.filter(s => !attendance.some((a: any) => a.key === s.id));

    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden relative select-none">
            <div className="p-4 bg-red-600 text-white flex justify-between items-center z-50">
                <div className="flex items-center gap-3 font-bold text-lg">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></span><span className="relative rounded-full h-3 w-3 bg-white"></span></span>
                    LIVE: {presentation.title}
                </div>

                <div className="flex items-center gap-4">
                    {!presentation.file_url && presentation.deck_data?.slides && (
                        <div className="flex gap-2 bg-black/30 p-2 rounded-xl">
                            <button onClick={() => handleSlideChange(currentSlide - 1)} disabled={currentSlide === 0} className="p-2 rounded-lg hover:bg-white/20 disabled:opacity-30"><ArrowLeft size={20} /></button>
                            <span className="font-bold text-sm flex items-center px-2">{currentSlide + 1} / {presentation.deck_data.slides.length}</span>
                            <button onClick={() => handleSlideChange(currentSlide + 1)} disabled={currentSlide === presentation.deck_data.slides.length - 1} className="p-2 rounded-lg hover:bg-white/20 disabled:opacity-30"><ArrowRight size={20} /></button>
                        </div>
                    )}

                    <div className="flex gap-2 bg-black/30 p-2 rounded-xl">
                        <button onClick={() => setTool('none')} className={`p-2 rounded-lg ${tool === 'none' ? 'bg-white text-black' : 'hover:bg-white/20'}`}><MousePointer2 size={20} /></button>
                        <button onClick={() => setTool('laser')} className={`p-2 rounded-lg ${tool === 'laser' ? 'bg-red-500 text-white' : 'hover:bg-white/20'}`}><div className="w-5 h-5 bg-red-400 rounded-full animate-pulse" /></button>
                        <button onClick={() => setTool('pen')} className={`p-2 rounded-lg ${tool === 'pen' ? 'bg-white text-black' : 'hover:bg-white/20'}`}><PenTool size={20} /></button>
                        <button onClick={() => setTool('text')} className={`p-2 rounded-lg ${tool === 'text' ? 'bg-white text-black' : 'hover:bg-white/20'}`}><Type size={20} /></button>
                        <button onClick={clearCanvas} className="p-2 rounded-lg hover:bg-white/20 text-red-200"><Trash2 size={20} /></button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-black/30 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                        <Users size={16} /> {attendance.length} Joined
                    </div>
                    <button onClick={() => setShowEndModal(true)} className="bg-black/30 hover:bg-black/50 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                        <StopCircle size={18} /> End
                    </button>
                </div>
            </div>

            <div
                className="flex-1 overflow-hidden relative"
                onMouseMove={handleMouseMove}
                onMouseDown={startDraw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                ref={containerRef}
            >
                {presentation.file_url ? (
                    <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(presentation.file_url)}`} className={`w-full h-full border-none ${tool === 'none' ? 'pointer-events-auto' : 'pointer-events-none'}`} />
                ) : (
                    <DeckViewer deck={presentation.deck_data} externalSlide={currentSlide} onSlideChange={handleSlideChange} />
                )}

                <canvas ref={canvasRef} className="absolute inset-0 z-40 pointer-events-none" />
                <canvas ref={laserCanvasRef} className="absolute inset-0 z-50 pointer-events-none" />
            </div>

            {showEndModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl p-8">
                        <h2 className="text-3xl font-extrabold text-white mb-2">End Live Session</h2>
                        <p className="text-slate-400 mb-6">Review attendance.</p>

                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4">
                                <h3 className="text-emerald-400 font-bold flex items-center gap-2 mb-4"><CheckCircle size={18} /> Attended ({attendance.length})</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {attendance.map((a: any) => (
                                        <div key={a.key} className="bg-slate-950 p-2 rounded-lg text-sm text-slate-300">{a.name}</div>
                                    ))}
                                    {attendance.length === 0 && <p className="text-slate-500 text-sm">No one joined.</p>}
                                </div>
                            </div>

                            <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-4">
                                <h3 className="text-red-400 font-bold flex items-center gap-2 mb-4"><XCircle size={18} /> Absent ({absentStudents.length})</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {absentStudents.map((s: any) => (
                                        <label key={s.id} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg text-sm text-slate-300 cursor-pointer">
                                            <span>{s.full_name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500">Excuse?</span>
                                                <input
                                                    type="checkbox"
                                                    checked={excusedIds.includes(s.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setExcusedIds(prev => [...prev, s.id]);
                                                        else setExcusedIds(prev => prev.filter(id => id !== s.id));
                                                    }}
                                                    className="w-4 h-4 accent-emerald-500"
                                                />
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowEndModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                                Cancel
                            </button>
                            <button onClick={endLiveSession} className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all">
                                End & Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}