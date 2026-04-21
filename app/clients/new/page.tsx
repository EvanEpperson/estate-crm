import Link from "next/link";
import ClientForm from "@/components/client-form";
import { ChevronLeft } from "lucide-react";

export default function NewClientPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <ChevronLeft className="size-4" />
          Back to clients
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-2">New client</h1>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Add someone new to your book of business.
        </p>
      </div>
      <ClientForm />
    </div>
  );
}
