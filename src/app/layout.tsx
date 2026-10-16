import type { Metadata } from "next";
import { Anton, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { LocaleProvider } from "@/lib/i18n";
import { AuthProvider } from "@/features/auth/state/auth-context";
import "./globals.css";

const anton = Anton({ variable: "--font-anton", subsets: ["latin"], weight: "400" });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Daily Financial Companion | Your money, explained every morning.",
  description:
    "A daily WhatsApp briefing personalised from your financial profile. Financial guidance and education, not investment advice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <AuthProvider>
            <LocaleProvider>{children}</LocaleProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
