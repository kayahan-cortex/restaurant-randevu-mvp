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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    try {
      const res = await fetch("/api/reservations/tables"); // We need a new endpoint for just tables
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables ?? []);
        if (!form.tableId && data.tables?.[0]?.id) {
          setForm((prev) => ({ ...prev, tableId: data.tables[0].id }));
        }
      } else {
        // Fallback to existing endpoint if we don't change API immediately
        const res2 = await fetch("/api/reservations");
        if (res2.ok) {
          const data2 = await res2.json();
          setTables(data2.tables ?? []);
          if (!form.tableId && data2.tables?.[0]?.id) {
            setForm((prev) => ({ ...prev, tableId: data2.tables[0].id }));
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
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
      setSuccess("Rezervasyonunuz başarıyla alındı!");
    } catch (err) {
      setError("Bir hata oluştu.");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 font-sans text-gray-800 flex items-center justify-center">
      <div className="mx-auto max-w-2xl w-full">
        {/* Header Section */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
            Lumina <span className="text-blue-600">Rezervasyon</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Modern, hızlı ve akıllı masa yönetimi. İşletmenizi geleceğe taşıyın.
          </p>
        </header>

        {/* Reservation Form (Glassmorphism Card) */}
        <section className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 md:p-8 transition-all hover:shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Yeni Randevu</h2>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            </div>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 px-1">Müşteri Adı Soyadı</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white/50 p-3.5 text-gray-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                placeholder="Örn: Ahmet Yılmaz"
                value={form.customerName}
                onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600 px-1">Telefon</label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white/50 p-3.5 text-gray-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="05XX XXX XX XX"
                  value={form.customerPhone}
                  onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600 px-1">Kişi Sayısı</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className="w-full rounded-xl border border-gray-200 bg-white/50 p-3.5 text-gray-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  value={form.partySize}
                  onChange={(e) => setForm((p) => ({ ...p, partySize: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 px-1">Tarih ve Saat</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl border border-gray-200 bg-white/50 p-3.5 text-gray-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                value={form.reservedAt}
                onChange={(e) => setForm((p) => ({ ...p, reservedAt: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 px-1">Masa Seçimi</label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white/50 p-3.5 pr-10 text-gray-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  value={form.tableId}
                  onChange={(e) => setForm((p) => ({ ...p, tableId: e.target.value }))}
                  required
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Kapasite: {t.capacity})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 px-1">Ek Notlar</label>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-gray-200 bg-white/50 p-3.5 text-gray-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 resize-none"
                placeholder="Özel istekler, alerjiler vb."
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-100 flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green-50 p-3 text-sm text-green-600 border border-green-100 flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <span>{success}</span>
              </div>
            )}

            <button
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] hover:shadow-blue-500/40 active:scale-[0.98]"
              type="submit"
            >
              Rezervasyonu Tamamla
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
