import type { ReactNode } from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Arimo } from "next/font/google";
import { CollectionsProvider } from "@/components/collections/CollectionsStore";
import { UserRatingsProvider } from "@/components/ratings/UserRatingsStore";
import "./globals.css";

const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Vibely",
  description: "Restaurant pins from screenshots",
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${arimo.variable} antialiased`}>
        <ClerkProvider
          afterSignInUrl="/"
          afterSignUpUrl="/"
          afterSignOutUrl="/sign-in"
        >
          <UserRatingsProvider>
            <CollectionsProvider>{children}</CollectionsProvider>
          </UserRatingsProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}