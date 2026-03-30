import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rocket Workflow App",
  description: "Mobile-first employee and contractor portal MVP"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#b4411f"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
