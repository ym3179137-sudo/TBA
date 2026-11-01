"use client";

import { useState, useEffect } from "react";
import { Loader2, ImageOff } from "lucide-react";

export default function DeckViewer({ deck, externalSlide }: any) {
    const [currentSlide, setCurrentSlide] = useState(externalSlide || 0);
    const [imgLoading, setImgLoading] = useState(true);
    const [imgError, setImgError] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (externalSlide !== undefined && externalSlide !== currentSlide) {
            setCurrentSlide(externalSlide);
        }
    }, [externalSlide]);

    const slide = deck?.slides?.[currentSlide];

    // 🚨 INSTANT IMAGE CACHING
    useEffect(() => {
        if (!slide) return;
        setImgLoading(true);
        setImgError(false);

        // 1. Check if image is already baked into the presentation
        if (slide.savedImage) {
            setImageUrl(slide.savedImage);
            setImgLoading(false);
            return;
        }

        // 2. Check LocalStorage Cache
        const cleanPrompt = (slide.imagePrompt || slide.heading || "cute cartoon education")
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .substring(0, 100);
        const cacheKey = `tba_img_${currentSlide}_${cleanPrompt.replace(/\s/g, '_')}`;

        const cachedImg = localStorage.getItem(cacheKey);
        if (cachedImg) {
            setImageUrl(cachedImg);
            setImgLoading(false);
            return;
        }

        // 3. Fetch from AI and cache it
        const fetchUrl = `/api/generate-image?prompt=${encodeURIComponent(cleanPrompt)}&seed=${currentSlide}`;
        fetch(fetchUrl)
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    localStorage.setItem(cacheKey, base64data);
                    setImageUrl(base64data);
                    setImgLoading(false);
                };
                reader.readAsDataURL(blob);
            })
            .catch(() => {
                setImgError(true);
                setImgLoading(false);
            });
    }, [currentSlide, slide]);

    if (!slide) return null;
    const layout = slide.layout || "right-image";

    return (
        <div className="relative w-full h-full flex flex-col bg-slate-950">
            <div className={`flex-1 flex flex-col md:flex-row items-center justify-center p-8 md:p-16 gap-12 transition-all duration-500 overflow-y-auto
                ${layout === 'right-image' ? 'md:flex-row' : layout === 'left-image' ? 'md:flex-row-reverse' : 'flex-col text-center'}`}
            >
                <div className={`flex-1 w-full space-y-6 ${layout === 'centered' ? 'max-w-3xl text-center' : ''}`}>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm mb-2">
                        Slide {currentSlide + 1}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg tracking-tight">
                        {slide.heading}
                    </h1>

                    <ul className={`space-y-4 ${layout === 'centered' ? 'inline-block text-left' : ''}`}>
                        {slide.bullets?.map((b: string, i: number) => (
                            <li key={i} className="text-xl md:text-2xl font-medium text-slate-300 flex items-start gap-3">
                                <span className="mt-2 w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                                <span>{b}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={`flex-1 w-full max-w-lg relative ${layout === 'centered' ? 'mt-8' : ''}`}>
                    <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-900 group">
                        {imgLoading && !imgError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900">
                                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
                                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest animate-pulse">Loading Image...</p>
                            </div>
                        )}

                        {imgError ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-8 text-center">
                                <ImageOff className="w-12 h-12 text-indigo-400 mb-4 opacity-50" />
                                <p className="text-white font-bold text-2xl mb-2">{slide.heading}</p>
                                <p className="text-slate-400 text-sm max-w-xs">The AI image failed to load.</p>
                            </div>
                        ) : (
                            imageUrl && (
                                <img
                                    key={currentSlide}
                                    src={imageUrl}
                                    alt={slide.heading}
                                    className={`w-full h-full object-cover transition-all duration-700 ${imgLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
                                />
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}