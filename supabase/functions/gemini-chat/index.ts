const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_MODEL = "gemini-3.8-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function getApiKey(): Promise<string | null> {
  const envKey = Deno.env.get("GEMINI_API_KEY");
  if (envKey) return envKey;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return null;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/app_secrets?key=eq.GEMINI_API_KEY&select=value`, {
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.value ?? null;
  } catch {
    return null;
  }
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  context: {
    cropName: string;
    diseaseName: string;
    severity: string;
    pathogenType: string;
    weatherSummary: string;
    locationName: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const apiKey = await getApiKey();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const body: ChatRequest = await req.json();
    const { messages, context } = body;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = `You are CropCast.AI, an expert agricultural advisor AI assistant for farmers. You are helping a farmer who has scanned their crop and received a diagnosis. Here is the context:

- Crop: ${context.cropName}
- Diagnosed disease: ${context.diseaseName}
- Severity: ${context.severity}
- Pathogen type: ${context.pathogenType}
- Location: ${context.locationName}
- Current weather: ${context.weatherSummary}

Provide practical, actionable advice. Keep responses concise (2-4 sentences) and easy to understand for a farmer. Focus on:
- Treatment steps and timing
- Weather-based spray recommendations
- Prevention strategies
- Safety precautions (pre-harvest intervals, protective equipment)
- Cost-effective solutions

Always remind the farmer to consult local agricultural extension services for region-specific guidance.`;

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      })),
    ];

    const geminiBody = {
      contents,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1024,
      },
    };

    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${geminiRes.status}`, details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Gemini returned no content" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ reply: text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
