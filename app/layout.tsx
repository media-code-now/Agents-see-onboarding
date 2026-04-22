import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";
import AuthProvider from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SEO Agency Onboarding System",
  description: "Organize client onboarding, security reviews, and team access",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className={`${inter.variable} font-sans h-full overflow-hidden bg-black`}>
        <AuthProvider>
          <AppProvider>
            <div className="flex h-full w-full">
              <Sidebar />
              <main className="flex-1 overflow-y-auto bg-black w-full">
                <div className="min-h-full w-full">
                  {children}
                </div>
              </main>
            </div>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
