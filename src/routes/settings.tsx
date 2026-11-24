import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, PlugZap, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { API_BASE_URL, getApiErrorMessage, isApiConfigured } from "@/lib/api";
import { fetchStudents } from "@/lib/students";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "API connection · Student Management System" },
      { name: "description", content: "Connect the dashboard to your ASP.NET Core Web API." },
      { property: "og:title", content: "API connection · Student Management System" },
      { property: "og:description", content: "Connect the dashboard to your ASP.NET Core Web API." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const ENDPOINTS = [
  { method: "GET", path: "/api/Students" },
  { method: "GET", path: "/api/Students/{id}" },
  { method: "POST", path: "/api/Students" },
  { method: "PUT", path: "/api/Students" },
];

type TestResult = { ok: true; count: number; ms: number } | { ok: false; message: string };

function SettingsPage() {
  const [origin, setOrigin] = useState("https://your-preview-url");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  const test = async () => {
    setTesting(true);
    setResult(null);
    const start = performance.now();
    try {
      const list = await fetchStudents();
      setResult({ ok: true, count: list.length, ms: Math.round(performance.now() - start) });
    } catch (e) {
      setResult({ ok: false, message: getApiErrorMessage(e) });
    } finally {
      setTesting(false);
    }
  };

  const cors = `builder.Services.AddCors(o => o.AddPolicy("Frontend", p => p
    .WithOrigins("${origin}")
    .AllowAnyHeader()
    .AllowAnyMethod()));

// Avoid Student <-> Department reference loops in JSON
builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.ReferenceHandler =
        System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);

var app = builder.Build();
app.UseCors("Frontend"); // before MapControllers()`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader eyebrow="System" title="API connection" description="This dashboard reads and writes students through your ASP.NET Core Web API." />

      <section className="surface-card animate-fade-up p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-subtle-foreground">VITE_API_BASE_URL</div>
            <div className="mt-1.5 truncate font-mono text-sm text-foreground">{API_BASE_URL || "Not set"}</div>
            {!isApiConfigured ? (
              <p className="mt-1 text-xs text-warning">Replace YOUR_PORT in the .env file with your API's HTTPS port.</p>
            ) : null}
          </div>
          <Button variant="premium" onClick={() => void test()} disabled={!isApiConfigured || testing}>
            {testing ? <Loader2 className="animate-spin" /> : <PlugZap />} Test connection
          </Button>
        </div>
        {result ? (
          <div className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${result.ok ? "border-success/30 bg-success-soft text-success" : "border-destructive/30 bg-destructive-soft text-destructive"}`}>
            {result.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
            <span>{result.ok ? `Connected — ${result.count} students loaded in ${result.ms} ms.` : result.message}</span>
          </div>
        ) : null}
      </section>

      <section className="surface-card animate-fade-up p-5">
        <h2 className="text-sm font-semibold text-foreground">Endpoints used</h2>
        <ul className="mt-3 divide-y divide-border">
          {ENDPOINTS.map((e) => (
            <li key={e.method + e.path} className="flex items-center gap-3 py-2.5 font-mono text-sm">
              <span className={`w-14 rounded px-1.5 py-0.5 text-center text-[11px] font-semibold ${e.method === "GET" ? "bg-info-soft text-info" : e.method === "POST" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
                {e.method}
              </span>
              <span className="text-foreground">{e.path}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card animate-fade-up space-y-4 p-5">
        <h2 className="text-sm font-semibold text-foreground">Running the API on your computer</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Set <code className="font-mono text-foreground">VITE_API_BASE_URL=https://localhost:PORT</code> using the HTTPS port from launchSettings.json.</li>
          <li>Trust the development certificate: <code className="font-mono text-foreground">dotnet dev-certs https --trust</code></li>
          <li>Allow this site in CORS (snippet below), then restart the API.</li>
          <li>If your browser asks to allow access to devices on your local network, choose Allow.</li>
        </ol>
        <pre className="overflow-x-auto rounded-lg border border-border bg-background p-4 font-mono text-xs leading-relaxed text-muted-foreground">{cors}</pre>
      </section>
    </div>
  );
}
