import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Sign up — logbyte" };

export default function SignupPage() {
  return <SignupForm />;
}
