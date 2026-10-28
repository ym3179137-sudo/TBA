"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function DeckViewer({ deck }: { deck: any }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [imgError, setImgError] = useState(false);

    // Reset image error when slide changes
    useEffect(() => {
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
    const theme = deck.theme || { bg: "bg-slate-50", text: "text-slate-900", accent: "text-emerald-600", decoration: "none" };
    const layout = slide.layout || "left-image";

    // 🧠 SMART KEYWORD EXTRACTOR
    // We strip out boring words (like, the, and, is) to get a perfect 2-3 word search query
    const rawText = (slide.imagePrompt || slide.heading || "education").toLowerCase();
    const cleanKeyword = rawText
        .replace(/(a|an|the|and|or|but|is|are|was|were|to|of|in|on|for|with|about|let's|learn|can|you|spot|it)/gi, "")
        .replace(/[^a-z0-9\s]/gi, "")
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .join(",");

    // 🌐 FETCH REAL WEB IMAGES (Not AI generated)
    const realWebImageUrl = `https://loremflickr.com/800/600/${cleanKeyword || "education"}`;

    return (
        <div className={`relative w-full h-full overflow-hidden flex flex-col ${theme.bg} ${theme.text} transition-colors duration-500`}>

            {/* 🎈 Decorations */}
            {theme.decoration === 'balloons' && (
                <div className="absolute inset-0 pointer-events-none opacity-40">
                    <div className="absolute top-[10%] left-[20%] text-6xl animate-[bounce_5s_infinite]">🎈</div>
                    <div className="absolute top-[30%] right-[15%] text-5xl animate-[bounce_4s_infinite] delay-700">🎈</div>
                    <div className="absolute bottom-[20%] left-[10%] text-7xl animate-[bounce_6s_infinite] delay-300">🎈</div>
                </div>
            )}
            {theme.decoration === 'stars' && (
                <div className="absolute inset-0 pointer-events-none opacity-40">
                    <div className="absolute top-[10%] left-[20%] text-4xl animate-pulse">⭐</div>
                    <div className="absolute top-[30%] right-[15%] text-5xl animate-pulse delay-700">⭐</div>
                    <div className="absolute bottom-[20%] left-[10%] text-4xl animate-pulse delay-300">⭐</div>
                </div>
            )}

            {/* Slide Content */}
            <div className={`flex-1 flex flex-col md:flex-row items-center justify-center p-8 md:p-12 gap-8 md:gap-16 relative z-10 w-full max-w-7xl mx-auto ${layout === 'right-image' ? 'md:flex-row-reverse' : ''}`}>

                {/* Text Column */}
                <div className={`flex-1 w-full space-y-6 ${layout === 'centered' ? 'text-center' : ''}`}>
                    <h1 className={`text-5xl md:text-7xl font-extrabold ${theme.accent} leading-tight drop-shadow-sm capitalize`}>
                        {slide.heading}
                    </h1>
                    <ul className={`space-y-4 ${layout === 'centered' ? 'inline-block text-left' : ''}`}>
                        {slide.bullets.map((b: string, i: number) => (
                            <li key={i} className="text-2xl md:text-3xl font-medium flex items-start gap-3">
                                <span className="mt-2.5 w-3 h-3 rounded-full bg-current opacity-50 shrink-0"></span>
                                {b}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Image Column - Pulling Real Photos from the Web */}
                <div className="flex-1 w-full max-w-md">
                    {!imgError ? (
                        <img
                            key={currentSlide}
                            src={realWebImageUrl}
                            alt={slide.heading}
                            onError={() => setImgError(true)}
                            className="w-full rounded-3xl shadow-2xl object-cover aspect-video bg-slate-200"
                        />
                    ) : (
                        // Beautiful Fallback if the web image fails to load
                        <div className="w-full rounded-3xl shadow-2xl aspect-video bg-gradient-to-br from-emerald-200 to-blue-200 flex flex-col items-center justify-center border-4 border-white">
                            <span className="text-6xl mb-4 opacity-50">📸</span>
                            <span className="text-xl font-bold opacity-50 text-center px-4">{slide.heading}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6 z-20">
                <button
                    onClick={() => setCurrentSlide((p) => Math.max(p - 1, 0))}
                    disabled={currentSlide === 0}
                    className="p-4 rounded-full bg-white/80 hover:bg-white shadow-lg text-slate-800 disabled:opacity-50 backdrop-blur transition-all"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <span className="font-bold text-lg bg-white/80 px-4 py-2 rounded-full shadow-sm backdrop-blur">
                    {currentSlide + 1} / {deck.slides.length}
                </span>
                <button
                    onClick={() => setCurrentSlide((p) => Math.min(p + 1, deck.slides.length - 1))}
                    disabled={currentSlide === deck.slides.length - 1}
                    className="p-4 rounded-full bg-white/80 hover:bg-white shadow-lg text-slate-800 disabled:opacity-50 backdrop-blur transition-all"
                >
                    <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}