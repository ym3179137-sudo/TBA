"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Loader2, ImageOff } from "lucide-react";

export default function DeckViewer({ deck }: { deck: any }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [imgLoading, setImgLoading] = useState(true);
    const [imgError, setImgError] = useState(false);

    // Reset states when slide changes
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

    const slide = deck.slides[currentSlide];
    const layout = slide.layout || "right-image";

    // 🚨 Clean the prompt: remove commas and weird characters so the URL doesn't break
    const cleanPrompt = (slide.imagePrompt || slide.heading || "cute cartoon education")
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .substring(0, 150);

    // 🚨 The AI Image URL
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1024&height=768&nologo=true&seed=${currentSlide}`;

    return (
        <div className="relative w-full h-full flex flex-col bg-slate-950">

            {/* Slide Container */}
            <div className={`flex-1 flex flex-col md:flex-row items-center justify-center p-8 md:p-16 gap-12 transition-all duration-500 overflow-y-auto
                ${layout === 'right-image' ? 'md:flex-row' : layout === 'left-image' ? 'md:flex-row-reverse' : 'flex-col text-center'}`}
            >

                {/* Text Column */}
                <div className={`flex-1 w-full space-y-6 ${layout === 'centered' ? 'max-w-3xl text-center' : ''}`}>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm mb-2">
                        Slide {currentSlide + 1}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg tracking-tight">
                        {slide.heading}
                    </h1>

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

                {/* Image Column */}
                <div className={`flex-1 w-full max-w-lg relative ${layout === 'centered' ? 'mt-8' : ''}`}>
                    <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-900 group">

                        {/* AI Image Loading Spinner */}
                        {imgLoading && !imgError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900">
                                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
                                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest animate-pulse">Painting your image...</p>
                            </div>
                        )}

                        {/* If the image fails to load, show a nice text box instead of a broken icon */}
                        {imgError ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900 p-8 text-center">
                                <ImageOff className="w-12 h-12 text-indigo-400 mb-4 opacity-50" />
                                <p className="text-white font-bold text-xl">{slide.heading}</p>
                                <p className="text-slate-400 mt-2 text-sm">AI image is currently busy. Try generating again in a minute!</p>
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

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="p-6 bg-slate-900/50 backdrop-blur-md border-t border-slate-800 flex justify-between items-center">
                <div className="flex gap-2">
                    {deck.slides.map((_: any, i: number) => (
                        <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-700'}`} />
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setCurrentSlide((p) => Math.max(p - 1, 0))}
                        disabled={currentSlide === 0}
                        className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-sm text-slate-400">
                        {currentSlide + 1} / {deck.slides.length}
                    </span>
                    <button
                        onClick={() => setCurrentSlide((p) => Math.min(p + 1, deck.slides.length - 1))}
                        disabled={currentSlide === deck.slides.length - 1}
                        className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}