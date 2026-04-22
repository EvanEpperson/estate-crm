import { NextRequest, NextResponse } from "next/server";
import { campaignDb, clientDb } from "@/lib/db";
import { getFromAddress, getTransporter, renderTemplate } from "@/lib/mailer";

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "application/pdf",
]);
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 20 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const subject = String(form.get("subject") ?? "");
  const body = String(form.get("body") ?? "");
  const recipientIds = JSON.parse(String(form.get("recipientIds") ?? "[]"));

  if (!subject || !body) {
    return NextResponse.json({ error: "subject and body are required" }, { status: 400 });
  }
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
    return NextResponse.json({ error: "Select at least one recipient" }, { status: 400 });
  }

  const rawFiles = form.getAll("attachments").filter((v): v is File => v instanceof File);
  let totalBytes = 0;
  const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
  for (const f of rawFiles) {
    if (!ALLOWED_ATTACHMENT_TYPES.has(f.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${f.name} (${f.type || "unknown"})` }, { status: 400 });
    }
    if (f.size > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json({ error: `${f.name} is larger than 10 MB.` }, { status: 400 });
    }
    totalBytes += f.size;
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      return NextResponse.json({ error: "Attachments exceed 20 MB total." }, { status: 400 });
    }
    attachments.push({
      filename: f.name,
      content: Buffer.from(await f.arrayBuffer()),
      contentType: f.type,
    });
  }

  const transporter = getTransporter();
  if (!transporter) {
    return NextResponse.json(
      { error: "Email is not configured. Add SMTP_* values to your environment variables and redeploy." },
      { status: 400 }
    );
  }

  const from = getFromAddress();
  const clientList = await Promise.all(recipientIds.map((id: number) => clientDb.get(Number(id))));
  const recipients = clientList.filter((c): c is NonNullable<typeof c> => !!c && !!c.email);

  const results: { id: number; email: string; ok: boolean; error?: string }[] = [];

  for (const c of recipients) {
    const vars = {
      first_name: c.first_name,
      last_name: c.last_name,
      full_name: `${c.first_name} ${c.last_name}`,
      email: c.email,
      city: c.city,
    };
    const rendered = renderTemplate(body, vars);
    const subj = renderTemplate(subject, vars);
    const html = `<div style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.6;color:#111;max-width:600px">${rendered
      .split(/\n\n+/)
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("")}</div>`;

    try {
      await transporter.sendMail({ from, to: c.email!, subject: subj, text: rendered, html, attachments });
      results.push({ id: c.id, email: c.email!, ok: true });
    } catch (e) {
      results.push({ id: c.id, email: c.email!, ok: false, error: (e as Error).message });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;
  await campaignDb.log({ subject, body, recipientCount: recipients.length, sentCount: sent, failedCount: failed });

  return NextResponse.json({ sent, failed, results });
}
