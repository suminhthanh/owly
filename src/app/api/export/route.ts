import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") || "json";
  const type = request.nextUrl.searchParams.get("type") || "conversations";

  if (type === "conversations") {
    const conversations = await prisma.conversation.findMany({
      include: {
        messages: true,
        tickets: true,
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      const csv = conversationsToCSV(conversations);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="conversations-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(conversations);
  }

  if (type === "tickets") {
    const tickets = await prisma.ticket.findMany({
      include: {
        department: true,
        assignedTo: true,
        conversation: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      const csv = ticketsToCSV(tickets);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="tickets-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(tickets);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

function conversationsToCSV(conversations: unknown[]): string {
  const headers = [
    "ID",
    "Channel",
    "Customer Name",
    "Customer Contact",
    "Status",
    "Messages",
    "Created At",
    "Updated At",
  ];

  const rows = (conversations as Array<{
    id: string;
    channel: string;
    customerName: string;
    customerContact: string;
    status: string;
    messages: unknown[];
    createdAt: Date;
    updatedAt: Date;
  }>).map((c) => [
    c.id,
    c.channel,
    c.customerName,
    c.customerContact,
    c.status,
    c.messages.length.toString(),
    c.createdAt.toISOString(),
    c.updatedAt.toISOString(),
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");
}

function ticketsToCSV(tickets: unknown[]): string {
  const headers = [
    "ID",
    "Title",
    "Status",
    "Priority",
    "Department",
    "Assigned To",
    "Created At",
  ];

  const rows = (tickets as Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    department: { name: string } | null;
    assignedTo: { name: string } | null;
    createdAt: Date;
  }>).map((t) => [
    t.id,
    t.title,
    t.status,
    t.priority,
    t.department?.name || "",
    t.assignedTo?.name || "",
    t.createdAt.toISOString(),
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
