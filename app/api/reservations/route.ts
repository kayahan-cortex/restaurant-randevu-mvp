import { prisma } from "@/lib/prisma";
import { addMinutes } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";

const reservationSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  note: z.string().optional(),
  partySize: z.coerce.number().int().min(1).max(20),
  tableId: z.string().min(1),
  reservedAt: z.string().datetime(),
});

export async function GET() {
  const reservations = await prisma.reservation.findMany({
    orderBy: { reservedAt: "asc" },
    include: { table: true },
    take: 100,
  });

  const tables = await prisma.table.findMany({
    where: { isActive: true },
    orderBy: { capacity: "asc" },
  });

  return NextResponse.json({ reservations, tables });
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = reservationSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const reservedAt = new Date(data.reservedAt);
  const end = addMinutes(reservedAt, 120);

  const table = await prisma.table.findUnique({ where: { id: data.tableId } });
  if (!table || !table.isActive) {
    return NextResponse.json({ error: "Masa bulunamadı" }, { status: 404 });
  }
  if (table.capacity < data.partySize) {
    return NextResponse.json(
      { error: "Masa kapasitesi yetersiz" },
      { status: 400 },
    );
  }

  const existing = await prisma.reservation.findFirst({
    where: {
      tableId: data.tableId,
      status: { in: ["confirmed", "seated"] },
      AND: [
        { reservedAt: { lt: end } },
        { reservedAt: { gte: addMinutes(reservedAt, -120) } },
      ],
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Bu masa bu saatte dolu görünüyor" },
      { status: 409 },
    );
  }

  const created = await prisma.reservation.create({
    data: {
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      note: data.note,
      partySize: data.partySize,
      tableId: data.tableId,
      reservedAt,
    },
    include: { table: true },
  });

  return NextResponse.json(created, { status: 201 });
}
