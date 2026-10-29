"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import pptxgen from "pptxgenjs";
import {
    Sparkles, Presentation, MonitorPlay, LogOut,
    FileText, Loader2, ArrowLeft, Download, Edit3,
    CheckCircle, Link as LinkIcon, Send, Users, X,
    Gamepad2 // 🚨 Added Gamepad2 icon for the Arena
} from "lucide-react";
import DeckViewer from "@/components/DeckViewer";
import { createClient } from "@/lib/supabase/client";

export default function TeacherHub() {
    const router = useRouter();
    const supabase = createClient();

    // Form States
    const [lessonText, setLessonText] = useState("");
    const [gradeLevel, setGradeLevel] = useState("KG1");
    const [curriculum, setCurriculum] = useState("General");
    const [style, setStyle] = useState("3D Pixar");

    // App States
    const [loading, setLoading] = useState(false);
    const [deckData, setDeckData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Edit & Export States
    const [isEditing, setIsEditing] = useState(false);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [isExporting, setIsExporting] = useState(false);

    // Publish States
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [targetType, setTargetType] = useState<'grade' | 'student'>('grade');
    const [targetValue, setTargetValue] = useState("KG1");
    const [studentsList, setStudentsList] = useState<{ id: string, full_name: string }[]>([]);
    const [isPublishing, setIsPublishing] = useState(false);

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
                pptSlide.addText(slide.heading || "Slide", { x: 0.5, y: 0.5, w: "90%", h: 1, fontSize: 36, bold: true, color: "363636" });
                const bulletPoints = slide.bullets.map((b: string) => ({ text: b, options: { bullet: true } }));
                pptSlide.addText(bulletPoints, { x: 0.5, y: 1.5, w: "90%", h: 2, fontSize: 24, color: "666666" });
                if (slide.teacherPrompt) {
                    pptSlide.addText(`Teacher Prompt: ${slide.teacherPrompt}`, { x: 0.5, y: 4.5, w: "90%", h: 0.5, fontSize: 14, italic: true, color: "888888" });
                }
            });

            await pptx.writeFile({ fileName: `${deckData.title || "Presentation"}.pptx` });
        } catch (err) {
            alert("Failed to export PowerPoint file.");
        } finally {
            setIsExporting(false);
        }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert("You must be logged in.");
            setIsPublishing(false);
            return;
        }

        const { error } = await supabase.from('presentations').insert({
            teacher_id: user.id,
            title: deckData.title || "Untitled Lesson",
            deck_data: deckData,
            target_type: targetType,
            target_value: targetValue
        });

        setIsPublishing(false);

        if (error) {
            alert("Failed to publish: " + error.message);
        } else {
            setIsPublishModalOpen(false);
            alert("✅ Presentation published successfully!");
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

            {/* SIDEBAR */}
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

                        {/* 🚨 GAME LINK ADDED BACK HERE */}
                        <Link href="/teacher/arena" className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 font-medium px-4 py-3 rounded-xl transition-all">
                            <Gamepad2 size={20} /> TBA Arena (Game)
                        </Link>

                        <Link href="/teacher/library" className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 font-medium px-4 py-3 rounded-xl transition-all">
                            <Users size={20} /> My Library
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
                                <CheckCircle size={16} /> Done
                            </button>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                            {deckData.slides.map((_: any, i: number) => (
                                <button key={i} onClick={() => setActiveSlideIndex(i)} className={`shrink-0 w-12 h-12 rounded-xl font-bold flex items-center justify-center transition-all ${activeSlideIndex === i ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-5 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Slide Heading</label>
                                <input type="text" value={deckData.slides[activeSlideIndex].heading} onChange={(e) => updateSlide(activeSlideIndex, 'heading', e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-emerald-500 font-bold" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Bullet Points</label>
                                <textarea value={deckData.slides[activeSlideIndex].bullets.join('\n')} onChange={(e) => updateSlide(activeSlideIndex, 'bullets', e.target.value.split('\n'))} className="w-full h-32 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-emerald-500 text-sm resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-2"><LinkIcon size={14} className="text-blue-400" /> Custom Image URL</label>
                                <input type="text" value={deckData.slides[activeSlideIndex].customImageUrl || ""} onChange={(e) => updateSlide(activeSlideIndex, 'customImageUrl', e.target.value)} className="w-full bg-slate-900 border border-blue-500/30 text-blue-100 rounded-xl px-4 py-3 focus:border-blue-500 text-sm" placeholder="Paste image link here..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Teacher Prompt</label>
                                <textarea value={deckData.slides[activeSlideIndex].teacherPrompt || ""} onChange={(e) => updateSlide(activeSlideIndex, 'teacherPrompt', e.target.value)} className="w-full h-20 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-emerald-500 text-sm resize-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <button onClick={handleExportPPTX} disabled={isExporting} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                                {isExporting ? <Loader2 className="animate-spin" /> : <Download size={18} />} PPTX
                            </button>
                            <button onClick={() => setIsPublishModalOpen(true)} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2">
                                <Send size={18} /> Publish
                            </button>
                        </div>
                    </div>
                ) : (
                    // CREATOR FORM
                    <div className="p-8">
                        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white mb-6">
                            <ArrowLeft size={16} /> Back
                        </Link>
                        <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-2"><Sparkles className="text-emerald-400 w-8 h-8" /> AI Designer</h1>
                        <p className="text-slate-400 text-sm mb-8">Generate slides and publish them to students.</p>

                        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">{error}</div>}

                        <form onSubmit={handleGenerate} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500">
                                    <option value="Pre-K">Pre-K</option>
                                    <option value="KG1">KG1</option>
                                    <option value="KG2">KG2</option>
                                </select>
                                <select value={curriculum} onChange={e => setCurriculum(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500">
                                    <option value="General">General</option>
                                    <option value="Montessori">Montessori</option>
                                </select>
                            </div>
                            <textarea placeholder="Paste your lesson notes here..." value={lessonText} onChange={e => setLessonText(e.target.value)} required className="w-full h-48 bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 resize-none text-sm outline-none focus:border-emerald-500" />
                            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-extrabold text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                                {loading ? <><Loader2 className="animate-spin w-5 h-5" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate Presentation</>}
                            </button>
                        </form>
                    </div>
                )}
            </main>

            {/* PREVIEW AREA */}
            <section className="flex-1 relative bg-slate-950 hidden lg:flex items-center justify-center p-8">
                {loading ? (
                    <div className="text-emerald-500 animate-pulse font-bold text-xl flex flex-col items-center">
                        <Loader2 className="animate-spin w-10 h-10 mb-4" />
                        AI is designing your slides...
                    </div>
                ) : deckData ? (
                    <div className="w-full h-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative bg-slate-900">
                        <button onClick={() => setIsEditing(!isEditing)} className="absolute top-6 right-6 z-50 bg-indigo-600/90 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2">
                            <Edit3 size={16} /> {isEditing ? "Close Editor" : "Edit Slides"}
                        </button>
                        <DeckViewer deck={deckData} />
                    </div>
                ) : (
                    <div className="text-center text-slate-600">
                        <MonitorPlay size={80} className="mx-auto mb-6 opacity-20" />
                        <h2 className="text-2xl font-bold text-slate-500">Preview</h2>
                        <p className="text-slate-500 mt-2 max-w-sm">Your presentation will appear here.</p>
                    </div>
                )}
            </section>

            {/* 🚨 PUBLISH MODAL */}
            {isPublishModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl p-8 relative">
                        <button onClick={() => setIsPublishModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24} /></button>
                        <h2 className="text-2xl font-extrabold text-white mb-6 flex items-center gap-2"><Send className="text-emerald-400" /> Publish Lesson</h2>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Send To:</label>
                                <select value={targetType} onChange={(e: any) => setTargetType(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3">
                                    <option value="grade">A Specific Grade</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Select Grade:</label>
                                <select value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3">
                                    <option value="Pre-K">Pre-K</option>
                                    <option value="KG1">KG1</option>
                                    <option value="KG2">KG2</option>
                                </select>
                            </div>
                        </div>

                        <button onClick={handlePublish} disabled={isPublishing} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                            {isPublishing ? <Loader2 className="animate-spin" /> : <Users size={20} />}
                            {isPublishing ? "Publishing..." : "Send to Students"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}