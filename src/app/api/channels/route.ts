import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CHANNEL_TYPES = ["whatsapp", "email", "phone"];

export async function GET() {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { type: "asc" },
    });

    const channelMap = new Map(channels.map((ch) => [ch.type, ch]));
    const result = CHANNEL_TYPES.map((type) => {
      const existing = channelMap.get(type);
      if (existing) return existing;
      return {
        id: null,
        type,
        isActive: false,
        config: {},
        status: "disconnected",
        createdAt: null,
        updatedAt: null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, isActive, config } = body;

    if (!type || !CHANNEL_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid channel type. Must be one of: " + CHANNEL_TYPES.join(", ") },
        { status: 400 }
      );
    }

    const channel = await prisma.channel.upsert({
      where: { type },
      update: {
        isActive: typeof isActive === "boolean" ? isActive : undefined,
        config: config ?? undefined,
      },
      create: {
        type,
        isActive: typeof isActive === "boolean" ? isActive : false,
        config: config ?? {},
        status: "disconnected",
      },
    });

    return NextResponse.json(channel, { status: 200 });
  } catch (error) {
    console.error("Failed to save channel:", error);
    return NextResponse.json(
      { error: "Failed to save channel" },
      { status: 500 }
    );
  }
}
