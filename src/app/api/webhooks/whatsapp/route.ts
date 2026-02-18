import { prisma } from "@/lib/prisma";
import { addDays, set } from "date-fns";
import { NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "";

type IncomingPayload = {
  eventId?: string;
  messageId?: string;
  from?: string;
  text?: string;
  timestamp?: string;
};

function extractPartySize(text: string): number | null {
  const m = text.match(/\b(\d{1,2})\b/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 1 || n > 20) return null;
  return n;
}

function extractDateTime(text: string): Date | null {
  const lower = text.toLowerCase();
  const hourMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\b/);
  if (!hourMatch) return null;

  const hour = Number(hourMatch[1]);
  const minute = Number(hourMatch[2] ?? "0");
  if (hour > 23 || minute > 59) return null;

  let base = new Date();
  if (lower.includes("yarın") || lower.includes("yarin")) {
    base = addDays(base, 1);
  }

  return set(base, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
}

async function createReservationForConversation(waUserId: string) {
  const convo = await prisma.conversation.findUnique({ where: { waUserId } });
  if (!convo || !convo.partySize || !convo.reservedAt) return null;

  const table = await prisma.table.findFirst({
    where: {
      isActive: true,
      capacity: { gte: convo.partySize },
    },
    orderBy: { capacity: "asc" },
  });

  if (!table) return { error: "Uygun masa bulunamadı." };

  const created = await prisma.reservation.create({
    data: {
      customerName: convo.customerName ?? "WhatsApp Müşterisi",
      customerPhone: waUserId,
      partySize: convo.partySize,
      reservedAt: convo.reservedAt,
      note: convo.note ?? "WhatsApp bot üzerinden",
      tableId: table.id,
      status: "confirmed",
    },
  });

  await prisma.conversation.update({
    where: { waUserId },
    data: { state: "idle", partySize: null, reservedAt: null, note: null },
  });

  return { reservation: created, table };
}

async function processMessage(payload: IncomingPayload) {
  const waUserId = payload.from?.trim();
  const text = payload.text?.trim();
  if (!waUserId || !text) {
    return { reply: "Mesaj formatı eksik." };
  }

  const convo = await prisma.conversation.upsert({
    where: { waUserId },
    create: { waUserId },
    update: {},
  });

  await prisma.message.create({
    data: {
      provider: "whatsapp",
      direction: "in",
      externalId: payload.messageId,
      waUserId,
      body: text,
      conversationId: convo.id,
    },
  });

  const l = text.toLowerCase();

  if (l.includes("rezervasyon")) {
    await prisma.conversation.update({
      where: { waUserId },
      data: { state: "awaiting_party_size" },
    });
    return { reply: "Kaç kişilik rezervasyon istiyorsunuz?" };
  }

  if (convo.state === "awaiting_party_size") {
    const partySize = extractPartySize(text);
    if (!partySize) return { reply: "Kişi sayısını rakamla yazar mısın? (örn: 4)" };

    await prisma.conversation.update({
      where: { waUserId },
      data: { partySize, state: "awaiting_datetime" },
    });
    return { reply: "Tarih/saat gönderir misin? (örn: yarın 20:00)" };
  }

  if (convo.state === "awaiting_datetime") {
    const reservedAt = extractDateTime(text);
    if (!reservedAt) {
      return { reply: "Saat bilgisini anlayamadım. Örn: bugün 19:30 veya yarın 20:00" };
    }

    await prisma.conversation.update({
      where: { waUserId },
      data: { reservedAt, state: "awaiting_confirmation" },
    });

    return {
      reply: `Onaylıyor musunuz? ${convo.partySize} kişi için ${reservedAt.toLocaleString("tr-TR")}. "evet" yazın.`,
    };
  }

  if (convo.state === "awaiting_confirmation") {
    if (l.includes("evet") || l.includes("onay")) {
      const result = await createReservationForConversation(waUserId);
      if (!result || "error" in result) {
        return { reply: result?.error ?? "Rezervasyon oluşturulamadı." };
      }

      return {
        reply: `Rezervasyon tamam ✅ Masa: ${result.table.name}`,
      };
    }

    if (l.includes("iptal") || l.includes("hayır") || l.includes("hayir")) {
      await prisma.conversation.update({
        where: { waUserId },
        data: { state: "idle", partySize: null, reservedAt: null, note: null },
      });
      return { reply: "Tamam, işlemi iptal ettim." };
    }

    return { reply: 'Onay için "evet", iptal için "iptal" yazabilirsiniz.' };
  }

  return { reply: 'Rezervasyon başlatmak için "rezervasyon" yazın.' };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && challenge && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ ok: false }, { status: 403 });
}

export async function POST(req: Request) {
  const token = req.headers.get("x-webhook-token");
  if (VERIFY_TOKEN && token !== VERIFY_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = (await req.json()) as IncomingPayload;
  const externalId = payload.eventId || payload.messageId;

  if (!externalId) {
    return NextResponse.json({ error: "missing external id" }, { status: 400 });
  }

  const eventCreate = await prisma.webhookEvent
    .create({
      data: {
        provider: "whatsapp",
        externalId,
        payload: JSON.stringify(payload),
      },
    })
    .catch(() => null);

  if (!eventCreate) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const { reply } = await processMessage(payload);

  await prisma.message.create({
    data: {
      provider: "whatsapp",
      direction: "out",
      waUserId: payload.from || "unknown",
      body: reply,
    },
  });

  return NextResponse.json({
    ok: true,
    reply,
    nextAction: "n8n should send this reply back to WhatsApp provider",
  });
}
