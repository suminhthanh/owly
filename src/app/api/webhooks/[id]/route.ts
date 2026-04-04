import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const webhook = await prisma.webhook.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(webhook);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.webhook.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
