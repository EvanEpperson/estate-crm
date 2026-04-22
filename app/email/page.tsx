"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, Badge, Button, Card, CardContent, Input, Label, Textarea } from "@/components/ui";
import { Mail, Send, Search, Users, AlertTriangle, CheckCircle2, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import type { Client } from "@/lib/db";

type Result = { sent: number; failed: number; results: { id: number; email: string; ok: boolean; error?: string }[] };

export default function EmailPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(
    "Hi {{first_name}},\n\nJust wanted to check in and see how things are going in your new home.\n\nBest,\nYour Agent"
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((list: Client[]) => {
        setClients(list);
        setSelected(new Set(list.filter((c) => c.email).map((c) => c.id)));
      });
  }, []);

  const filtered = useMemo(() => {
    const emailable = clients.filter((c) => c.email);
    if (!q.trim()) return emailable;
    const needle = q.toLowerCase();
    return emailable.filter((c) =>
      `${c.first_name} ${c.last_name} ${c.email} ${c.tags ?? ""}`.toLowerCase().includes(needle)
    );
  }, [clients, q]);

  const emailableCount = clients.filter((c) => c.email).length;
  const selectedCount = selected.size;

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((c) => next.add(c.id));
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function send() {
    setError(null);
    setResult(null);
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are required.");
      return;
    }
    if (selected.size === 0) {
      setError("Select at least one recipient.");
      return;
    }
    const totalBytes = attachments.reduce((n, f) => n + f.size, 0);
    if (totalBytes > 20 * 1024 * 1024) {
      setError("Attachments exceed 20 MB total.");
      return;
    }
    if (!confirm(`Send this email to ${selected.size} recipient${selected.size === 1 ? "" : "s"}?`)) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("subject", subject);
      fd.append("body", body);
      fd.append("recipientIds", JSON.stringify([...selected]));
      for (const f of attachments) fd.append("attachments", f, f.name);
      const res = await fetch("/api/email", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Send failed");
      } else {
        setResult(data);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  const previewClient = clients.find((c) => selected.has(c.id)) ?? clients[0];
  const renderedPreview = previewClient
    ? body
        .replace(/\{\{\s*first_name\s*\}\}/g, previewClient.first_name)
        .replace(/\{\{\s*last_name\s*\}\}/g, previewClient.last_name)
        .replace(/\{\{\s*full_name\s*\}\}/g, `${previewClient.first_name} ${previewClient.last_name}`)
        .replace(/\{\{\s*city\s*\}\}/g, previewClient.city ?? "")
    : body;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="size-7" /> Mass email
          </h1>
          <p className="text-[var(--color-muted-foreground)] mt-1">
            {emailableCount} of {clients.length} clients have an email on file.
          </p>
        </div>
        <Button onClick={send} disabled={sending} size="lg">
          <Send className="size-4" />
          {sending ? "Sending…" : `Send to ${selectedCount}`}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 px-4 py-3 text-sm flex items-start gap-2">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-4 py-3 text-sm flex items-start gap-2">
          <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
          <div>
            Sent {result.sent} successfully{result.failed > 0 ? `, ${result.failed} failed` : ""}.
            {result.failed > 0 && (
              <ul className="mt-2 text-xs opacity-80 list-disc pl-5">
                {result.results
                  .filter((r) => !r.ok)
                  .slice(0, 5)
                  .map((r) => (
                    <li key={r.id}>
                      {r.email}: {r.error}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Happy Home-iversary, {{first_name}}!"
                />
              </div>
              <div>
                <Label>Body</Label>
                <Textarea rows={14} value={body} onChange={(e) => setBody(e.target.value)} />
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1.5">
                  Merge tags: <code className="text-[var(--color-foreground)]">{"{{first_name}}"}</code>,{" "}
                  <code className="text-[var(--color-foreground)]">{"{{last_name}}"}</code>,{" "}
                  <code className="text-[var(--color-foreground)]">{"{{full_name}}"}</code>,{" "}
                  <code className="text-[var(--color-foreground)]">{"{{city}}"}</code>
                </p>
              </div>
              <div>
                <Label>Attachments</Label>
                <div className="flex items-center gap-2 mt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-accent)]">
                    <Paperclip className="size-4" />
                    Add files
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        setAttachments((prev) => [...prev, ...files]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    Images or PDFs, up to 10 MB each, 20 MB total.
                  </span>
                </div>
                {attachments.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {attachments.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center gap-2 text-sm rounded-lg border border-[var(--color-border)] px-2.5 py-1.5"
                      >
                        {f.type === "application/pdf" ? (
                          <FileText className="size-4 shrink-0 text-[var(--color-muted-foreground)]" />
                        ) : (
                          <ImageIcon className="size-4 shrink-0 text-[var(--color-muted-foreground)]" />
                        )}
                        <span className="truncate flex-1">{f.name}</span>
                        <span className="text-xs text-[var(--color-muted-foreground)] shrink-0">
                          {(f.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                          className="p-1 rounded hover:bg-[var(--color-accent)]"
                          aria-label={`Remove ${f.name}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {previewClient && (
            <Card>
              <CardContent className="p-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-3">
                  Preview for {previewClient.first_name} {previewClient.last_name}
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                  <div className="text-xs text-[var(--color-muted-foreground)] mb-2">
                    To: {previewClient.email}
                  </div>
                  <div className="font-semibold mb-3">
                    {subject
                      .replace(/\{\{\s*first_name\s*\}\}/g, previewClient.first_name)
                      .replace(/\{\{\s*last_name\s*\}\}/g, previewClient.last_name)}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{renderedPreview}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-[var(--color-muted-foreground)]" />
                  <h2 className="font-semibold">Recipients</h2>
                </div>
                <Badge>{selectedCount} selected</Badge>
              </div>

              <div className="relative mb-3">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Filter by name, email, tag"
                  className="pl-9 h-9"
                />
              </div>

              <div className="flex gap-2 mb-3">
                <Button size="sm" variant="outline" onClick={selectAllFiltered}>
                  Select all{q ? " filtered" : ""}
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  Clear
                </Button>
              </div>

              <ul className="max-h-[540px] overflow-y-auto divide-y divide-[var(--color-border)] -mx-2">
                {filtered.length === 0 && (
                  <li className="px-2 py-6 text-sm text-[var(--color-muted-foreground)] text-center">
                    {emailableCount === 0
                      ? "No clients have an email yet."
                      : "No clients match your filter."}
                  </li>
                )}
                {filtered.map((c) => {
                  const isSel = selected.has(c.id);
                  return (
                    <li key={c.id}>
                      <label
                        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                          isSel ? "bg-[var(--color-accent)]" : "hover:bg-[var(--color-accent)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggle(c.id)}
                          className="size-4 accent-[var(--color-primary)]"
                        />
                        <Avatar first={c.first_name} last={c.last_name} className="size-9 text-sm" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {c.first_name} {c.last_name}
                          </div>
                          <div className="text-xs text-[var(--color-muted-foreground)] truncate">
                            {c.email}
                          </div>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
