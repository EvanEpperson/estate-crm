import Link from "next/link";
import { clientDb, campaignDb } from "@/lib/db";
import { Avatar, Badge, Button, Card, CardContent } from "@/components/ui";
import { Cake, Home, Users, Mail, UserPlus, TrendingUp, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, { birthdays, anniversaries }, campaigns] = await Promise.all([
    clientDb.stats(),
    clientDb.upcoming(60),
    campaignDb.recent(3),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HB Group</h1>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Here's what's happening across your book of business.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="size-5" />} label="Total clients" value={stats.total} href="/clients" />
        <StatCard icon={<Mail className="size-5" />} label="With email" value={stats.withEmail} href="/email" />
        <StatCard icon={<Cake className="size-5" />} label="Birthdays (60d)" value={birthdays.length} />
        <StatCard icon={<Home className="size-5" />} label="Anniversaries (60d)" value={anniversaries.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingCard title="Upcoming birthdays" icon={<Cake className="size-4" />} items={birthdays} empty="No birthdays in the next 60 days." />
        <UpcomingCard title="House anniversaries" icon={<Home className="size-4" />} items={anniversaries} empty="No anniversaries in the next 60 days." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-4 text-[var(--color-muted-foreground)]" />
              <h2 className="font-semibold">Top referral sources</h2>
            </div>
            {stats.bySource.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">No clients yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {stats.bySource.map((s) => {
                  const pct = stats.total ? Math.round((s.c / stats.total) * 100) : 0;
                  return (
                    <li key={s.source}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{s.source}</span>
                        <span className="text-[var(--color-muted-foreground)]">{s.c}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--color-accent)] overflow-hidden">
                        <div className="h-full bg-[var(--color-primary)] rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-[var(--color-muted-foreground)]" />
                <h2 className="font-semibold">Recent campaigns</h2>
              </div>
              <Link href="/email"><Button variant="ghost" size="sm">Compose</Button></Link>
            </div>
            {campaigns.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">No campaigns sent yet.</p>
            ) : (
              <ul className="space-y-3">
                {campaigns.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{c.subject}</div>
                      <div className="text-xs text-[var(--color-muted-foreground)]">
                        {formatDate(c.sent_at)} · {c.sent_count}/{c.recipient_count} delivered
                      </div>
                    </div>
                    {c.failed_count > 0 ? <Badge variant="warning">{c.failed_count} failed</Badge> : <Badge variant="success">Sent</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.total === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto size-14 rounded-2xl bg-[var(--color-primary)]/15 grid place-items-center mb-4">
              <UserPlus className="size-6 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-lg font-semibold">Start your client list</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1 mb-4">
              Add clients, track birthdays and anniversaries, and send campaigns.
            </p>
            <Link href="/clients/new"><Button><UserPlus className="size-4" />Add your first client</Button></Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: number; href?: string }) {
  const inner = (
    <Card className={href ? "transition-all hover:shadow-md hover:-translate-y-0.5" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]">{icon}{label}</div>
        <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function UpcomingCard({ title, icon, items, empty }: {
  title: string; icon: React.ReactNode;
  items: ({ id: number; first_name: string; last_name: string; nextDate: string; daysUntil: number })[];
  empty: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">{icon}<h2 className="font-semibold">{title}</h2></div>
        {items.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{empty}</p>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 6).map((i) => (
              <li key={i.id}>
                <Link href={`/clients/${i.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--color-accent)] transition-colors">
                  <Avatar first={i.first_name} last={i.last_name} className="size-9 text-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{i.first_name} {i.last_name}</div>
                    <div className="text-xs text-[var(--color-muted-foreground)] inline-flex items-center gap-1">
                      <Calendar className="size-3" />{formatDate(i.nextDate)}
                    </div>
                  </div>
                  <Badge variant={i.daysUntil <= 7 ? "warning" : "default"}>
                    {i.daysUntil === 0 ? "Today" : `${i.daysUntil}d`}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
