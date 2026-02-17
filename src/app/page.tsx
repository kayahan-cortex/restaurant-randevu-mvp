"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Table = {
  id: string;
  name: string;
  capacity: number;
};

type Reservation = {
  id: string;
  customerName: string;
  customerPhone: string;
  note?: string;
  partySize: number;
  reservedAt: string;
  table: Table;
};

export default function Home() {
  const [tables, setTables] = useState<Table[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    partySize: 2,
    tableId: "",
    reservedAt: "",
    note: "",
  });

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/reservations");
    const data = await res.json();
    setReservations(data.reservations ?? []);
    setTables(data.tables ?? []);
    if (!form.tableId && data.tables?.[0]?.id) {
      setForm((prev) => ({ ...prev, tableId: data.tables[0].id }));
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    return reservations.reduce<Record<string, Reservation[]>>((acc, item) => {
      const date = new Date(item.reservedAt).toLocaleDateString("tr-TR");
      acc[date] = acc[date] || [];
      acc[date].push(item);
      return acc;
    }, {});
  }, [reservations]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        reservedAt: new Date(form.reservedAt).toISOString(),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Kayıt sırasında hata oldu");
      return;
    }

    setForm((prev) => ({
      ...prev,
      customerName: "",
      customerPhone: "",
      note: "",
    }));
    await loadData();
  }

  return (
    <main className="mx-auto max-w-6xl p-6 md:p-10">
      <h1 className="text-3xl font-bold">Restaurant Randevu MVP</h1>
      <p className="mt-2 text-sm text-gray-600">
        Hızlı rezervasyon alma + çakışma kontrolü + masa kapasite kontrolü
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section className="rounded-2xl border p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Yeni Rezervasyon</h2>
          <form className="space-y-3" onSubmit={onSubmit}>
            <input
              className="w-full rounded-lg border p-2"
              placeholder="Müşteri adı"
              value={form.customerName}
              onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
              required
            />
            <input
              className="w-full rounded-lg border p-2"
              placeholder="Telefon"
              value={form.customerPhone}
              onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))}
              required
            />
            <input
              type="number"
              min={1}
              max={20}
              className="w-full rounded-lg border p-2"
              placeholder="Kişi sayısı"
              value={form.partySize}
              onChange={(e) => setForm((p) => ({ ...p, partySize: Number(e.target.value) }))}
              required
            />
            <select
              className="w-full rounded-lg border p-2"
              value={form.tableId}
              onChange={(e) => setForm((p) => ({ ...p, tableId: e.target.value }))}
              required
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (kapasite {t.capacity})
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              className="w-full rounded-lg border p-2"
              value={form.reservedAt}
              onChange={(e) => setForm((p) => ({ ...p, reservedAt: e.target.value }))}
              required
            />
            <textarea
              className="w-full rounded-lg border p-2"
              placeholder="Not (opsiyonel)"
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="w-full rounded-lg bg-black p-2 text-white" type="submit">
              Kaydet
            </button>
          </form>
        </section>

        <section className="rounded-2xl border p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Rezervasyonlar</h2>
          {loading ? (
            <p>Yükleniyor...</p>
          ) : Object.keys(grouped).length === 0 ? (
            <p>Henüz rezervasyon yok.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([day, list]) => (
                <div key={day}>
                  <h3 className="font-medium">{day}</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    {list.map((r) => (
                      <li key={r.id} className="rounded-lg border p-2">
                        <strong>{r.customerName}</strong> ({r.partySize} kişi) - {r.table.name}
                        <br />
                        {new Date(r.reservedAt).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        {r.customerPhone}
                        {r.note ? ` · ${r.note}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
