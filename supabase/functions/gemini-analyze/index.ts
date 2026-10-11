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

interface DiseaseContext {
  id: string;
  name: string;
  cropName: string;
  pathogenType: string;
  severity: string;
  symptoms: string | null;
  description: string | null;
}

interface AnalyzeRequest {
  imageBase64: string;
  mimeType: string;
  cropName: string;
  diseases: DiseaseContext[];
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
    const body: AnalyzeRequest = await req.json();
    const { imageBase64, mimeType, cropName, diseases } = body;

    if (!imageBase64 || !mimeType || !cropName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: imageBase64, mimeType, cropName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const diseaseList = (diseases || []).map((d) =>
      `- ${d.name} (pathogen: ${d.pathogenType}, severity: ${d.severity})${d.symptoms ? ` — symptoms: ${d.symptoms}` : ""}`
    ).join("\n");

    const prompt = `You are an expert plant pathologist and agricultural advisor. Analyze this crop image of a ${cropName} plant.

Known diseases for ${cropName} in our database:
${diseaseList || "No specific diseases in database for this crop."}

Based on the image, identify the most likely disease or condition. Respond in JSON format ONLY with this exact structure:
{
  "identifiedDisease": "name of the disease (use the closest match from the list above if possible, or a new diagnosis if none match)",
  "matchedDatabaseDisease": "the name from the list that most closely matches, or null if none match",
  "confidence": 0.0 to 1.0,
  "severity": "low" | "moderate" | "severe",
  "pathogenType": "fungal" | "bacterial" | "viral" | "oomycete" | "nutritional" | "environmental" | "insect",
  "description": "2-3 sentence description of the disease/condition",
  "symptoms": "description of visible symptoms in the image",
  "treatmentAdvice": "specific actionable treatment advice for the farmer",
  "preventionAdvice": "prevention strategies for the future",
  "urgency": "low" | "moderate" | "high" | "critical"
}

Be precise and practical. If the plant appears healthy, set identifiedDisease to "Healthy" and confidence to 0.8+.`;

    const geminiBody = {
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64,
            },
          },
        ],
      }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
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

    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      analysis = { rawText: text };
    }

    return new Response(
      JSON.stringify({ analysis }),
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
