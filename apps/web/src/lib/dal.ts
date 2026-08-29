import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const verifySession = cache(async () => {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  return { userId: session.userId, email: session.email };
});

/** Like verifySession, but returns null instead of redirecting. For use in Route Handlers. */
export async function getOptionalSession() {
  const session = await getSession();
  if (!session?.userId) return null;
  return { userId: session.userId, email: session.email };
}
