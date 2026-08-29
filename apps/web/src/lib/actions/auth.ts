"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { createSession, deleteSession } from "@/lib/session";
import { LoginFormSchema, SignupFormSchema, type FormState } from "@/lib/definitions";

export async function signup(_state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = SignupFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  await connectToDatabase();

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    return { message: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ email, passwordHash });

  await createSession({ userId: user._id.toString(), email: user.email });
  redirect("/dashboard/tokens");
}

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  await connectToDatabase();

  const user = await UserModel.findOne({ email });
  if (!user) {
    return { message: "Invalid email or password." };
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return { message: "Invalid email or password." };
  }

  await createSession({ userId: user._id.toString(), email: user.email });
  redirect("/dashboard/logs");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
