import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const tables = await prisma.table.findMany({
    where: { isActive: true },
    orderBy: { capacity: "asc" },
  });

  return NextResponse.json({ tables });
}
