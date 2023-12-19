import { twMerge } from "tailwind-merge";
import "./globals.css";
import { Providers } from "./providers";
import { IBM_Plex_Mono } from "next/font/google";

export const metadata = {
  title: "juice-v4",
};

const ibm = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ibmMono",
  weight: ["400", "600"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={twMerge(ibm.variable, "bg-black text-zinc-50 font-mono")}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
