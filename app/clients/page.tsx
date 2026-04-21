"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Input, Badge, Avatar } from "@/components/ui";
import { Search, UserPlus, Mail, Phone, MapPin } from "lucide-react";
import type { Client } from "@/lib/db";
import { formatPhone } from "@/lib/utils";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    fetch(`/api/clients${q ? `?q=${encodeURIComponent(q)}` : ""}`, { signal: ctl.signal })
      .then((r) => r.json())
      .then(setClients)
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [q]);

  const grouped = useMemo(() => {
    const g: Record<string, Client[]> = {};
    for (const c of clients) {
      const letter = (c.last_name[0] ?? "?").toUpperCase();
      (g[letter] ??= []).push(c);
    }
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
  }, [clients]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-[var(--color-muted-foreground)] mt-1">
            {loading ? "Loading…" : `${clients.length} ${clients.length === 1 ? "client" : "clients"}`}
          </p>
        </div>
        <Link href="/clients/new">
          <Button>
            <UserPlus className="size-4" />
            Add client
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone…"
          className="pl-10"
        />
      </div>

      {!loading && clients.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto size-12 rounded-full bg-[var(--color-accent)] grid place-items-center mb-4">
              <UserPlus className="size-6 text-[var(--color-muted-foreground)]" />
            </div>
            <h3 className="font-semibold text-lg">No clients yet</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              {q ? "Nothing matched your search." : "Add your first client to get started."}
            </p>
            {!q && (
              <Link href="/clients/new" className="inline-block mt-4">
                <Button>
                  <UserPlus className="size-4" />
                  Add client
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {grouped.map(([letter, list]) => (
        <div key={letter}>
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2 px-1">
            {letter}
          </div>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-[var(--color-border)]">
                {list.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/clients/${c.id}`}
                      className="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-[var(--color-accent)] transition-colors"
                    >
                      <Avatar first={c.first_name} last={c.last_name} />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">
                          {c.first_name} {c.last_name}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-muted-foreground)] mt-0.5">
                          {c.email && (
                            <span className="inline-flex items-center gap-1.5 truncate">
                              <Mail className="size-3.5" />
                              {c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="size-3.5" />
                              {formatPhone(c.phone)}
                            </span>
                          )}
                          {(c.city || c.state) && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="size-3.5" />
                              {[c.city, c.state].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      {c.referral_source && (
                        <Badge variant="outline" className="hidden sm:inline-flex">
                          {c.referral_source}
                        </Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
