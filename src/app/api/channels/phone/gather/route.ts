import { NextRequest, NextResponse } from "next/server";
import { handleSpeechInput } from "@/lib/channels/phone";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const speechResult = formData.get("SpeechResult") as string;
  const conversationId = request.nextUrl.searchParams.get("conversationId") || "";
  const callSid = request.nextUrl.searchParams.get("callSid") || formData.get("CallSid") as string;

  const twiml = await handleSpeechInput(speechResult, conversationId, callSid);

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
