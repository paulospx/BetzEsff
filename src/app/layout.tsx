import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import { Nav } from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "🔮 ESFF — Football prediction league",
  description:
    "Guess match scores with friends across several championships. Each poll has its own fixtures, table, and race. Exact score 5 pts, correct result 3 pts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--ink)]">
        <AppProvider>
          <Nav />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">
            {children}
          </main>
          <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
            <p>
              Exact score = 5 pts · Correct winner/draw = 3 pts · Miss = 0
            </p>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
