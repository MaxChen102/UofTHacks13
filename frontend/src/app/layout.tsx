import type { ReactNode } from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Arimo, Alice } from "next/font/google";
import { CollectionsProvider } from "@/components/collections/CollectionsStore";
import { PinsProvider } from "@/components/pins/PinsStore";
import { UserRatingsProvider } from "@/components/ratings/UserRatingsStore";
import "./globals.css";

const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const alice = Alice({
  variable: "--font-alice",
  subsets: ["latin"],
  weight: ["400"],
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
      <body className={`${arimo.variable} ${alice.variable} antialiased`}>
        <ClerkProvider
          afterSignInUrl="/"
          afterSignUpUrl="/"
          afterSignOutUrl="/sign-in"
        >
          <UserRatingsProvider>
            <PinsProvider>
              <CollectionsProvider>{children}</CollectionsProvider>
            </PinsProvider>
          </UserRatingsProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}