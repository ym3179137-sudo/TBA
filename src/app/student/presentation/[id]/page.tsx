import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DeckViewer from "@/components/DeckViewer";

export default async function StudentPresentationPage({ params }: { params: { id: string } }) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: presentation } = await supabaseAdmin
        .from("presentations")
        .select("deck_data, title")
        .eq("id", params.id)
        .single();

    if (!presentation) return notFound();

    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex items-center gap-4">
                <Link href="/student" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-bold text-sm bg-slate-800 px-4 py-2 rounded-xl">
                    <ArrowLeft size={16} /> Back
                </Link>
                <h1 className="text-white font-extrabold">{presentation.title}</h1>
            </div>

            <div className="flex-1 overflow-hidden">
                {/* The DeckViewer already handles Arrow keys and Spacebar automatically! */}
                <DeckViewer deck={presentation.deck_data} />
            </div>
        </div>
    );
}