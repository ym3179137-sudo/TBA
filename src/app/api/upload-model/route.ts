import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 🛡️ 1. Verify Admin
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { data: profile } = await supabase.from("tba_profiles").select("role").eq("id", user.id).single();
        if (profile?.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const name = formData.get("name") as string;
        const price = parseInt(formData.get("price") as string);

        if (!file || !name) return NextResponse.json({ error: "Missing data" }, { status: 400 });

        // 🛡️ 2. Security Check: Magic Number (Anti-Virus)
        const arrayBuffer = await file.arrayBuffer();
        const headerBytes = new Uint8Array(arrayBuffer.slice(0, 4));
        const magicString = new TextDecoder().decode(headerBytes);

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

        // 🚀 3. Upload to GitHub
        const token = process.env.GITHUB_TOKEN;
        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;

        // Convert file to Base64 (GitHub API requirement)
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
                message: `Uploaded 3D model: ${name}`,
                content: base64Content,
                branch: "main" // or "master" depending on your repo
            }),
        });

        if (!githubRes.ok) {
            const errorData = await githubRes.json();
            throw new Error(`GitHub Error: ${errorData.message}`);
        }

        const githubData = await githubRes.json();
        const rawUrl = githubData.content.download_url; // The public link!

        // ✅ 4. Save to Database
        const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

        await supabaseAdmin.from("store_items").insert({
            name: name,
            model_url: rawUrl,
            price: price
        });

        return NextResponse.json({ success: true, url: rawUrl });
    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}