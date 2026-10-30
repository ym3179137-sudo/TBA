"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import pptxgen from "pptxgenjs";
import {
    Sparkles, Presentation, MonitorPlay, LogOut,
    FileText, Loader2, ArrowLeft, Download, Edit3,
    CheckCircle, Link as LinkIcon, Send, Users, X, Gamepad2
} from "lucide-react";
import DeckViewer from "@/components/DeckViewer";
import { createClient } from "@/lib/supabase/client";

export default function TeacherHub() {
    const router = useRouter();
    const supabase = createClient();

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
        if (!user) return setIsPublishing(false);

        const { error } = await supabase.from('presentations').insert({
            teacher_id: user.id,
            title: deckData.title || "Untitled Lesson",
            deck_data: deckData,
            target_type: targetType,
            target_value: targetValue
        });

        setIsPublishing(false);
        if (error) alert("Failed to publish: " + error.message);
        else {
            setIsPublishModalOpen(false);
            alert("✅ Presentation published successfully!");
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">

            {/* MOBILE NAV / DESKTOP SIDEBAR */}
            <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0">
                <div>
                    <div className="p-4 flex items-center justify-between md:justify-start gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                <Presentation className="text-white w-6 h-6" />
                            </div>
                            <span className="text-xl font-extrabold text-white">Teacher Hub</span>
                        </div>
                    </div>

                    <nav className="px-4 pb-4 md:pb-0 flex md:flex-col gap-2 overflow-x-auto hide-scrollbar">
                        <Link href="/teacher" className="flex items-center gap-3 bg-emerald-500/10 text-emerald-400 font-bold px-4 py-3 rounded-xl border border-emerald-500/20 whitespace-nowrap">
                            <MonitorPlay size={20} /> AI Designer
                        </Link>
                        <Link href="/teacher/assessments" className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 font-medium px-4 py-3 rounded-xl transition-all whitespace-nowrap">
                            <FileText size={20} /> Assessments
                        </Link>
                        <Link href="/teacher/arena" className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 font-medium px-4 py-3 rounded-xl transition-all whitespace-nowrap">
                            <Gamepad2 size={20} /> TBA Arena
                        </Link>
                        <Link href="/teacher/library" className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 font-medium px-4 py-3 rounded-xl transition-all whitespace-nowrap">
                            <Users size={20} /> Library
                        </Link>
                    </nav>
                </div>
                <div className="hidden md:block p-4 border-t border-slate-800">
                    <button onClick={() => router.push('/sign-in')} className="flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold px-4 py-3 rounded-xl w-full">
                        <LogOut size={20} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative">

                {/* Creator Panel */}
                <div className="w-full lg:w-[450px] bg-slate-900/50 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col p-4 md:p-8 shrink-0">
                    {isEditing && deckData ? (
                        <div className="pb-10">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Edit3 className="text-emerald-400" /> Editor</h1>
                                <button onClick={() => setIsEditing(false)} className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold shadow-lg">Done</button>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
                                {deckData.slides.map((_: any, i: number) => (
                                    <button key={i} onClick={() => setActiveSlideIndex(i)} className={`shrink-0 w-10 h-10 rounded-lg font-bold ${activeSlideIndex === i ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>{i + 1}</button>
                                ))}
                            </div>
                            <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                <input type="text" value={deckData.slides[activeSlideIndex].heading} onChange={(e) => updateSlide(activeSlideIndex, 'heading', e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 font-bold" />
                                <textarea value={deckData.slides[activeSlideIndex].bullets.join('\n')} onChange={(e) => updateSlide(activeSlideIndex, 'bullets', e.target.value.split('\n'))} className="w-full h-32 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm resize-none" />
                            </div>
                            <button onClick={() => setIsPublishModalOpen(true)} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center gap-2"><Send size={18} /> Publish to Class</button>
                        </div>
                    ) : (
                        <div>
                            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white mb-6"><ArrowLeft size={16} /> Back</Link>
                            <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-2"><Sparkles className="text-emerald-400 w-8 h-8" /> AI Designer</h1>
                            <p className="text-slate-400 text-sm mb-8">Generate slides and publish to students.</p>
                            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm">{error}</div>}

                            <form onSubmit={handleGenerate} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3">
                                        <option value="Pre-K">Pre-K</option>
                                        <option value="KG1">KG1</option>
                                        <option value="KG2">KG2</option>
                                    </select>
                                    <select value={curriculum} onChange={e => setCurriculum(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3">
                                        <option value="General">General</option>
                                        <option value="Montessori">Montessori</option>
                                    </select>
                                </div>
                                <textarea placeholder="Paste your lesson notes here..." value={lessonText} onChange={e => setLessonText(e.target.value)} required className="w-full h-48 bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 resize-none text-sm" />
                                <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 rounded-xl shadow-lg flex justify-center gap-2 disabled:opacity-50">
                                    {loading ? <><Loader2 className="animate-spin w-5 h-5" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate Presentation</>}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Preview Panel */}
                <div className="flex-1 flex items-center justify-center p-4 min-h-[400px] lg:min-h-0 bg-slate-950 relative">
                    {loading ? (
                        <div className="text-emerald-500 animate-pulse font-bold flex flex-col items-center"><Loader2 className="animate-spin w-8 h-8 mb-4" /> Designing slides...</div>
                    ) : deckData ? (
                        <div className="w-full h-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative bg-slate-900 flex flex-col">
                            <button onClick={() => setIsEditing(!isEditing)} className="absolute top-4 right-4 z-50 bg-indigo-600/90 text-white px-4 py-2 rounded-lg font-bold text-sm"><Edit3 size={14} className="inline mr-1" /> {isEditing ? "Close Editor" : "Edit Slides"}</button>
                            <DeckViewer deck={deckData} />
                        </div>
                    ) : (
                        <div className="text-center text-slate-600"><MonitorPlay size={60} className="mx-auto mb-4 opacity-20" /><h2 className="text-xl font-bold">Preview</h2></div>
                    )}
                </div>
            </main>

            {/* PUBLISH MODAL (Same as before) */}
            {isPublishModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Publish Lesson</h2>
                        <select value={targetType} onChange={(e: any) => setTargetType(e.target.value)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-4 py-3 mb-4">
                            <option value="grade">All Students in Grade</option>
                        </select>
                        <select value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-4 py-3 mb-6">
                            <option value="Pre-K">Pre-K</option>
                            <option value="KG1">KG1</option>
                            <option value="KG2">KG2</option>
                        </select>
                        <div className="flex gap-3">
                            <button onClick={() => setIsPublishModalOpen(false)} className="flex-1 text-slate-500 font-bold py-3">Cancel</button>
                            <button onClick={handlePublish} disabled={isPublishing} className="flex-1 bg-[#1a73e8] text-white font-bold py-3 rounded-lg">{isPublishing ? "Sending..." : "Assign"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}