import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TokenModel } from "@/models/Token";
import { LogModel } from "@/models/Log";
import { getOptionalSession } from "@/lib/dal";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/tokens/[id]">) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  await connectToDatabase();
  const token = await TokenModel.findOne({ _id: id, userId: session.userId });
  if (!token) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  await Promise.all([TokenModel.deleteOne({ _id: id }), LogModel.deleteMany({ tokenId: id })]);

  return NextResponse.json({ ok: true });
}
