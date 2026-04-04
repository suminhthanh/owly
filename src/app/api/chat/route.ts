import { NextRequest, NextResponse } from "next/server";
import { chat, createNewConversation } from "@/lib/ai/engine";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, conversationId, channel, customerName, customerContact } = body;

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  let convId = conversationId;

  // Create new conversation if not provided
  if (!convId) {
    const conversation = await createNewConversation(
      channel || "api",
      customerName || "API User",
      customerContact || ""
    );
    convId = conversation.id;
  }

  const response = await chat(convId, message);

  return NextResponse.json({
    conversationId: convId,
    response,
  });
}
