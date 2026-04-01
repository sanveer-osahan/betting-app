import type { Metadata } from "next";
import KeepAlive from "@/components/KeepAlive";
import "./globals.css";

export const metadata: Metadata = {
  title: "Betting App",
  description: "A simple betting application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen">
        <KeepAlive />
        {children}
      </body>
    </html>
  );
}
