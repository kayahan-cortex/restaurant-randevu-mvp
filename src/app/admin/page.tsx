"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/reservations");
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations ?? []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const grouped = useMemo(() => {
    return reservations.reduce<Record<string, Reservation[]>>((acc, item) => {
      const date = new Date(item.reservedAt).toLocaleDateString("tr-TR", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      acc[date] = acc[date] || [];
      acc[date].push(item);
      return acc;
    }, {});
  }, [reservations]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 font-sans text-gray-800">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
            Lumina <span className="text-blue-600">Admin</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl">
            Tüm rezervasyonları yönetin.
          </p>
        </header>

        <section className="space-y-6">
          <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg rounded-3xl p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-2xl font-bold text-gray-800">Tüm Rezervasyonlar</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                {reservations.length} Toplam
              </span>
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : Object.keys(grouped).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Kayıt Bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">Henüz planlanmış bir randevu yok.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(grouped).map(([day, list]) => (
                  <div key={day} className="relative">
                    <div className="sticky top-0 z-10 mb-4 inline-block bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-gray-100 text-sm font-bold text-gray-700 shadow-sm">
                      {day}
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((r) => (
                        <div
                          key={r.id}
                          className="group relative flex flex-col justify-between rounded-2xl bg-white p-5 border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-blue-100"
                        >
                          <div className="mb-4">
                            <div className="flex items-start justify-between">
                              <h4 className="font-bold text-gray-900 text-lg">{r.customerName}</h4>
                              <span className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                {r.partySize}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                              {r.customerPhone}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              </div>
                              <span className="font-semibold text-gray-800">
                                {new Date(r.reservedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                              {r.table.name}
                            </span>
                          </div>

                          {r.note && (
                            <div className="mt-3 rounded-lg bg-yellow-50/50 p-2.5 text-xs text-yellow-800 border border-yellow-100/50">
                              <span className="font-semibold">Not:</span> {r.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
