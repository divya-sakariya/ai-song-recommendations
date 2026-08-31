import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import ConsentLog from "@/models/ConsentLog";

// UPLOAD-04 (DPDP): records that the user actively consented before the
// first AI-processing call, for audit purposes.
export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  await connectToDatabase();
  await ConsentLog.create({ userId, purpose: "ai_mood_analysis" });

  return NextResponse.json({ ok: true });
}
