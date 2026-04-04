import { NextRequest, NextResponse } from "next/server";
import { handleCallEnd } from "@/lib/channels/phone";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const callSid = formData.get("CallSid") as string;
  const callDuration = parseInt(formData.get("CallDuration") as string) || 0;
  const callStatus = formData.get("CallStatus") as string;

  if (callStatus === "completed" || callStatus === "failed" || callStatus === "no-answer") {
    await handleCallEnd(callSid, callDuration);
  }

  return NextResponse.json({ ok: true });
}
