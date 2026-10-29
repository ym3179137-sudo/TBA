"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import pptxgen from "pptxgenjs"; // 🚨 Import PPTXGenJS
import {
    Sparkles, Presentation, MonitorPlay, LogOut, UploadCloud,
    Users, Video, FileText, Settings, Loader2, ArrowLeft,
    Download, Edit3, Save, CheckCircle
} from "lucide-react";
import DeckViewer from "@/components/DeckViewer";

export default function TeacherHub() {
    const router = useRouter();

    // Form States
    const [lessonText, setLessonText] = useState("");
    const [gradeLevel, setGradeLevel] = useState("KG1");
    const [curriculum, setCurriculum] = useState("General");
    const [style, setStyle] = useState("3D Pixar");

    // App States
    const [loading, setLoading] = useState(false);
    const [deckData, setDeckData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // 🚨 Edit & Export States
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

    // 🚨 UPDATE SLIDE DATA FUNCTION
    const updateSlide = (index: number, field: string, value: any) => {
        setDeckData((prev: any) => {
            const newDeck = { ...prev };
            newDeck.slides[index][field] = value;
            return newDeck;
        });
    };

    // 🚨 EXPORT TO PPTX FUNCTION
    const handleExportPPTX = async () => {
        if (!deckData) return;
        setIsExporting(true);

        try {
            const pptx = new pptxgen();
            pptx.layout = "LAYOUT_16x9";

            deckData.slides.forEach((slide: any) => {
                const pptSlide = pptx.addSlide();

                // Add Heading
                pptSlide.addText(slide.heading || "Slide", {
                    x: 0.5, y: 0.5, w: "90%", h: 1,
                    fontSize: 32, bold: true, color: "363636"
                });

                // Add Bullets
                const bulletPoints = slide.bullets.map((b: string) => ({ text: b, options: { bullet: true } }));
                pptSlide.addText(bulletPoints, {
                    x: 0.5, y: 1.5, w: "90%", h: 2,
                    fontSize: 24, color: "666666"
                });

                // Add Teacher Prompt (styled like a note)
                if (slide.teacherPrompt) {
                    pptSlide.addText(`Teacher Prompt: ${slide.teacherPrompt}`, {
                        x: 0.5, y: 4.5, w: "90%", h: 0.5,
                        fontSize: 14, italic: true, color: "888888"
                    });
                }
            });

            await pptx.writeFile({ fileName: `${deckData.title || "Presentation"}.pptx` });
        } catch (err) {
            console.error("Failed to export PPTX", err);
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
                        <Link href="/teacher/arena" className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 font-medium px-4 py-3 rounded-xl transition-all">
                            <Video size={20} /> TBA Arena
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
                    // 🚨 EDIT MODE UI
                    <div className="p-8 pb-24">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                                <Edit3 className="text-emerald-400" /> Edit Slides
                            </h1>
                            <button onClick={() => setIsEditing(false)} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
                                <CheckCircle size={16} /> Done
                            </button>
                        </div>

                        {/* Slide Selector Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                            {deckData.slides.map((_: any, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveSlideIndex(i)}
                                    className={`shrink-0 w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all ${activeSlideIndex === i ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        {/* Editing Form for Active Slide */}
                        <div className="space-y-5 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Slide Heading</label>
                                <input
                                    type="text"
                                    value={deckData.slides[activeSlideIndex].heading}
                                    onChange={(e) => updateSlide(activeSlideIndex, 'heading', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 transition-all font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Bullet Points (One per line)</label>
                                <textarea
                                    value={deckData.slides[activeSlideIndex].bullets.join('\n')}
                                    onChange={(e) => updateSlide(activeSlideIndex, 'bullets', e.target.value.split('\n'))}
                                    className="w-full h-32 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 transition-all text-sm resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Teacher Prompt (Action/Question)</label>
                                <textarea
                                    value={deckData.slides[activeSlideIndex].teacherPrompt || ""}
                                    onChange={(e) => updateSlide(activeSlideIndex, 'teacherPrompt', e.target.value)}
                                    className="w-full h-20 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-emerald-500 transition-all text-sm resize-none"
                                />
                            </div>
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={handleExportPPTX}
                            disabled={isExporting}
                            className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
                            {isExporting ? "Exporting..." : "Download PowerPoint (.pptx)"}
                        </button>
                    </div>
                ) : (
                    // 🚨 CREATOR MODE UI
                    <div className="p-8">
                        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white mb-6 transition-colors">
                            <ArrowLeft size={16} /> Back to Dashboard
                        </Link>

                        <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-2">
                            <Sparkles className="text-emerald-400 w-8 h-8" /> AI Designer
                        </h1>
                        <p className="text-slate-400 text-sm mb-8">Generate world-class presentations in seconds.</p>

                        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">{error}</div>}

                        <form onSubmit={handleGenerate} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Grade Level</label>
                                    <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer">
                                        <option value="Pre-K">Pre-K</option>
                                        <option value="KG1">KG1</option>
                                        <option value="KG2">KG2</option>
                                        <option value="Grade 1">Grade 1</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Curriculum</label>
                                    <select value={curriculum} onChange={e => setCurriculum(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer">
                                        <option value="General">General</option>
                                        <option value="Montessori">Montessori</option>
                                        <option value="British Curriculum">British</option>
                                        <option value="American Curriculum">American</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Visual Style</label>
                                <select value={style} onChange={e => setStyle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer">
                                    <option value="3D Pixar">3D Pixar Animation</option>
                                    <option value="Watercolor">Soft Watercolor</option>
                                    <option value="Colorful Cartoon">Colorful Cartoon</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Lesson Content</label>
                                <textarea
                                    placeholder="Paste your lesson notes, vocabulary words, or a numbered list here..."
                                    value={lessonText}
                                    onChange={e => setLessonText(e.target.value)}
                                    required
                                    className="w-full h-40 bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all resize-none text-sm leading-relaxed"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-lg py-4 rounded-xl shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><Loader2 className="animate-spin w-5 h-5" /> Generating Magic...</>
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
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center text-emerald-500 animate-pulse">
                        <MonitorPlay size={64} className="mb-4 opacity-50" />
                        <p className="text-xl font-bold">AI is designing your slides...</p>
                    </div>
                ) : deckData ? (
                    <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col relative">

                        {/* Floating Edit Button on Preview */}
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="absolute top-4 right-4 z-50 bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 text-white px-4 py-2 rounded-xl border border-slate-700 shadow-xl font-bold text-sm flex items-center gap-2 transition-all"
                        >
                            <Edit3 size={16} /> {isEditing ? "Preview Mode" : "Edit Slides"}
                        </button>

                        <DeckViewer deck={deckData} />
                    </div>
                ) : (
                    <div className="text-center text-slate-600">
                        <MonitorPlay size={80} className="mx-auto mb-6 opacity-20" />
                        <h2 className="text-2xl font-bold text-slate-500">Presentation Preview</h2>
                        <p className="text-slate-600 mt-2 max-w-sm mx-auto">Fill out the lesson content and let the AI build a world-class presentation.</p>
                    </div>
                )}
            </section>
        </div>
    );
}