import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AppShell } from "@/components/AppShell";

export default async function AppGroupLayout({
  children,
}: PropsWithChildren) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <AppShell>{children}</AppShell>;
  
}

