import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Verify User is Admin
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { data: profile } = await supabase.from("tba_profiles").select("role").eq("id", user.id).single();
        if (profile?.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const name = formData.get("name") as string;
        const price = parseInt(formData.get("price") as string);
        const itemType = formData.get("itemType") as string; // 'character' or 'emote'

        if (!file || !name) return NextResponse.json({ error: "Missing data" }, { status: 400 });

        // 🚨 2. STRICT SECURITY: Magic Number Check (Anti-Virus)
        const arrayBuffer = await file.arrayBuffer();

        // Check max size on server too (25MB)
        if (arrayBuffer.byteLength > 25 * 1024 * 1024) {
            return NextResponse.json({ error: "File exceeds 25MB server limit" }, { status: 413 });
        }

        const headerBytes = new Uint8Array(arrayBuffer.slice(0, 4));
        const magicString = new TextDecoder().decode(headerBytes);

        // A valid GLB file must start with the ASCII string "glTF"
        if (magicString !== "glTF") {
            // Log Sabotage Attempt
            const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
            await supabaseAdmin.from("security_alerts").insert({
                alert_type: "MALICIOUS_UPLOAD",
                message: `Blocked upload of ${file.name}. File signature was ${magicString}, not glTF.`,
                ip_address: req.headers.get("x-forwarded-for") || "Unknown"
            });
            return NextResponse.json({ error: "Invalid file format. Security incident logged." }, { status: 403 });
        }

        // 🚀 3. Upload to GitHub (As per your original logic)
        const token = process.env.GITHUB_TOKEN;
        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;

        const base64Content = Buffer.from(arrayBuffer).toString("base64");
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`;

        const githubRes = await fetch(githubUrl, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: `Uploaded ${itemType}: ${name}`,
                content: base64Content,
                branch: "main"
            }),
        });

        if (!githubRes.ok) {
            const errorData = await githubRes.json();
            throw new Error(`GitHub Error: ${errorData.message}`);
        }

        const githubData = await githubRes.json();
        const rawUrl = githubData.content.download_url;

        // ✅ 4. Save to Database
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

        await supabaseAdmin.from("store_items").insert({
            name: name,
            model_url: rawUrl,
            price: price,
            item_type: itemType, // Saves whether it's a character or emote
            category: itemType === 'emote' ? 'Emotes' : 'Characters'
        });

        return NextResponse.json({ success: true, url: rawUrl });
    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}