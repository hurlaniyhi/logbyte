import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import * as z from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { TokenModel } from "@/models/Token";
import { getOptionalSession } from "@/lib/dal";

function generateToken(): string {
  return `lb_${randomBytes(24).toString("hex")}`;
}

export async function GET() {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const tokens = await TokenModel.find({ userId: session.userId }).sort({ createdAt: -1 }).lean();

  return NextResponse.json({
    tokens: tokens.map((t) => ({
      id: t._id.toString(),
      token: t.token,
      alias: t.alias,
      createdAt: t.createdAt,
    })),
  });
}

const createTokenSchema = z.object({
  alias: z.string().trim().min(1, "Alias is required").max(64, "Alias is too long"),
});

export async function POST(request: Request) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createTokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  await connectToDatabase();
  const token = await TokenModel.create({
    userId: session.userId,
    alias: parsed.data.alias,
    token: generateToken(),
  });

  return NextResponse.json(
    {
      token: {
        id: token._id.toString(),
        token: token.token,
        alias: token.alias,
        createdAt: token.createdAt,
      },
    },
    { status: 201 },
  );
}
