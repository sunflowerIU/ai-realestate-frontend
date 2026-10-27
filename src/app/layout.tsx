import type { Metadata } from "next";
import "./globals.css";
import "../styles/app.css";
import "./marketing.css";
import "./dashboard-theme.css";
import { ToastViewport } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: { default: "Copy Kalam — Find the match in your records", template: "%s | Copy Kalam" },
  description: "Copy Kalam is building a smarter workspace for real estate agents in Nepal to connect buyer requests and property records, find matches, and spot possible deals.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>{children}<ToastViewport /></body></html>;
}
