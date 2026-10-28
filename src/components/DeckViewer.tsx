"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, ImageOff } from "lucide-react";

export default function DeckViewer({ deck }: { deck: any }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [imgError, setImgError] = useState(false);

    // 🛡️ BULLETPROOF SAFETY CHECK
    if (!deck || !deck.slides || !Array.isArray(deck.slides) || deck.slides.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-slate-100 text-slate-500 p-8 text-center">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-md">
                    <ImageOff className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Presentation Data Invalid</h3>
                    <p className="text-sm">The AI failed to return a valid slideshow. Please go back and try generating the presentation again.</p>
                </div>
            </div>
        );
    }

    // Reset image error when the slide changes
    useEffect(() => {
        setImgError(false);
    }, [currentSlide]);

    // ⌨️ Keyboard Navigation
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

    const slide = deck.slides[currentSlide] || {};
    const theme = deck.theme || { bg: "bg-slate-50", text: "text-slate-900", accent: "text-emerald-600", decoration: "none" };
    const layout = slide.layout || "left-image";

    // 🌐 SMART KEYWORD EXTRACTOR FOR REAL WEB IMAGES
    const rawText = (slide.imagePrompt || slide.heading || "education").toLowerCase();
    const cleanKeyword = rawText
        .replace(/(a|an|the|and|or|but|is|are|was|were|to|of|in|on|for|with|about|let's|learn|can|you|spot|it)/gi, "")
        .replace(/[^a-z0-9\s]/gi, "")
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .join(",");

    const realWebImageUrl = `https://loremflickr.com/800/600/${cleanKeyword || "education"}`;

    return (
        <div className={`relative w-full h-full overflow-hidden flex flex-col ${theme.bg} ${theme.text} transition-colors duration-500`}>

            {/* 🎈 Floating Decorations */}
            {theme.decoration === 'balloons' && (
                <div className="absolute inset-0 pointer-events-none opacity-40">
                    <div className="absolute top-[10%] left-[20%] text-6xl animate-[bounce_5s_infinite]">🎈</div>
                    <div className="absolute top-[30%] right-[15%] text-5xl animate-[bounce_4s_infinite] delay-700">🎈</div>
                    <div className="absolute bottom-[20%] left-[10%] text-7xl animate-[bounce_6s_infinite] delay-300">🎈</div>
                </div>
            )}

            {/* 🖥️ Slide Content */}
            <div className={`flex-1 flex flex-col md:flex-row items-center justify-center p-8 md:p-12 gap-8 md:gap-16 relative z-10 w-full max-w-7xl mx-auto ${layout === 'right-image' ? 'md:flex-row-reverse' : ''}`}>

                {/* Text Column */}
                <div className={`flex-1 w-full space-y-6 ${layout === 'centered' ? 'text-center' : ''}`}>
                    <h1 className={`text-5xl md:text-7xl font-extrabold ${theme.accent} leading-tight drop-shadow-sm capitalize`}>
                        {slide.heading || "Slide"}
                    </h1>
                    <ul className={`space-y-4 ${layout === 'centered' ? 'inline-block text-left' : ''}`}>
                        {(slide.bullets || []).map((b: string, i: number) => (
                            <li key={i} className="text-2xl md:text-3xl font-medium flex items-start gap-3">
                                <span className="mt-2.5 w-3 h-3 rounded-full bg-current opacity-50 shrink-0"></span>
                                <span>{b}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Image Column */}
                <div className="flex-1 w-full max-w-md">
                    {!imgError ? (
                        <img
                            key={currentSlide}
                            src={realWebImageUrl}
                            alt={slide.heading || "Presentation image"}
                            onError={() => setImgError(true)}
                            className="w-full rounded-3xl shadow-2xl object-cover aspect-video bg-slate-200 border-4 border-white"
                        />
                    ) : (
                        <div className="w-full rounded-3xl shadow-2xl aspect-video bg-gradient-to-br from-emerald-200 to-blue-200 flex flex-col items-center justify-center border-4 border-white">
                            <span className="text-6xl mb-4 opacity-50">📸</span>
                            <span className="text-xl font-bold opacity-50 text-center px-4">{slide.heading}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ⏮️ Navigation Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6 z-20">
                <button
                    onClick={() => setCurrentSlide((p) => Math.max(p - 1, 0))}
                    disabled={currentSlide === 0}
                    className="p-4 rounded-full bg-white/90 hover:bg-white shadow-xl text-slate-800 disabled:opacity-50 backdrop-blur transition-all active:scale-95"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <span className="font-bold text-lg bg-white/90 px-6 py-2.5 rounded-full shadow-md backdrop-blur text-slate-800">
                    {currentSlide + 1} / {deck.slides.length}
                </span>

                <button
                    onClick={() => setCurrentSlide((p) => Math.min(p + 1, deck.slides.length - 1))}
                    disabled={currentSlide === deck.slides.length - 1}
                    className="p-4 rounded-full bg-white/90 hover:bg-white shadow-xl text-slate-800 disabled:opacity-50 backdrop-blur transition-all active:scale-95"
                >
                    <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}