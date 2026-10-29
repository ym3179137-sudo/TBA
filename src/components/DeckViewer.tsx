"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Loader2, ImageOff, PenTool, Trash2, X } from "lucide-react";

export default function DeckViewer({ deck }: { deck: any }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [imgLoading, setImgLoading] = useState(true);
    const [imgError, setImgError] = useState(false);

    // 🚨 Annotation States
    const [isAnnotating, setIsAnnotating] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        setImgLoading(true);
        setImgError(false);
    }, [currentSlide]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === " ") {
                e.preventDefault();
                setCurrentSlide((prev) => Math.min(prev + 1, deck.slides.length - 1));
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                setCurrentSlide((prev) => Math.max(prev - 1, 0));
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [deck.slides.length]);

    // Resize canvas
    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            if (canvas && canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, [isAnnotating, currentSlide]);

    const slide = deck.slides[currentSlide];
    const layout = slide.layout || "right-image";

    let imageUrl = slide.customImageUrl;
    if (!imageUrl) {
        const cleanPrompt = (slide.imagePrompt || slide.heading || "education")
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .trim()
            .split(/\s+/)
            .slice(0, 3)
            .join(",");
        imageUrl = `https://loremflickr.com/1024/768/${cleanPrompt}?lock=${currentSlide}`;
    }

    // 🚨 Drawing Logic
    const startDrawing = (e: React.MouseEvent) => {
        if (!isAnnotating) return;
        setIsDrawing(true);
        draw(e);
    };
    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || !isAnnotating || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.strokeStyle = "#ef4444"; // Red pen
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };
    const stopDrawing = () => {
        setIsDrawing(false);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) ctx.beginPath();
        }
    };
    const clearCanvas = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-slate-950">

            {/* Floating Annotation Toolbar */}
            <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-slate-700 shadow-xl">
                <button
                    onClick={() => setIsAnnotating(!isAnnotating)}
                    className={`p-2.5 rounded-xl transition-all ${isAnnotating ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    title="Toggle Pen"
                >
                    <PenTool size={20} />
                </button>
                {isAnnotating && (
                    <button onClick={clearCanvas} className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all" title="Clear Drawings">
                        <Trash2 size={20} />
                    </button>
                )}
            </div>

            <div className={`flex-1 flex flex-col md:flex-row items-center justify-center p-8 md:p-16 gap-12 transition-all duration-500 overflow-y-auto
                ${layout === 'right-image' ? 'md:flex-row' : layout === 'left-image' ? 'md:flex-row-reverse' : 'flex-col text-center'}`}
            >
                <div className={`flex-1 w-full space-y-6 ${layout === 'centered' ? 'max-w-3xl text-center' : ''}`}>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm mb-2">Slide {currentSlide + 1}</div>
                    <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg tracking-tight">{slide.heading}</h1>

                    <ul className={`space-y-4 ${layout === 'centered' ? 'inline-block text-left' : ''}`}>
                        {slide.bullets.map((b: string, i: number) => (
                            <li key={i} className="text-xl md:text-2xl font-medium text-slate-300 flex items-start gap-3">
                                <span className="mt-2 w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                                <span>{b}</span>
                            </li>
                        ))}
                    </ul>

                    {slide.teacherPrompt && (
                        <div className="mt-8 bg-indigo-500/10 border-l-4 border-indigo-500 p-4 rounded-r-xl">
                            <p className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-1">Teacher Prompt</p>
                            <p className="text-indigo-200 italic">"{slide.teacherPrompt}"</p>
                        </div>
                    )}
                </div>

                <div className={`flex-1 w-full max-w-lg relative ${layout === 'centered' ? 'mt-8' : ''}`}>
                    <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-900 group">

                        {imgLoading && !imgError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900">
                                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
                                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest animate-pulse">Loading...</p>
                            </div>
                        )}
                        {imgError ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-8 text-center">
                                <ImageOff className="w-12 h-12 text-indigo-400 mb-4 opacity-50" />
                                <p className="text-white font-bold text-2xl mb-2">{slide.heading}</p>
                            </div>
                        ) : (
                            <img
                                key={currentSlide}
                                src={imageUrl}
                                alt={slide.heading}
                                onLoad={() => setImgLoading(false)}
                                onError={() => { setImgLoading(false); setImgError(true); }}
                                className={`w-full h-full object-cover transition-all duration-700 ${imgLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Canvas Overlay for Annotations */}
            <canvas
                ref={canvasRef}
                className={`absolute inset-0 z-40 ${isAnnotating ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
            />

            {/* Navigation Bar */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-md border-t border-slate-800 flex justify-between items-center z-50">
                <div className="flex gap-2">
                    {deck.slides.map((_: any, i: number) => (
                        <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-700'}`} />
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => { setCurrentSlide((p) => Math.max(p - 1, 0)); clearCanvas(); }} disabled={currentSlide === 0} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 transition-all"><ArrowLeft className="w-5 h-5" /></button>
                    <span className="font-bold text-sm text-slate-400">{currentSlide + 1} / {deck.slides.length}</span>
                    <button onClick={() => { setCurrentSlide((p) => Math.min(p + 1, deck.slides.length - 1)); clearCanvas(); }} disabled={currentSlide === deck.slides.length - 1} className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 shadow-lg transition-all"><ArrowRight className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
}