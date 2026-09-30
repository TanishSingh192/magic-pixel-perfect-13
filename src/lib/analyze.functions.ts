import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.8-flash";

export type CivicNeed = {
  language: string;
  stated_summary: string;
  transcript: string | null;
  category: string;
  infrastructure_type: string;
  problem_type: string;
  severity: number;
  recurrence: string;
  district: string | null;
  village: string | null;
  affected_population_estimate: number | null;
  confidence: number;
  stated: string[];
  inferred: Record<string, string>;
  clarifying_question: string | null;
};

const SYSTEM_PROMPT = `You are the civic-need extraction layer of JanNexus, a public investment decision-support platform for Indian districts.
A citizen describes a development problem in Hindi, Marathi or English, by text, voice note and/or photo.

Return ONE JSON object with exactly these keys:
language (ISO code of the citizen's language: hi, mr or en)
stated_summary (one plain English sentence of what the citizen actually said)
transcript (verbatim transcript in the original language if audio was given, else null)
category (one of: water, health, education, road, transport, sanitation, urban, electricity, other)
infrastructure_type (snake_case, e.g. school_access_road, piped_water_supply, primary_health_centre, street_lighting, storm_drain, bus_stop)
problem_type (snake_case, e.g. flooding, shortage, access_distance, absent_service, maintenance, overflow, staffing, service_gap)
severity (integer 1-5)
recurrence (one of: one_time, seasonal, chronic, unknown)
district (Indian district if the citizen named or implied one, else null)
village (village/locality name if stated, else null)
affected_population_estimate (integer if the citizen gave numbers, else null)
confidence (0-1 number)
stated (array of short strings the citizen explicitly said)
inferred (object mapping each inferred field name to a short reason why you inferred it)
clarifying_question (one short question in the citizen's language if a critical detail is missing, else null)

Rules: never invent a location the citizen did not indicate. Keep stated facts and inferences strictly separate. Respond with JSON only.`;

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "input_audio"; input_audio: { data: string; format: string } };

export const analyzeCitizenRequest = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      text?: string | null;
      languageHint?: string | null;
      imageDataUrl?: string | null;
      audioBase64?: string | null;
      audioFormat?: "webm" | "m4a" | "mp3" | "wav" | "ogg" | null;
      locationLabel?: string | null;
    }) => {
      if (!input.text?.trim() && !input.imageDataUrl && !input.audioBase64) {
        throw new Error("Add a description, a voice note or a photo first.");
      }
      return input;
    },
  )
  .handler(async ({ data }): Promise<CivicNeed> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this project yet.");

    const parts: ContentPart[] = [];
    const contextLines = [
      data.languageHint ? `Citizen selected language: ${data.languageHint}.` : null,
      data.locationLabel ? `Device location resolved to: ${data.locationLabel}.` : null,
      data.text?.trim() ? `Citizen wrote: ${data.text.trim()}` : null,
      data.audioBase64 ? "A voice note is attached — transcribe it before extracting." : null,
      data.imageDataUrl ? "A photo of the problem is attached — use it as visual evidence." : null,
    ].filter(Boolean);
    parts.push({ type: "text", text: contextLines.join("\n") });
    if (data.imageDataUrl) parts.push({ type: "image_url", image_url: { url: data.imageDataUrl } });
    if (data.audioBase64) {
      parts.push({
        type: "input_audio",
        input_audio: { data: data.audioBase64, format: data.audioFormat ?? "webm" },
      });
    }

    const response = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: parts },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`AI gateway failed [${response.status}]: ${body}`);
      if (response.status === 429) throw new Error("The AI service is busy right now. Please try again in a moment.");
      if (response.status === 402) throw new Error("AI credits are exhausted for this workspace.");
      throw new Error(`Could not interpret the request [${response.status}].`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    let parsed: Partial<CivicNeed> = {};
    try {
      parsed = JSON.parse(raw) as Partial<CivicNeed>;
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("The AI response could not be read. Please try again.");
      parsed = JSON.parse(match[0]) as Partial<CivicNeed>;
    }

    const severity = Number(parsed.severity ?? 3);
    return {
      language: parsed.language ?? data.languageHint ?? "en",
      stated_summary: parsed.stated_summary ?? data.text?.trim() ?? "Citizen request",
      transcript: parsed.transcript ?? null,
      category: parsed.category ?? "other",
      infrastructure_type: parsed.infrastructure_type ?? "unspecified",
      problem_type: parsed.problem_type ?? "unspecified",
      severity: Math.min(5, Math.max(1, Number.isFinite(severity) ? Math.round(severity) : 3)),
      recurrence: parsed.recurrence ?? "unknown",
      district: parsed.district ?? null,
      village: parsed.village ?? null,
      affected_population_estimate: parsed.affected_population_estimate ?? null,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence ?? 0.75))),
      stated: Array.isArray(parsed.stated) ? parsed.stated.slice(0, 6) : [],
      inferred:
        parsed.inferred && typeof parsed.inferred === "object"
          ? Object.fromEntries(
              Object.entries(parsed.inferred)
                .slice(0, 8)
                .map(([k, v]) => [k, String(v)]),
            )
          : {},
      clarifying_question: parsed.clarifying_question ?? null,
    };
  });

export const resolveLocationLabel = createServerFn({ method: "POST" })
  .inputValidator((input: { lat: number; lng: number }) => {
    if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) throw new Error("Invalid coordinates");
    if (Math.abs(input.lat) > 90 || Math.abs(input.lng) > 180) throw new Error("Invalid coordinates");
    return input;
  })
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !mapsKey) return { label: null as string | null };

    const response = await fetch(
      `https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?latlng=${data.lat},${data.lng}&result_type=locality|administrative_area_level_2|sublocality`,
      {
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": mapsKey,
        },
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`Geocode failed [${response.status}]: ${body}`);
      return { label: null as string | null };
    }
    const payload = (await response.json()) as {
      results?: Array<{ formatted_address?: string }>;
    };
    return { label: payload.results?.[0]?.formatted_address ?? null };
  });
