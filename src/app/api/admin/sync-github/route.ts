import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
    try {
        const owner = process.env.GITHUB_REPO_OWNER;
        const repo = process.env.GITHUB_REPO_NAME;
        const token = process.env.GITHUB_TOKEN;

        if (!owner || !repo) {
            return NextResponse.json({ error: "GitHub repo owner or name is missing in .env" }, { status: 400 });
        }

        const headers: any = { "Accept": "application/vnd.github.v3+json" };
        if (token) headers["Authorization"] = `token ${token}`;

        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, { headers });

        if (!repoRes.ok) throw new Error(`GitHub API Error: ${repoRes.statusText}`);

        const repoData = await repoRes.json();

        // Filter for only .glb files
        const glbFiles = repoData.tree.filter((file: any) => file.path.endsWith(".glb"));

        if (glbFiles.length === 0) {
            return NextResponse.json({ success: true, total: 0, added: 0, message: "No .glb files found in this repo." });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: existingItems } = await supabaseAdmin.from("store_items").select("model_url");
        const existingUrls = existingItems?.map(i => i.model_url) || [];

        let addedCount = 0;
        const newItemsToInsert = [];

        for (const file of glbFiles) {
            const fileName = file.path.split("/").pop() || "Item";
            const cleanName = fileName.replace(".glb", "").replace(/[-_]/g, " ");

            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${file.path}`;

            if (existingUrls.includes(rawUrl)) continue;

            // 🚨 THE EXACT FOLDER CHECK YOU REQUESTED
            const lowerPath = file.path.toLowerCase();
            // Check if the path contains 'emotes/' OR starts with 'emotes/'
            const isEmote = lowerPath.includes("emotes/") || lowerPath.startsWith("emotes/");

            newItemsToInsert.push({
                name: cleanName,
                model_url: rawUrl,
                price: isEmote ? 50 : 100, // Emotes are 50 coins, Characters are 100
                item_type: isEmote ? "emote" : "character"
            });
        }

        if (newItemsToInsert.length > 0) {
            const { error } = await supabaseAdmin.from("store_items").insert(newItemsToInsert);
            if (error) throw error;
            addedCount = newItemsToInsert.length;
        }

        return NextResponse.json({
            success: true,
            total: glbFiles.length,
            added: addedCount
        });

    } catch (error: any) {
        console.error("GitHub Sync Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}