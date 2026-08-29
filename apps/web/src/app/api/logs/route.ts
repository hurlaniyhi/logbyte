import { NextResponse } from "next/server";
import * as z from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { TokenModel } from "@/models/Token";
import { LogModel, LOG_LEVELS } from "@/models/Log";
import { getOptionalSession } from "@/lib/dal";

// Any JSON-serializable value: an object, an array, a stringified JSON blob, or a primitive.
const metaSchema = z.union([
  z.record(z.string(), z.unknown()),
  z.array(z.unknown()),
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

const ingestSchema = z.object({
  token: z.string().min(1),
  key: z.string().min(1),
  level: z.enum(LOG_LEVELS),
  message: z.string().min(1),
  meta: metaSchema.optional(),
  timestamp: z.string().optional(),
});

// The SDK sends logs from arbitrary origins (any app that installs it, browser or
// server), authenticated by the token in the body rather than cookies, so this
// ingestion endpoint intentionally allows cross-origin requests from anywhere.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function corsJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, { ...init, headers: { ...CORS_HEADERS, ...init?.headers } });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return corsJson({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }

  await connectToDatabase();

  const token = await TokenModel.findOne({ token: parsed.data.token }).lean();
  if (!token) {
    return corsJson({ error: "Invalid token" }, { status: 401 });
  }

  const log = await LogModel.create({
    tokenId: token._id,
    userId: token.userId,
    key: parsed.data.key,
    level: parsed.data.level,
    message: parsed.data.message,
    meta: parsed.data.meta,
  });

  return corsJson({ id: log._id.toString() }, { status: 201 });
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
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      // `key` is a discrete identifier (e.g. a service name), so match it exactly
      // rather than by substring — otherwise "test-12" would also match "test-123".
      { key: { $regex: `^${escaped}$`, $options: "i" } },
      { message: { $regex: escaped, $options: "i" } },
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
