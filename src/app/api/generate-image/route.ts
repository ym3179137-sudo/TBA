import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const prompt = req.nextUrl.searchParams.get("prompt");
    const seed = req.nextUrl.searchParams.get("seed") || Math.floor(Math.random() * 1000000).toString();

    if (!prompt) {
        return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    const apiKey = process.env.POLLINATIONS_API_KEY;

    if (!apiKey) {
        console.error("Missing POLLINATIONS_API_KEY in environment variables.");
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 🚨 THE NEW OFFICIAL ENDPOINT
    const url = new URL(`https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}`);
    url.searchParams.append("model", "black-forest-labs/flux.1-schnell");
    url.searchParams.append("width", "1024");
    url.searchParams.append("height", "768");
    url.searchParams.append("nologo", "true");
    url.searchParams.append("seed", seed);

    try {
        const response = await fetch(url.toString(), {
            headers: {
                // 🚨 PASS THE SECRET KEY IN THE HEADER
                "Authorization": `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Pollinations API error:", response.status, errorText);
            throw new Error(`API error: ${response.status}`);
        }

        const imageBuffer = await response.arrayBuffer();

        return new NextResponse(imageBuffer, {
            headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Image Generation Error:", error);
        return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
    }
}