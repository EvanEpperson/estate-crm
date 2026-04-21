import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/nav";

export const metadata: Metadata = {
  title: "Real Estate CRM",
  description: "Client relationships, organized.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen gradient-bg">
        <div className="flex min-h-screen">
          <Nav />
          <main className="flex-1 min-w-0">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
