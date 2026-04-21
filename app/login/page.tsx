"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Lock } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push(params.get("from") || "/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Incorrect password.");
        setPassword("");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] grid place-items-center shadow-xl shadow-[color-mix(in_oklch,var(--color-primary)_30%,transparent)] mb-4">
            <Building2 className="size-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Estate CRM</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Sign in to continue</p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your password"
                  autoFocus
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
