import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import {
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  Mic,
  Pencil,
  Send,
  Square,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { analyzeCitizenRequest, resolveLocationLabel, type CivicNeed } from "@/lib/analyze.functions";
import { confirmCitizenRequest, submitCitizenRequest } from "@/lib/jannexus.functions";
import { titleCase } from "@/lib/jannexus-format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a development problem — JanNexus" },
      {
        name: "description",
        content:
          "Describe a local infrastructure problem by voice, text or photo in Hindi, Marathi or English. JanNexus turns it into a structured development need.",
      },
      { property: "og:title", content: "Report a development problem — JanNexus" },
      {
        property: "og:description",
        content: "Voice, text or photo in your own language. No forms, no department names.",
      },
    ],
  }),
  component: ReportPage,
});

const languages = [
  { code: "hi", label: "हिन्दी", english: "Hindi" },
  { code: "mr", label: "मराठी", english: "Marathi" },
  { code: "en", label: "English", english: "English" },
] as const;

const prompts: Record<string, string> = {
  hi: "अपनी समस्या बताइए — जैसे “हर बारिश में स्कूल का रास्ता बंद हो जाता है”",
  mr: "तुमची अडचण सांगा — उदा. “पावसात शाळेचा रस्ता बंद होतो”",
  en: "Describe the problem — e.g. “the school road floods every monsoon”",
};

type Stage = "compose" | "review" | "done";

function ReportPage() {
  const [language, setLanguage] = useState<string>("hi");
  const [text, setText] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [audio, setAudio] = useState<{ base64: string; format: "webm" | "m4a"; url: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [stage, setStage] = useState<Stage>("compose");
  const [need, setNeed] = useState<CivicNeed | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const analyze = useServerFn(analyzeCitizenRequest);
  const submit = useServerFn(submitCitizenRequest);
  const confirm = useServerFn(confirmCitizenRequest);
  const geocode = useServerFn(resolveLocationLabel);

  const analyzeMutation = useMutation({
    mutationFn: async () =>
      analyze({
        data: {
          text: text.trim() || null,
          languageHint: language,
          imageDataUrl,
          audioBase64: audio?.base64 ?? null,
          audioFormat: audio?.format ?? null,
          locationLabel,
        },
      }),
    onSuccess: (result) => {
      setNeed(result);
      setStage("review");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!need) throw new Error("Nothing to submit yet.");
      const evidence = [
        text.trim() ? "citizen_text" : null,
        audio ? "citizen_voice" : null,
        imageDataUrl ? "citizen_image" : null,
        coords ? "device_location" : null,
      ].filter(Boolean) as string[];

      const row = await submit({
        data: {
          language: need.language,
          rawText: text.trim() || need.transcript || null,
          statedSummary: need.stated_summary,
          category: need.category,
          infrastructureType: need.infrastructure_type,
          problemType: need.problem_type,
          severity: need.severity,
          recurrence: need.recurrence,
          district: need.district,
          village: need.village ?? locationLabel,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          confidence: need.confidence,
          inferred: need.inferred,
          evidence,
        },
      });
      await confirm({ data: { id: row.id, confirmed: true } });
      return row;
    },
    onSuccess: (row) => {
      setReference(row.public_ref);
      setStage("done");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const dataUrl = await blobToDataUrl(blob);
        setAudio({
          base64: dataUrl.split(",")[1] ?? "",
          format: mimeType === "audio/webm" ? "webm" : "m4a",
          url: URL.createObjectURL(blob),
        });
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast.error("Microphone access was blocked. You can type or add a photo instead.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  async function handleImage(file: File) {
    if (file.size > 6_000_000) {
      toast.error("That photo is too large. Please pick one under 6 MB.");
      return;
    }
    setImageDataUrl(await blobToDataUrl(file));
  }

  async function shareLocation() {
    if (!navigator.geolocation) {
      toast.error("Location is not available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        try {
          const result = await geocode({ data: { lat, lng } });
          setLocationLabel(result.label);
          toast.success(result.label ? `Location detected: ${result.label}` : "Location attached");
        } catch {
          toast.success("Location attached");
        }
      },
      () => toast.error("Could not read your location. You can mention the village in your message."),
    );
  }

  function reset() {
    setText("");
    setImageDataUrl(null);
    setAudio(null);
    setNeed(null);
    setReference(null);
    setCoords(null);
    setLocationLabel(null);
    setStage("compose");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="label-eyebrow">Citizen intake</p>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Tell us what needs fixing</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Speak, type or show a photo in your own language. You do not need to know the department or the scheme.
      </p>

      {stage === "compose" && (
        <div className="surface-panel mt-8 p-6">
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-colors",
                  language === lang.code
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={5}
            placeholder={prompts[language]}
            className="mt-5 w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-base outline-none transition-colors focus:border-ring"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-colors",
                recording
                  ? "border-destructive bg-destructive/15 text-foreground"
                  : "border-border hover:bg-secondary",
              )}
            >
              {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
              {recording ? "Stop recording" : audio ? "Record again" : "Record a voice note"}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm transition-colors hover:bg-secondary"
            >
              <Camera className="size-4" />
              {imageDataUrl ? "Change photo" : "Add a photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImage(file);
                event.target.value = "";
              }}
            />

            <button
              type="button"
              onClick={shareLocation}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm transition-colors hover:bg-secondary"
            >
              <MapPin className="size-4" />
              {locationLabel ? "Location attached" : "Share my location"}
            </button>
          </div>

          {(audio || imageDataUrl || locationLabel) && (
            <div className="mt-5 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              {audio && (
                <div className="flex items-center gap-3">
                  <audio controls src={audio.url} className="h-9 w-full max-w-sm" />
                  <button
                    type="button"
                    onClick={() => setAudio(null)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Remove voice note"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
              {imageDataUrl && (
                <div className="flex items-center gap-3">
                  <img src={imageDataUrl} alt="Attached evidence" className="h-16 w-24 rounded-md object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageDataUrl(null)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Remove photo"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
              {locationLabel && <p className="text-xs text-muted-foreground">Location: {locationLabel}</p>}
            </div>
          )}

          <button
            type="button"
            disabled={analyzeMutation.isPending}
            onClick={() => analyzeMutation.mutate()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Understanding your request…
              </>
            ) : (
              <>
                <Send className="size-4" />
                Submit my request
              </>
            )}
          </button>
        </div>
      )}

      {stage === "review" && need && (
        <div className="surface-panel mt-8 p-6">
          <p className="label-eyebrow">We understood your request as</p>
          <h2 className="mt-3 text-xl font-semibold">{need.stated_summary}</h2>

          {need.transcript && (
            <p className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              Voice note transcript: “{need.transcript}”
            </p>
          )}

          <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {[
              ["Problem", titleCase(need.problem_type)],
              ["Infrastructure", titleCase(need.infrastructure_type)],
              ["Category", titleCase(need.category)],
              ["Severity", `${need.severity} of 5`],
              ["Recurrence", titleCase(need.recurrence)],
              ["Location", need.village ?? locationLabel ?? "Not identified"],
              ["Language", need.language.toUpperCase()],
              ["Confidence", `${Math.round(need.confidence * 100)}%`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-border/60 pb-2">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="numeric text-sm">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="label-eyebrow">What you said</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {(need.stated.length ? need.stated : [need.stated_summary]).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-evidence/40 bg-evidence/10 p-4">
              <p className="label-eyebrow">What we inferred</p>
              {Object.keys(need.inferred).length ? (
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {Object.entries(need.inferred).map(([field, reason]) => (
                    <li key={field}>
                      • <span className="text-foreground">{titleCase(field)}</span> — {reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Nothing was inferred beyond your words.</p>
              )}
            </div>
          </div>

          {need.clarifying_question && (
            <p className="mt-4 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
              {need.clarifying_question}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              This is correct
            </button>
            <button
              type="button"
              onClick={() => setStage("compose")}
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              <Pencil className="size-4" />
              Change something
            </button>
          </div>
        </div>
      )}

      {stage === "done" && (
        <div className="surface-panel mt-8 p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-signal-low/20 text-signal-low">
            <CheckCircle2 className="size-6" />
          </span>
          <h2 className="mt-4 text-xl font-semibold">Your request has been recorded</h2>
          <p className="numeric mt-2 text-sm text-muted-foreground">Reference {reference}</p>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            It will be grouped with similar requests from your area. When a cluster forms, planners see the
            combined demand along with the evidence behind it.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            Report another problem
          </button>
        </div>
      )}
    </div>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(blob);
  });
}
