import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const departmentId = searchParams.get("departmentId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (priority && priority !== "all") {
      where.priority = priority;
    }

    if (departmentId && departmentId !== "all") {
      where.departmentId = departmentId;
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        conversation: {
          select: {
            id: true,
            customerName: true,
            channel: true,
            status: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      priority,
      status,
      conversationId,
      departmentId,
      assignedToId,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Ticket title is required" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        priority: priority || "medium",
        status: status || "open",
        ...(conversationId && { conversationId }),
        ...(departmentId && { departmentId }),
        ...(assignedToId && { assignedToId }),
      },
      include: {
        conversation: {
          select: {
            id: true,
            customerName: true,
            channel: true,
            status: true,
          },
        },
        department: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Failed to create ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
