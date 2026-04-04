import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    const where = departmentId ? { departmentId } : {};

    const members = await prisma.teamMember.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        department: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, role, expertise, departmentId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Member name is required" },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Member email is required" },
        { status: 400 }
      );
    }

    if (!departmentId) {
      return NextResponse.json(
        { error: "Department is required" },
        { status: 400 }
      );
    }

    const member = await prisma.teamMember.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || "",
        role: role?.trim() || "member",
        expertise: expertise?.trim() || "",
        departmentId,
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Failed to create member:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}
