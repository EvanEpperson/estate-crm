import Link from "next/link";
import { notFound } from "next/navigation";
import { clientDb } from "@/lib/db";
import { Avatar, Badge, Card, CardContent } from "@/components/ui";
import { ChevronLeft, Mail, Phone, MapPin, Cake, Home, Users } from "lucide-react";
import { formatDate, formatPhone } from "@/lib/utils";
import ClientForm from "@/components/client-form";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await clientDb.get(Number(id));
  if (!client) notFound();

  const tags = client.tags ? client.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
          <ChevronLeft className="size-4" />Back to clients
        </Link>
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Avatar first={client.first_name} last={client.last_name} className="size-20 text-2xl" />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{client.first_name} {client.last_name}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-[var(--color-muted-foreground)]">
              {client.email && (
                <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 hover:text-[var(--color-foreground)]">
                  <Mail className="size-4" />{client.email}
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 hover:text-[var(--color-foreground)]">
                  <Phone className="size-4" />{formatPhone(client.phone)}
                </a>
              )}
              {(client.address || client.city) && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {[client.address, client.city, client.state, client.zip].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {tags.map((t) => <Badge key={t}>{t}</Badge>)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoStat icon={<Cake className="size-4" />} label="Birthday" value={formatDate(client.birthday)} />
        <InfoStat icon={<Home className="size-4" />} label="House anniversary" value={formatDate(client.house_anniversary)} />
        <InfoStat icon={<Users className="size-4" />} label="Referral source" value={client.referral_source || "—"} />
      </div>

      {client.notes && (
        <Card>
          <CardContent className="p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-2">Notes</div>
            <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-4">Edit details</h2>
        <ClientForm initial={client} />
      </div>
    </div>
  );
}

function InfoStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]">{icon}{label}</div>
        <div className="mt-2 text-lg font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
