import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to .env.local");
  return neon(url);
}

// Cache per process (reused across requests in same serverless instance)
let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) _sql = getSql();
  return _sql;
}

// ─── Schema init ─────────────────────────────────────────────────────────────
// Called once on first DB use. Safe to call multiple times (IF NOT EXISTS).

let _initialized = false;
async function ensureSchema() {
  if (_initialized) return;
  _initialized = true;
  await sql()`
    CREATE TABLE IF NOT EXISTS clients (
      id        SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name  TEXT NOT NULL,
      email      TEXT,
      phone      TEXT,
      address    TEXT,
      city       TEXT,
      state      TEXT,
      zip        TEXT,
      birthday          TEXT,
      house_anniversary TEXT,
      referral_source   TEXT,
      notes TEXT,
      tags  TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql()`
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id              SERIAL PRIMARY KEY,
      subject         TEXT NOT NULL,
      body            TEXT NOT NULL,
      recipient_count INTEGER NOT NULL,
      sent_count      INTEGER NOT NULL DEFAULT 0,
      failed_count    INTEGER NOT NULL DEFAULT 0,
      sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql()`
    CREATE INDEX IF NOT EXISTS idx_clients_name
      ON clients (last_name, first_name)
  `;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type Client = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  birthday: string | null;
  house_anniversary: string | null;
  referral_source: string | null;
  notes: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientInput = Omit<Client, "id" | "created_at" | "updated_at">;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clean(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
}

function normalizeInput(input: ClientInput) {
  return {
    first_name: clean(input.first_name) ?? "",
    last_name: clean(input.last_name) ?? "",
    email: clean(input.email),
    phone: clean(input.phone),
    address: clean(input.address),
    city: clean(input.city),
    state: clean(input.state),
    zip: clean(input.zip),
    birthday: clean(input.birthday),
    house_anniversary: clean(input.house_anniversary),
    referral_source: clean(input.referral_source),
    notes: clean(input.notes),
    tags: clean(input.tags),
  };
}

// ─── Client DB ───────────────────────────────────────────────────────────────

export const clientDb = {
  async list(search?: string): Promise<Client[]> {
    await ensureSchema();
    if (search?.trim()) {
      const q = `%${search.trim()}%`;
      return (await sql()`
        SELECT * FROM clients
        WHERE first_name ILIKE ${q} OR last_name ILIKE ${q}
           OR email ILIKE ${q} OR phone ILIKE ${q}
        ORDER BY last_name, first_name
      `) as Client[];
    }
    return (await sql()`
      SELECT * FROM clients ORDER BY last_name, first_name
    `) as Client[];
  },

  async get(id: number): Promise<Client | undefined> {
    await ensureSchema();
    const rows = await sql()`SELECT * FROM clients WHERE id = ${id}`;
    return rows[0] as Client | undefined;
  },

  async create(input: ClientInput): Promise<Client> {
    await ensureSchema();
    const n = normalizeInput(input);
    const rows = await sql()`
      INSERT INTO clients (
        first_name, last_name, email, phone, address, city, state, zip,
        birthday, house_anniversary, referral_source, notes, tags
      ) VALUES (
        ${n.first_name}, ${n.last_name}, ${n.email}, ${n.phone},
        ${n.address}, ${n.city}, ${n.state}, ${n.zip},
        ${n.birthday}, ${n.house_anniversary}, ${n.referral_source},
        ${n.notes}, ${n.tags}
      ) RETURNING *
    `;
    return rows[0] as Client;
  },

  async update(id: number, input: ClientInput): Promise<Client | undefined> {
    await ensureSchema();
    const n = normalizeInput(input);
    const rows = await sql()`
      UPDATE clients SET
        first_name = ${n.first_name}, last_name = ${n.last_name},
        email = ${n.email}, phone = ${n.phone}, address = ${n.address},
        city = ${n.city}, state = ${n.state}, zip = ${n.zip},
        birthday = ${n.birthday}, house_anniversary = ${n.house_anniversary},
        referral_source = ${n.referral_source}, notes = ${n.notes},
        tags = ${n.tags}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] as Client | undefined;
  },

  async remove(id: number): Promise<void> {
    await ensureSchema();
    await sql()`DELETE FROM clients WHERE id = ${id}`;
  },

  async stats(): Promise<{ total: number; withEmail: number; bySource: { source: string; c: number }[] }> {
    await ensureSchema();
    const [totRow, emailRow, srcRows] = await Promise.all([
      sql()`SELECT COUNT(*)::int AS c FROM clients`,
      sql()`SELECT COUNT(*)::int AS c FROM clients WHERE email IS NOT NULL AND email <> ''`,
      sql()`
        SELECT COALESCE(NULLIF(referral_source, ''), 'Unknown') AS source,
               COUNT(*)::int AS c
        FROM clients
        GROUP BY source ORDER BY c DESC LIMIT 6
      `,
    ]);
    return {
      total: (totRow[0] as { c: number }).c,
      withEmail: (emailRow[0] as { c: number }).c,
      bySource: srcRows as { source: string; c: number }[],
    };
  },

  async upcoming(daysAhead = 60): Promise<{
    birthdays: (Client & { nextDate: string; daysUntil: number })[];
    anniversaries: (Client & { nextDate: string; daysUntil: number })[];
  }> {
    await ensureSchema();
    const all = (await sql()`SELECT * FROM clients`) as Client[];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toUpcoming = (c: Client, dateStr: string | null) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      if (next < today) next.setFullYear(today.getFullYear() + 1);
      const days = Math.round((next.getTime() - today.getTime()) / 86400000);
      if (days > daysAhead) return null;
      return { ...c, nextDate: next.toISOString().slice(0, 10), daysUntil: days };
    };

    const birthdays = all
      .map((c) => toUpcoming(c, c.birthday))
      .filter((x): x is Client & { nextDate: string; daysUntil: number } => x !== null)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    const anniversaries = all
      .map((c) => toUpcoming(c, c.house_anniversary))
      .filter((x): x is Client & { nextDate: string; daysUntil: number } => x !== null)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return { birthdays, anniversaries };
  },
};

// ─── Campaign DB ─────────────────────────────────────────────────────────────

export const campaignDb = {
  async log(opts: {
    subject: string;
    body: string;
    recipientCount: number;
    sentCount: number;
    failedCount: number;
  }): Promise<void> {
    await ensureSchema();
    await sql()`
      INSERT INTO email_campaigns (subject, body, recipient_count, sent_count, failed_count)
      VALUES (${opts.subject}, ${opts.body}, ${opts.recipientCount}, ${opts.sentCount}, ${opts.failedCount})
    `;
  },

  async recent(limit = 10): Promise<{
    id: number; subject: string; body: string;
    recipient_count: number; sent_count: number;
    failed_count: number; sent_at: string;
  }[]> {
    await ensureSchema();
    return (await sql()`
      SELECT * FROM email_campaigns ORDER BY sent_at DESC LIMIT ${limit}
    `) as { id: number; subject: string; body: string; recipient_count: number; sent_count: number; failed_count: number; sent_at: string; }[];
  },
};
