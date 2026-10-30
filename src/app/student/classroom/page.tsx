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

    // Set exact canvas size to match the container
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                if (canvasRef.current) {
                    canvasRef.current.width = clientWidth;
                    canvasRef.current.height = clientHeight;
                }
                if (laserCanvasRef.current) {
                    laserCanvasRef.current.width = clientWidth;
                    laserCanvasRef.current.height = clientHeight;
                }
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [liveData, currentSlide]);

    // Laser fading effect
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
            // 🚨 Teacher changed the slide
            .on('broadcast', { event: 'slide_change' }, (payload: any) => {
                setCurrentSlide(payload.payload.slide);
                // Clear the drawing canvas when the slide changes
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx && canvasRef.current) {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            })
            // 🚨 Teacher moved the laser
            .on('broadcast', { event: 'laser' }, (payload: any) => {
                laserPoints.current.push({ x: payload.payload.x, y: payload.payload.y, life: 1.0 });
            })
            // 🚨 Teacher drew a line
            .on('broadcast', { event: 'draw' }, (payload: any) => {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx && canvasRef.current) {
                    ctx.lineTo(payload.payload.x * canvasRef.current.width, payload.payload.y * canvasRef.current.height);
                    ctx.strokeStyle = "#ef4444";
                    ctx.lineWidth = 4;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";
                    ctx.stroke();
                }
            })
            // 🚨 Teacher drew a dot
            .on('broadcast', { event: 'dot' }, (payload: any) => {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx && canvasRef.current) {
                    ctx.beginPath();
                    ctx.arc(payload.payload.x * canvasRef.current.width, payload.payload.y * canvasRef.current.height, 2, 0, Math.PI * 2);
                    ctx.fillStyle = "#ef4444";
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(payload.payload.x * canvasRef.current.width, payload.payload.y * canvasRef.current.height);
                }
            })
            // 🚨 Teacher typed text
            .on('broadcast', { event: 'text' }, (payload: any) => {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx && canvasRef.current) {
                    ctx.fillStyle = "#ef4444";
                    ctx.font = "bold 30px Arial";
                    ctx.fillText(payload.payload.text, payload.payload.x * canvasRef.current.width, payload.payload.y * canvasRef.current.height);
                }
            })
            // 🚨 Teacher cleared the canvas
            .on('broadcast', { event: 'clear' }, () => {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            })
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    await channelRef.current.track({ role: 'student', name: studentName });
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

                <div className="flex-1 overflow-hidden relative" ref={containerRef}>
                    {liveData.presentation.file_url ? (
                        <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(liveData.presentation.file_url)}`} className="w-full h-full border-none pointer-events-none" />
                    ) : (
                        <DeckViewer
                            key={currentSlide} // 🚨 Forces the DeckViewer to completely reload on slide change
                            deck={liveData.presentation.deck_data}
                            externalSlide={currentSlide}
                            onSlideChange={() => { }}
                            isStudentView={true}
                        />
                    )}

                    <canvas ref={canvasRef} className="absolute inset-0 z-40 pointer-events-none" />
                    <canvas ref={laserCanvasRef} className="absolute inset-0 z-50 pointer-events-none" />
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