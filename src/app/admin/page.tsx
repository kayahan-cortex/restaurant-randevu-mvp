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
  const [allTables, setAllTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [resRes, tableRes] = await Promise.all([
        fetch("/api/reservations"),
        fetch("/api/reservations/tables")
      ]);
      
      if (resRes.ok) {
        const data = await resRes.json();
        setReservations(data.reservations ?? []);
      }
      if (tableRes.ok) {
        const data = await tableRes.json();
        setAllTables(data.tables ?? []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayRes = reservations.filter(r => r.reservedAt.startsWith(today));
    const totalGuests = reservations.reduce((sum, r) => sum + r.partySize, 0);
    
    // Doluluk Oranı Hesaplama (Bugünkü rezervasyonlara göre masa bazlı)
    const uniqueTablesToday = new Set(todayRes.map(r => r.table.id)).size;
    const totalTableCount = allTables.length || 1;
    const occupancyRate = Math.round((uniqueTablesToday / totalTableCount) * 100);

    return { 
        total: reservations.length, 
        today: todayRes.length, 
        guests: totalGuests, 
        occupancy: occupancyRate 
    };
  }, [reservations, allTables]);

  const grouped = useMemo(() => {
    return [...reservations].sort((a,b) => new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime())
      .reduce<Record<string, Reservation[]>>((acc, item) => {
        const date = new Date(item.reservedAt).toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        acc[date] = acc[date] || [];
        acc[date].push(item);
        return acc;
      }, {});
  }, [reservations]);

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Lumina <span className="text-blue-600">Yönetim</span></h1>
            <p className="text-slate-500 font-medium">Rezervasyon trafiğini buradan izleyin.</p>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Yenile
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-100">
                <p className="text-blue-100 text-sm font-bold uppercase mb-1">Bugünkü Doluluk</p>
                <h3 className="text-5xl font-black">%{stats.occupancy}</h3>
                <div className="w-full bg-blue-500 h-2 rounded-full mt-4 overflow-hidden">
                    <div className="bg-white h-full transition-all duration-1000" style={{ width: `${stats.occupancy}%` }}></div>
                </div>
                <p className="text-blue-100 mt-2 font-medium">{stats.today} Rezervasyon</p>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
               <div className="space-y-4">
                  <div className="flex items-center justify-between"><span className="text-slate-600 font-medium text-sm">Toplam Kayıt</span><span className="font-bold text-slate-900">{stats.total}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-600 font-medium text-sm">Toplam Misafir</span><span className="font-bold text-slate-900">{stats.guests}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-600 font-medium text-sm">Toplam Masa</span><span className="font-bold text-slate-900">{allTables.length}</span></div>
               </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex h-64 items-center justify-center bg-white rounded-3xl border border-slate-100"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600"></div></div>
            ) : (
              <div className="space-y-10">
                {Object.entries(grouped).length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 font-medium">Henüz rezervasyon kaydı bulunmuyor.</div>
                ) : (
                    Object.entries(grouped).map(([day, list]) => (
                      <div key={day}>
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-3">{day}<div className="h-px flex-1 bg-slate-200"></div></h2>
                        <div className="grid gap-4 md:grid-cols-2">
                          {list.map((r) => (
                            <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-xl transition-all">
                              <div className="flex justify-between mb-4"><div><h3 className="font-bold text-lg">{r.customerName}</h3><p className="text-blue-600 text-sm font-bold">{r.customerPhone}</p></div><div className="bg-slate-50 px-3 py-1 rounded-lg text-xs font-black uppercase">{r.table.name}</div></div>
                              <div className="flex items-center gap-4 text-slate-500 text-sm bg-slate-50/50 p-3 rounded-xl">
                                 <div className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{new Date(r.reservedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</div>
                                 <div className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>{r.partySize} Kişi</div>
                              </div>
                              {r.note && <div className="mt-3 bg-yellow-50 text-yellow-800 text-xs p-3 rounded-xl border border-yellow-100">{r.note}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
