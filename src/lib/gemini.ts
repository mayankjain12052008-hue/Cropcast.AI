export interface GeminiAnalysis {
  identifiedDisease: string;
  matchedDatabaseDisease: string | null;
  confidence: number;
  severity: string;
  pathogenType: string;
  description: string;
  symptoms: string;
  treatmentAdvice: string;
  preventionAdvice: string;
  urgency: string;
  rawText?: string;
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

export async function analyzeImageWithGemini(
  imageBase64: string,
  mimeType: string,
  cropName: string,
  diseases: DiseaseContext[],
): Promise<GeminiAnalysis> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-analyze`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anonKey) {
    headers['Authorization'] = `Bearer ${anonKey}`;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ imageBase64, mimeType, cropName, diseases }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Analysis failed (${response.status})`);
  }

  const data = await response.json();
  const analysis = data.analysis as GeminiAnalysis;

  if (!analysis || (!analysis.identifiedDisease && !analysis.rawText)) {
    throw new Error('Gemini returned an unexpected response format');
  }

  return analysis;
}

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      resolve({
        base64: result.slice(commaIdx + 1),
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export async function chatWithGemini(
  messages: ChatMessage[],
  context: {
    cropName: string;
    diseaseName: string;
    severity: string;
    pathogenType: string;
    weatherSummary: string;
    locationName: string;
  },
): Promise<string> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anonKey) {
    headers['Authorization'] = `Bearer ${anonKey}`;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages, context }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Chat request failed (${response.status})`);
  }

  const data = await response.json();
  if (!data.reply) {
    throw new Error('Gemini chat returned no reply');
  }

  return data.reply as string;
}
