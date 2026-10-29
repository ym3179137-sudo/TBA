import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DeckViewer from "@/components/DeckViewer";

export const dynamic = 'force-dynamic';

export default async function StudentPresentationPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const presentationId = resolvedParams.id;

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: presentation } = await supabaseAdmin
        .from("presentations")
        .select("deck_data, title, file_url")
        .eq("id", presentationId)
        .single();

    if (!presentation) return notFound();

    // If it's an uploaded PowerPoint
    if (presentation.file_url) {
        const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(presentation.file_url)}`;
        return (
            <div className="h-screen w-screen bg-slate-950 flex flex-col">
                <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center gap-4">
                    <Link href="/student" className="text-slate-400 hover:text-white flex items-center gap-2 font-bold bg-slate-800 px-4 py-2 rounded-xl transition-colors">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                    <h1 className="text-white font-extrabold">{presentation.title}</h1>
                </div>
                <iframe
                    src={viewerUrl}
                    className="w-full flex-1 border-none bg-white"
                    title="PowerPoint Viewer"
                />
            </div>
        );
    }

    // AI Presentation - Locked View
    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden">
            <div className="absolute top-4 right-4 z-50">
                <Link href="/student" className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-xl border border-slate-700 shadow-2xl flex items-center gap-2 text-sm transition-all">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
            </div>
            <div className="flex-1 overflow-hidden">
                {/* 🚨 Pass isStudentView={true} to lock the forward button */}
                <DeckViewer deck={presentation.deck_data} isStudentView={true} />
            </div>
        </div>
    );
}