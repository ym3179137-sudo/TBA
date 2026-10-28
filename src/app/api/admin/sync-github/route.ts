import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;
        const token = process.env.GITHUB_TOKEN;

        // 1. Fetch files from GitHub
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const files = await res.json();

        if (!Array.isArray(files)) throw new Error("Failed to fetch GitHub repo.");

        // 2. Filter for .glb files
        const glbFiles = files.filter((f: any) => f.name.endsWith(".glb"));

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let addedCount = 0;

        // 3. Check and Insert
        for (const file of glbFiles) {
            // Check if it already exists in the DB
            const { data: existing } = await supabaseAdmin
                .from("store_items")
                .select("id")
                .eq("model_url", file.download_url)
                .single();

            if (!existing) {
                // Clean up the name (e.g., "paw_patrol_chase.glb" -> "Paw Patrol Chase")
                const cleanName = file.name.replace(".glb", "").replace(/[_-]/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

                await supabaseAdmin.from("store_items").insert({
                    name: cleanName,
                    model_url: file.download_url,
                    price: 100, // Default price
                    category: "Cartoons" // Default category
                });
                addedCount++;
            }
        }

        return NextResponse.json({ success: true, added: addedCount, total: glbFiles.length });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}