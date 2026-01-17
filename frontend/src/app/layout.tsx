import type { ReactNode } from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Arimo } from "next/font/google";
import { CollectionsProvider } from "@/components/collections/CollectionsStore";
import "./globals.css";

const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Pin-It",
  description: "Restaurant pins from screenshots",
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ClerkProvider afterSignInUrl="/" afterSignUpUrl="/" afterSignOutUrl="/sign-in">
      <html lang="en">
        <body className={`${arimo.variable} antialiased`}>
          <CollectionsProvider>{children}</CollectionsProvider>
        </body>
      </html>
      
    </ClerkProvider>
  );
}