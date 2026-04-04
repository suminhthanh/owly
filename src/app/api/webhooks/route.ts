import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const webhooks = await prisma.webhook.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(webhooks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, url, method, headers, triggerOn } = body;

  if (!name || !url || !triggerOn) {
    return NextResponse.json(
      { error: "Name, URL, and triggerOn are required" },
      { status: 400 }
    );
  }

  const webhook = await prisma.webhook.create({
    data: {
      name,
      description: description || "",
      url,
      method: method || "POST",
      headers: headers || {},
      triggerOn,
    },
  });

  return NextResponse.json(webhook, { status: 201 });
}
