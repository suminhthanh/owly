import { NextRequest, NextResponse } from "next/server";
import { handleIncomingCall } from "@/lib/channels/phone";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const from = formData.get("From") as string;
  const callSid = formData.get("CallSid") as string;

  const twiml = await handleIncomingCall(from, callSid);

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
