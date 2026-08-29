import { NextResponse } from "next/server";
import * as z from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { TokenModel } from "@/models/Token";
import { LogModel, LOG_LEVELS } from "@/models/Log";
import { getOptionalSession } from "@/lib/dal";

const ingestSchema = z.object({
  token: z.string().min(1),
  key: z.string().min(1),
  level: z.enum(LOG_LEVELS),
  message: z.string().min(1),
  meta: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  await connectToDatabase();

  const token = await TokenModel.findOne({ token: parsed.data.token }).lean();
  if (!token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const log = await LogModel.create({
    tokenId: token._id,
    userId: token.userId,
    key: parsed.data.key,
    level: parsed.data.level,
    message: parsed.data.message,
    meta: parsed.data.meta,
  });

  return NextResponse.json({ id: log._id.toString() }, { status: 201 });
}

const MAX_PAGE_SIZE = 100;

export async function GET(request: Request) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const tokenId = url.searchParams.get("tokenId");
  if (!tokenId) {
    return NextResponse.json({ error: "tokenId is required" }, { status: 400 });
  }

  await connectToDatabase();

  const token = await TokenModel.findOne({ _id: tokenId, userId: session.userId }).lean();
  if (!token) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  const levelsParam = url.searchParams.get("levels");
  const levels = levelsParam
    ? levelsParam.split(",").filter((l): l is (typeof LOG_LEVELS)[number] => (LOG_LEVELS as readonly string[]).includes(l))
    : undefined;
  const search = url.searchParams.get("search")?.trim();
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(url.searchParams.get("pageSize")) || 25));

  const query: Record<string, unknown> = { tokenId };
  if (levels?.length) {
    query.level = { $in: levels };
  }
  if (search) {
    query.$or = [
      { key: { $regex: search, $options: "i" } },
      { message: { $regex: search, $options: "i" } },
    ];
  }

  const [logs, total] = await Promise.all([
    LogModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    LogModel.countDocuments(query),
  ]);

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l._id.toString(),
      key: l.key,
      level: l.level,
      message: l.message,
      meta: l.meta ?? null,
      createdAt: l.createdAt,
    })),
    total,
    page,
    pageSize,
  });
}
