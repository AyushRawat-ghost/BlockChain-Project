import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
});

export const metadata: Metadata = {
  title: "AETHERIS | Decentralized Healthcare Neural Interface",
  description: "Secure, on-chain patient data management for the year 2077.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${orbitron.variable} ${rajdhani.variable} antialiased selection:bg-cyber-blue selection:text-black`}
      >
        <div className="scanline" />
        <div className="crt-overlay" />
        <div className="min-h-screen bg-cyber-black text-white relative z-10">
          {/* Neon Grid Background */}
          <div className="fixed inset-0 bg-[linear-gradient(rgba(0,243,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
          
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
