"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { Client } from "@/lib/db";
import { Trash2, Save } from "lucide-react";

type Props = { initial?: Client };

export default function ClientForm({ initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: initial?.first_name ?? "",
    last_name: initial?.last_name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    zip: initial?.zip ?? "",
    birthday: initial?.birthday ?? "",
    house_anniversary: initial?.house_anniversary ?? "",
    referral_source: initial?.referral_source ?? "",
    tags: initial?.tags ?? "",
    notes: initial?.notes ?? "",
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First and last name are required.");
      return;
    }
    setSaving(true);
    try {
      const url = initial ? `/api/clients/${initial.id}` : "/api/clients";
      const method = initial ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      router.push(`/clients/${saved.id}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!confirm(`Delete ${initial.first_name} ${initial.last_name}? This can't be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/clients/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/clients");
      router.refresh();
    } else {
      setError("Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>First name *</Label>
            <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} required />
          </div>
          <div>
            <Label>Last name *</Label>
            <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} required />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-6">
            <Label>Street</Label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <Label>State</Label>
            <Input value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={2} />
          </div>
          <div className="md:col-span-2">
            <Label>ZIP</Label>
            <Input value={form.zip} onChange={(e) => set("zip", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key dates & source</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Birthday</Label>
            <Input type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} />
          </div>
          <div>
            <Label>House anniversary</Label>
            <Input
              type="date"
              value={form.house_anniversary}
              onChange={(e) => set("house_anniversary", e.target.value)}
            />
          </div>
          <div>
            <Label>Referral source</Label>
            <Input
              value={form.referral_source}
              onChange={(e) => set("referral_source", e.target.value)}
              placeholder="Zillow, Sphere, Open House…"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags & notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tags (comma separated)</Label>
            <Input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="buyer, past-client, VIP"
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={5} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <div>
          {initial && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="size-4" />
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="size-4" />
            {saving ? "Saving…" : initial ? "Save changes" : "Create client"}
          </Button>
        </div>
      </div>
    </form>
  );
}
