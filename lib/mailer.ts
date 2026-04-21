import nodemailer from "nodemailer";
import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8", "1.0.0.1", "8.8.4.4"]);

export function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user || !pass) {
    return null;
  }
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

export function getFromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "";
}

export function renderTemplate(template: string, vars: Record<string, string | null | undefined>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}
