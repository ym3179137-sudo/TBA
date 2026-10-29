"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import pptxgen from "pptxgenjs";
import {
    Sparkles, Presentation, MonitorPlay, LogOut, Video,
    FileText, Loader2, ArrowLeft, Download, Edit3, CheckCircle, ImageIcon
} from "lucide-react";
import DeckViewer from "@/components/DeckViewer";

export default function TeacherHub() {
    const router = useRouter();

    const [lessonText, setLessonText] = useState("");
    const [gradeLevel, setGradeLevel] = useState("KG1");
    const [curriculum, setCurriculum] = useState("General");
    const [style, setStyle] = useState("3D Pixar");

    const [loading, setLoading] = useState(false);
    const [deckData, setDeckData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [isExporting, setIsExporting] = useState(false);

    async function handleGenerate(e: React.FormEvent) {
        e.preventDefault();
        if (!lessonText) return setError("Please enter some lesson content.");

        setLoading(true);
        setError(null);
        setDeckData(null);
        setIsEditing(false);

        try {
            const res = await fetch("/api/ai/generate-presentation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lessonText, gradeLevel, curriculum, style }),
            });

            if (!res.ok) throw new Error("Failed to generate presentation");
            const data = await res.json();
            setDeckData(data.deck);
            setActiveSlideIndex(0);
        } catch (err: any) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    const updateSlide = (index: number, field: string, value: any) => {
        setDeckData((prev: any) => {
            const newDeck = { ...prev };
            newDeck.slides[index][field] = value;
            return newDeck;
        });
    };

    const handleExportPPTX = async () => {
        if (!deckData) return;
        setIsExporting(true);

        try {
            const pptx = new pptxgen();
            pptx.layout = "LAYOUT_16x9";

            deckData.slides.forEach((slide: any) => {
                const pptSlide = pptx.addSlide();

                pptSlide.addText(slide.heading || "Slide", {
                    x: 0.5, y: 0.5, w: "90%", h: 1,
                    fontSize: 36, bold: true, color: "363636"
                });

                const bulletPoints = slide.bullets.map((b: string) => ({ text: b, options: { bullet: true } }));
                pptSlide.addText(bulletPoints, {
                    x: 0.5, y: 1.5, w: "90%", h: 2,
                    fontSize: 24, color: "666666"
                });

                if (slide.teacherPrompt) {
                    pptSlide.addText(`Teacher Prompt: ${slide.teacherPrompt}`, {
                        x: 0.5, y: 4.5, w: "90%", h: 0.5,
                        fontSize: 14, italic: true, color: "888888"
                    });
                }
            });

            await pptx.writeFile({ fileName: `${deckData.title || "Presentation"}.pptx` });
        } catch (err) {
            console.error(err);
            alert("Failed to export PowerPoint file.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

            {/* LEFT SIDEBAR */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex">
                <div>
                    <div className="p-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Presentation className="text-white w-6 h-6" />
                        </div>
                        <span className="text-xl font-extrabold text-white tracking-tight">Teacher Hub</span>
                    </div>

                    <nav className="px-4 space-y-2 mt-4">
                        <Link href="/teacher" className="flex items-center gap-3 bg-emerald-500/10 text-emerald-400 font-bold px-4 py-3 rounded-xl border border-emerald-500/20">
                            <MonitorPlay size={20} /> AI Presentations
                        </Link>
                        <Link href="/teacher/assessments" className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 font-medium px-4 py-3 rounded-xl transition-all">
                            <FileText size={20} /> Assessments
                        </Link>
                    </nav>
                </div>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={() => router.push('/sign-in')} className="flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold px-4 py-3 rounded-xl transition-all w-full">
                        <LogOut size={20} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* MIDDLE COLUMN - CREATOR / EDITOR */}
            <main className="w-full md:w-[450px] bg-slate-900/50 border-r border-slate-800 flex flex-col overflow-y-auto relative z-10">

                {isEditing && deckData ? (
                    <div className="p-8 pb-24">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                                <Edit3 className="text-emerald-400" /> Slide Editor
                            </h1>
                            <button onClick={() => setIsEditing(false)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all">
                                <CheckCircle size={16} /> Save & Preview
                            </button>
                        </div>

                        {/* Slide Selector Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                            {deckData.slides.map((_: any, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveSlideIndex(i)}
                                    className={`shrink-0 w-12 h-12 rounded-xl font-bold flex items-center justify-center transition-all ${activeSlideIndex === i ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-5 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Slide Heading</label>
                                <input
                                    type="text"
                                    value={deckData.slides[activeSlideIndex].heading}
                                    onChange={(e) => updateSlide(activeSlideIndex, 'heading', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-emerald-500 transition-all font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Bullet Points (One per line)</label>
                                <textarea
                                    value={deckData.slides[activeSlideIndex].bullets.join('\n')}
                                    onChange={(e) => updateSlide(activeSlideIndex, 'bullets', e.target.value.split('\n'))}
                                    className="w-full h-32 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-emerald-500 transition-all text-sm resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <ImageIcon size={14} className="text-indigo-400" /> AI Image Prompt
                                </label>
                                <textarea
                                    value={deckData.slides[activeSlideIndex].imagePrompt || ""}
                                    onChange={(e) => updateSlide(activeSlideIndex, 'imagePrompt', e.target.value)}
                                    className="w-full h-20 bg-slate-900 border border-indigo-500/30 text-indigo-100 rounded-xl px-4 py-3 focus:border-indigo-500 transition-all text-sm resize-none"
                                    placeholder="Describe the image you want the AI to generate..."
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Changes will automatically regenerate the AI image in the preview.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Teacher Prompt</label>
                                <textarea
                                    value={deckData.slides[activeSlideIndex].teacherPrompt || ""}
                                    onChange={(e) => updateSlide(activeSlideIndex, 'teacherPrompt', e.target.value)}
                                    className="w-full h-20 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-emerald-500 transition-all text-sm resize-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleExportPPTX}
                            disabled={isExporting}
                            className="w-full mt-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                        >
                            {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
                            {isExporting ? "Exporting..." : "Download PowerPoint (.pptx)"}
                        </button>
                    </div>
                ) : (
                    <div className="p-8">
                        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white mb-6 transition-colors">
                            <ArrowLeft size={16} /> Back to Dashboard
                        </Link>

                        <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-2">
                            <Sparkles className="text-emerald-400 w-8 h-8" /> AI Designer
                        </h1>
                        <p className="text-slate-400 text-sm mb-8">Generate world-class presentations with AI images.</p>

                        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">{error}</div>}

                        <form onSubmit={handleGenerate} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Grade Level</label>
                                    <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer">
                                        <option value="Pre-K">Pre-K</option>
                                        <option value="KG1">KG1</option>
                                        <option value="KG2">KG2</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Visual Style</label>
                                    <select value={style} onChange={e => setStyle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer">
                                        <option value="3D Pixar">3D Pixar Animation</option>
                                        <option value="Watercolor">Soft Watercolor</option>
                                        <option value="Colorful Cartoon">Colorful Cartoon</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Lesson Content</label>
                                <textarea
                                    placeholder="Paste your lesson notes here..."
                                    value={lessonText}
                                    onChange={e => setLessonText(e.target.value)}
                                    required
                                    className="w-full h-48 bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all resize-none text-sm leading-relaxed"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-lg py-4 rounded-xl shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><Loader2 className="animate-spin w-5 h-5" /> Generating 8 Slides...</>
                                ) : (
                                    <><Sparkles className="w-5 h-5" /> Generate Presentation</>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </main>

            {/* RIGHT COLUMN - PREVIEW */}
            <section className="flex-1 relative bg-slate-950 hidden lg:flex items-center justify-center p-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center text-emerald-500 animate-pulse">
                        <MonitorPlay size={64} className="mb-4 opacity-50" />
                        <p className="text-xl font-bold">AI is designing your 8 slides...</p>
                        <p className="text-sm text-slate-500 mt-2">Generating images and layout...</p>
                    </div>
                ) : deckData ? (
                    <div className="w-full h-full max-w-6xl rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800 flex flex-col relative bg-slate-900">

                        {/* Floating Edit Button on Preview */}
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="absolute top-6 right-6 z-50 bg-indigo-600/90 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl border border-indigo-400/30 shadow-xl shadow-indigo-500/20 font-bold text-sm flex items-center gap-2 transition-all backdrop-blur-md"
                        >
                            <Edit3 size={16} /> {isEditing ? "Close Editor" : "Edit Slides"}
                        </button>

                        <DeckViewer deck={deckData} />
                    </div>
                ) : (
                    <div className="text-center text-slate-600">
                        <MonitorPlay size={80} className="mx-auto mb-6 opacity-20" />
                        <h2 className="text-2xl font-bold text-slate-500">Presentation Preview</h2>
                        <p className="text-slate-600 mt-2 max-w-sm mx-auto">Type your lesson notes and generate a stunning 8-slide presentation with AI images.</p>
                    </div>
                )}
            </section>
        </div>
    );
}