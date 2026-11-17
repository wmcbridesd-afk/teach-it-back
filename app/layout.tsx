import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teach It Back: learn it by teaching it",
  description:
    "Upload your course material, teach it to a curious AI student, and get a Mistake Map showing exactly what you've got, what's shaky, and how to fix it.",
  openGraph: {
    title: "Teach It Back: learn it by teaching it",
    description:
      "Upload your course material, teach it to a curious AI student, and get a Mistake Map showing exactly what you've got, what's shaky, and how to fix it.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
