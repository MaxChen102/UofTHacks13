import type { ReactNode } from "react";
import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "PlaceSnap Planner",
  description: "Screenshot places, detect locations, and build itineraries."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <header className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-lg text-white">
                📍
              </div>
              <div>
                <p className="text-sm font-semibold">PlaceSnap</p>
                <p className="text-xs text-gray-500">
                  Photo-to-itinerary planner
                </p>
              </div>
            </div>
            <SignedOut>
              <SignInButton>
                <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}