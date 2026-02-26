"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ImportCalculator from "./ImportCalculator";

type Role = "ADMIN" | "SALES";
type UserRow = { id: string; name: string; role: Role; phone: string };
type User = { id: string; name: string; role: Role };

type LeadStatus =
  | "Kontakt"
  | "Oferty wysłane"
  | "W trakcie"
  | "Depozyt"
  | "Kupiony"
  | "Wydane"
  | "Zastanawia się"
  | "Nie odbiera"
  | "Odpuszczony";

type ChecklistKey =
  | "umowa"
  | "depozyt"
  | "platnosc"
  | "dokumentyOdprawa"
  | "odprawaZaplacona"
  | "title"
  | "zleconyTransport"
  | "dostarczone"
  | "relist"
  | "czyNaprawiamy"
  | "tlumaczenia"
  | "opinia";

type Lead = {
  id: string;
  createdAt: number;
  name: string;
  phone: string;

  model?: string;
  year?: number;
  auctionUrl?: string;
  vin?: string;

  budgetPln?: number;
  status: LeadStatus;
  lastContactAt?: number;

  notes: string;
  ownerId?: string | null;

  checklist?: Partial<Record<ChecklistKey, boolean>>;
};

const STATUSES: LeadStatus[] = [
  "Kontakt",
  "Oferty wysłane",
  "W trakcie",
  "Depozyt",
  "Kupiony",
  "Wydane",
  "Zastanawia się",
  "Nie odbiera",
  "Odpuszczony",
];

const CHECKLIST: { key: ChecklistKey; label: string }[] = [
  { key: "umowa", label: "Umowa" },
  { key: "depozyt", label: "Depozyt" },
  { key: "platnosc", label: "Płatność" },
  { key: "dokumentyOdprawa", label: "Dokumenty do odprawy" },
  { key: "odprawaZaplacona", label: "Odprawa zapłacona" },
  { key: "title", label: "Title" },
  { key: "zleconyTransport", label: "Zlecony transport" },
  { key: "dostarczone", label: "Dostarczone" },
  { key: "relist", label: "Relist" },
  { key: "czyNaprawiamy", label: "Czy naprawiamy" },
  { key: "tlumaczenia", label: "Tłumaczenia" },
  { key: "opinia", label: "Opinia" },
];

function normalizePhone(p?: string) {
  return (p ?? "").replace(/\D/g, "");
}

/**
 * Dedupe po telefonie (cyfry). Jeśli brak telefonu -> name|role.
 * Sort: najpierw po numerze (jeśli jest), potem po imieniu.
 */
function dedupeAndSortUsers(list: UserRow[]) {
  const map = new Map<string, UserRow>();

  for (const u of list) {
    const phoneKey = normalizePhone(u.phone);
    const key = phoneKey || `${u.name}`.trim().toLowerCase() + "|" + u.role;
    if (!map.has(key)) map.set(key, u);
  }

  const arr = Array.from(map.values());

  arr.sort((a, b) => {
    const ap = normalizePhone(a.phone);
    const bp = normalizePhone(b.phone);

    if (ap && bp) return ap.localeCompare(bp, "pl");
    if (ap && !bp) return -1;
    if (!ap && bp) return 1;
    return a.name.localeCompare(b.name, "pl");
  });

  return arr;
}

function formatPLN(n?: number) {
  if (n == null || Number.isNaN(n)) return "";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(ts?: number) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function startOfDay(ts = Date.now()) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function endOfDay(ts = Date.now()) {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { minHeight: "100vh", padding: 18, background: "#f6f7fb" },
  container: { maxWidth: 1180, margin: "0 auto" },
  topbar: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  title: { margin: 0, fontSize: 20, fontWeight: 800 },
  subtitle: { margin: "4px 0 0", color: "#6b7280", fontSize: 13 },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 6px 18px rgba(0,0,0,.06)",
  },
  grid: { display: "grid", gridTemplateColumns: "360px 1fr", gap: 12 },
  panel: { padding: 14 },
  hr: { border: "none", borderTop: "1px solid #e5e7eb", margin: "12px 0" },
  label: { fontSize: 12, color: "#6b7280", margin: "10px 0 6px" },
  row: { display: "flex", gap: 10, alignItems: "center" },
  input: {
    width: "100%",
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    outline: "none",
  },
  select: {
    width: "100%",
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    outline: "none",
    minHeight: 90,
    resize: "vertical",
  },
  btn: {
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
  },
  btnSm: {
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    padding: "7px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 12,
  },
  btnPrimary: {
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnDanger: {
    border: "1px solid #dc2626",
    background: "#dc2626",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    fontSize: 12,
    color: "#374151",
  },
  tableWrap: { padding: 14 },
  tableBox: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  th: {
    textAlign: "left",
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 600,
    padding: "10px 10px",
    borderBottom: "1px solid #e5e7eb",
    position: "sticky",
    top: 0,
    background: "#fff",
    zIndex: 1,
  },
  td: {
    padding: "10px 10px",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "top",
    fontSize: 13,
  },
  small: { color: "#6b7280", fontSize: 12 },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid #e5e7eb",
    background: "#f3f4f6",
  },
};

function statusBadgeStyle(status: LeadStatus): React.CSSProperties {
  const map: Record<LeadStatus, string> = {
    Kontakt: "rgba(59,130,246,.18)",
    "Oferty wysłane": "rgba(245,158,11,.18)",
    "W trakcie": "rgba(168,85,247,.18)",
    Depozyt: "rgba(34,197,94,.18)",
    Kupiony: "rgba(16,185,129,.18)",
    Wydane: "rgba(2,132,199,.18)",
    "Zastanawia się": "rgba(107,114,128,.18)",
    "Nie odbiera": "rgba(239,68,68,.18)",
    Odpuszczony: "rgba(220,38,38,.18)",
  };
  return { ...styles.pill, background: map[status] };
}

function mapFromDb(x: any): Lead {
  return {
    id: x.id,
    createdAt: x.created_at ? new Date(x.created_at).getTime() : Date.now(),
    name: x.name ?? "",
    phone: x.phone ?? "",
    model: x.model ?? "",
    year: x.year ?? undefined,
    auctionUrl: x.auction_url ?? "",
    vin: x.vin ?? "",
    budgetPln: x.budget_min ?? undefined,
    status: ((x.status ?? "Kontakt") as LeadStatus) || "Kontakt",
    lastContactAt: x.next_contact_at ? new Date(x.next_contact_at).getTime() : undefined,
    notes: x.looking_for ?? "",
    ownerId: x.owner_id ?? null,
    checklist: (x.checklist ?? {}) as any,
  };
}

function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(data?.error || "Błąd logowania");
        return;
      }

      onLogin(data as User);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          padding: 18,
          boxShadow: "0 6px 18px rgba(0,0,0,.06)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>CRM Login</h2>
        <p style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
          Zaloguj się numerem telefonu i hasłem z tabeli users.
        </p>

        <div style={{ marginTop: 12 }}>
          <div style={styles.label}>Numer telefonu</div>
          <input
            style={styles.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+48..."
          />
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={styles.label}>Hasło</div>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
          />
        </div>

        <button
          style={{ ...styles.btnPrimary, width: "100%", marginTop: 12 }}
          onClick={handleLogin}
          disabled={loading}
          type="button"
        >
          {loading ? "Logowanie..." : "Zaloguj"}
        </button>

        {err && <div style={{ marginTop: 10, color: "#dc2626", fontSize: 13 }}>{err}</div>}
      </div>
    </div>
  );
}

export default function Page() {
  type Tab = "crm" | "calc";
const [activeTab, setActiveTab] = useState<Tab>("crm");
  const [user, setUser] = useState<User | null>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<UserRow[]>([]);
  const uniqueUsers = useMemo(() => dedupeAndSortUsers(users), [users]); // dedupe tylko tutaj

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "Wszystkie">("Wszystkie");
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");
  const [followupactiveTab, setFollowupactiveTab] = useState<"all" | "today" | "overdue">("all");

  const [ownerFilter, setOwnerFilter] = useState<string>("Wszyscy");

  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(() => leads.find((l) => l.id === editingId) ?? null, [leads, editingId]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    budgetPlnText: "",
    status: "Kontakt" as LeadStatus,
    notes: "",
    model: "",
    yearText: "",
    auctionUrl: "",
    vin: "",
    ownerId: "",
    checklist: {} as Partial<Record<ChecklistKey, boolean>>,
  });

  const [adminUnlockClosed, setAdminUnlockClosed] = useState(false);

  useEffect(() => {
    setAdminUnlockClosed(false);
  }, [editingId]);

  useEffect(() => {
    if (form.status !== "Wydane") setAdminUnlockClosed(false);
  }, [form.status]);

  const nameRef = useRef<HTMLInputElement | null>(null);

  const showChecklist = form.status === "Kupiony" || form.status === "Wydane";
  const isClosed = form.status === "Wydane";
  const canEditChecklist = !isClosed || (user?.role === "ADMIN" && adminUnlockClosed);

  // whoami
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/whoami", { cache: "no-store" });
        if (!res.ok) return;
        const me = await res.json();
        if (me?.id) setUser(me as User);
      } catch {}
    })();
  }, []);

  // default ownerId
  useEffect(() => {
    if (!user) return;
    setForm((p) => ({ ...p, ownerId: p.ownerId || user.id }));
  }, [user]);

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}
    setUser(null);
  }

  async function reload() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/leads?userId=${encodeURIComponent(user.id)}&role=${encodeURIComponent(user.role)}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Błąd pobierania");
      setLeads(Array.isArray(data) ? data.map(mapFromDb) : []);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Błąd pobierania");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  // users z Supabase (tylko ADMIN) — BEZ dodatkowego dedupe tutaj (robi memo wyżej)
  useEffect(() => {
    if (!user) return;

    if (user.role !== "ADMIN") {
      setUsers([]);
      return;
    }

    fetch(`/api/users?role=${encodeURIComponent(user.role)}`)
      .then((r) => r.json())
      .then((list) => {
        const arr = Array.isArray(list) ? (list as UserRow[]) : [];
        setUsers(arr);
      })
      .catch(() => setUsers([]));
  }, [user]);

  // fill form on edit (UWAGA: żadnych key= na wrapperach formularza)
  useEffect(() => {
    if (!user) return;
    if (!editing) return;

    setForm({
      name: editing.name,
      phone: editing.phone,
      budgetPlnText: editing.budgetPln != null ? String(editing.budgetPln) : "",
      status: editing.status,
      notes: editing.notes || "",
      model: editing.model || "",
      yearText: editing.year != null ? String(editing.year) : "",
      auctionUrl: editing.auctionUrl || "",
      vin: editing.vin || "",
      ownerId: (editing.ownerId ?? user.id) || user.id,
      checklist: editing.checklist ?? {},
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  function resetForm() {
    if (!user) return;
    setEditingId(null);
    setForm({
      name: "",
      phone: "",
      budgetPlnText: "",
      status: "Kontakt",
      notes: "",
      model: "",
      yearText: "",
      auctionUrl: "",
      vin: "",
      ownerId: user.id,
      checklist: {},
    });
    // focus TYLKO przy resecie — nie w żadnym miejscu, które odpala się przy onChange
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  function parseBudget(): number | undefined {
    const budget = form.budgetPlnText.trim() ? Number(form.budgetPlnText.trim()) : undefined;
    return budget != null && !Number.isNaN(budget) ? Math.max(0, Math.round(budget)) : undefined;
  }

  function parseYear(): number | null {
    const y = form.yearText.trim();
    if (!y) return null;
    const n = Number(y);
    if (Number.isNaN(n)) return null;
    return n;
  }

  async function upsertLead() {
    if (!user) return;

    const name = form.name.trim();
    if (!name) return alert("Podaj imię/nazwę leada.");

    const safeBudget = parseBudget();
    const year = parseYear();

    const finalOwnerId = user.role === "ADMIN" ? form.ownerId || user.id : user.id;

    setSaving(true);
    try {
      if (!editing) {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            phone: form.phone.trim(),
            status: form.status,
            budget_min: safeBudget ?? null,
            looking_for: form.notes || null,

            model: form.model.trim() || null,
            year,
            auction_url: form.auctionUrl.trim() || null,
            vin: form.status === "Kupiony" ? form.vin.trim() || null : null,

            owner_id: finalOwnerId,
            checklist: form.checklist ?? {},

            actor_id: user.id,
            actor_role: user.role,
          }),
        });

        const created = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(created?.error || "Błąd zapisu");

        setLeads((prev) => [mapFromDb(created), ...prev]);
        resetForm();
        return;
      }

      const res = await fetch(`/api/leads/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: form.phone.trim(),
          status: form.status,
          budget_min: safeBudget ?? null,
          looking_for: form.notes || null,

          model: form.model.trim() || null,
          year,
          auction_url: form.auctionUrl.trim() || null,
          vin: form.status === "Kupiony" ? form.vin.trim() || null : null,

          owner_id: user.role === "ADMIN" ? finalOwnerId : undefined,
          checklist: form.checklist ?? {},

          actor_id: user.id,
          actor_role: user.role,
        }),
      });

      const updated = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(updated?.error || "Błąd zapisu");

      setLeads((prev) => prev.map((l) => (l.id === editing.id ? mapFromDb(updated) : l)));
      resetForm();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Błąd");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead(id: string) {
    const l = leads.find((x) => x.id === id);
    if (!l) return;
    if (!confirm(`Usunąć lead: ${l.name}?`)) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Błąd usuwania");

      setLeads((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) resetForm();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Błąd");
    } finally {
      setSaving(false);
    }
  }

  async function quickStatus(id: string, status: LeadStatus) {
    if (!user) return;

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));

    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          vin: null,
          actor_id: user.id,
          actor_role: user.role,
        }),
      });

      const updated = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(updated?.error || "Błąd");
      setLeads((prev) => prev.map((l) => (l.id === id ? mapFromDb(updated) : l)));
    } catch (e) {
      console.error(e);
      await reload();
    }
  }

  async function touchContact(id: string) {
    if (!user) return;

    const iso = new Date().toISOString();
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, lastContactAt: Date.now() } : l)));

    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          next_contact_at: iso,
          actor_id: user.id,
          actor_role: user.role,
        }),
      });

      const updated = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(updated?.error || "Błąd");
      setLeads((prev) => prev.map((l) => (l.id === id ? mapFromDb(updated) : l)));
    } catch (e) {
      console.error(e);
      await reload();
    }
  }

  async function setFollowupInDays(id: string, days: number) {
    if (!user) return;

    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(10, 0, 0, 0);
    const iso = d.toISOString();

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, lastContactAt: d.getTime() } : l)));

    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          next_contact_at: iso,
          actor_id: user.id,
          actor_role: user.role,
        }),
      });

      const updated = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(updated?.error || "Błąd");
      setLeads((prev) => prev.map((l) => (l.id === id ? mapFromDb(updated) : l)));
    } catch (e) {
      console.error(e);
      await reload();
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...leads];

    if (statusFilter !== "Wszystkie") list = list.filter((l) => l.status === statusFilter);

    if (user?.role === "ADMIN" && ownerFilter !== "Wszyscy") {
      list = list.filter((l) => (l.ownerId || "") === ownerFilter);
    }

    if (followupactiveTab !== "all") {
      const now = Date.now();
      const sod = startOfDay(now);
      const eod = endOfDay(now);

      list = list.filter((l) => {
        const due = l.lastContactAt;
        if (!due) return false;
        if (followupactiveTab === "today") return due >= sod && due <= eod;
        return due < sod;
      });
    }

    if (q) {
      list = list.filter((l) =>
        `${l.name} ${l.phone} ${l.model ?? ""} ${l.year ?? ""} ${l.auctionUrl ?? ""} ${l.vin ?? ""} ${l.notes}`
          .toLowerCase()
          .includes(q)
      );
    }

    if (sort === "newest") list.sort((a, b) => b.createdAt - a.createdAt);
    if (sort === "oldest") list.sort((a, b) => a.createdAt - b.createdAt);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "pl"));

    return list;
  }, [leads, query, statusFilter, sort, ownerFilter, user?.role, followupactiveTab]);

  const stats = useMemo(() => {
    const byStatus = STATUSES.reduce((acc, s) => {
      acc[s] = 0;
      return acc;
    }, {} as Record<LeadStatus, number>);

    let sumBudget = 0;
    let budgetCount = 0;

    for (const l of leads) {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
      if (l.budgetPln != null) {
        sumBudget += l.budgetPln;
        budgetCount++;
      }
    }

    const avgBudget = budgetCount ? Math.round(sumBudget / budgetCount) : undefined;
    return { total: leads.length, byStatus, avgBudget };
  }, [leads]);

  // --- RENDER ---
  if (!user) {
    return (
      <Login
        onLogin={(u) => {
          setUser(u);
        }}
      />
    );
  }

  if (activeTab === "calc") {
    return (
      <div style={styles.wrap}>
        <div style={styles.container}>
          <div style={styles.topbar}>
            <div>
              <h1 style={styles.title}>Kalkulator importu</h1>
              <p style={styles.subtitle}>
                Zalogowany: <b>{user?.name}</b> ({user?.role})
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button style={styles.btn} type="button" onClick={() => setActiveTab("crm")}>
                ← Wróć do CRM
              </button>

              <button style={styles.btn} type="button" onClick={logout}>
                Wyloguj
              </button>
            </div>
          </div>

          <div style={{ ...styles.card, padding: 16 }}>
            <ImportCalculator />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.container}>
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.title}>CRM</h1>
            <p style={styles.subtitle}>
              Zalogowany: <b>{user.name}</b> ({user.role})
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={styles.chip}>
              Łącznie: <b>{stats.total}</b>
            </span>
            <span style={styles.chip}>
              Śr. budżet: <b>{formatPLN(stats.avgBudget) || "—"}</b>
            </span>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                style={{ ...styles.btn, fontWeight: activeTab === "crm" ? 800 : 600 }}
                onClick={() => setActiveTab("crm")}
              >
                CRM
              </button>

              <button
  type="button"
  style={{ ...styles.btn, fontWeight: activeTab === "crm" ? 800 : 600 }}
  onClick={() => setActiveTab("crm")}
>
  CRM
</button>

<button
  type="button"
  style={{ ...styles.btn, fontWeight: activeTab === "calc" ? 800 : 600 }}
  onClick={() => setActiveTab("calc")}
>
  Kalkulator
</button>
            </div>

            <button style={styles.btn} onClick={reload} disabled={loading || saving} type="button">
              Odśwież
            </button>
            <button style={styles.btn} onClick={logout} type="button">
              Wyloguj
            </button>
          </div>
        </div>

        <div style={{ ...styles.card, padding: 0 }}>
          <div style={styles.grid}>
            {/* LEFT */}
            {/* UWAGA: NIE MA TU ŻADNEGO key= — to usuwa problem “1 litera i fokus znika” */}
            <div style={{ ...styles.panel, borderRight: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{editing ? "Edytuj leada" : "Dodaj leada"}</div>
                  <div style={styles.small}>{editing ? `ID: ${editing.id.slice(0, 10)}…` : ""}</div>
                </div>
                <button style={styles.btn} onClick={resetForm} disabled={saving} type="button">
                  Reset
                </button>
              </div>

              <div style={styles.hr} />

              <div style={styles.label}>Imię / Nazwa</div>
              <input
                ref={nameRef}
                style={styles.input}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />

              <div style={styles.label}>Telefon</div>
              <input
                style={styles.input}
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />

              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  <div style={styles.label}>Budżet (PLN)</div>
                  <input
                    style={styles.input}
                    value={form.budgetPlnText}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, budgetPlnText: e.target.value.replace(/[^0-9]/g, "") }))
                    }
                    inputMode="numeric"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.label}>Etap</div>
                  <select
                    style={styles.select}
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as LeadStatus }))}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {user.role === "ADMIN" && (
                <>
                  <div style={styles.label}>Opiekun (przypisz do)</div>
                  <select
                    style={styles.select}
                    value={form.ownerId}
                    onChange={(e) => setForm((p) => ({ ...p, ownerId: e.target.value }))}
                  >
                    <option value={user.id}>Ja ({user.name})</option>
                    {uniqueUsers
                      .filter((u) => (u.role === "SALES" || u.role === "ADMIN") && u.id !== user.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                  </select>
                </>
              )}

              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  <div style={styles.label}>Model</div>
                  <input
                    style={styles.input}
                    value={form.model}
                    onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                    placeholder="np. BMW 540i G30"
                  />
                </div>
                <div style={{ width: 120 }}>
                  <div style={styles.label}>Rocznik</div>
                  <input
                    style={styles.input}
                    value={form.yearText}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, yearText: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) }))
                    }
                    inputMode="numeric"
                    placeholder="2019"
                  />
                </div>
              </div>

              <div style={styles.label}>Link do aukcji</div>
              <input
                style={styles.input}
                value={form.auctionUrl}
                onChange={(e) => setForm((p) => ({ ...p, auctionUrl: e.target.value }))}
                placeholder="https://copart.com/lot/..."
              />

              {form.status === "Kupiony" && (
                <>
                  <div style={styles.label}>VIN (tylko gdy Kupiony)</div>
                  <input
                    style={styles.input}
                    value={form.vin}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        vin: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17),
                      }))
                    }
                    placeholder="17 znaków"
                  />
                </>
              )}

              {showChecklist && (
                <>
                  <div style={{ ...styles.hr, marginTop: 14 }} />

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>Checklist (import / wydanie)</div>
                      <div style={styles.small}>
                        {form.status === "Kupiony"
                          ? "Kupiony: checklistę można edytować."
                          : "Wydane: checklist domyślnie zablokowany."}
                      </div>
                    </div>

                    {user.role === "ADMIN" && isClosed && (
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#374151" }}>
                        <input
                          type="checkbox"
                          checked={adminUnlockClosed}
                          onChange={(e) => setAdminUnlockClosed(e.target.checked)}
                        />
                        Odblokuj edycję
                      </label>
                    )}
                  </div>

                  <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {CHECKLIST.map((c) => {
                      const checked = !!form.checklist?.[c.key];
                      return (
                        <label
                          key={c.key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 12px",
                            borderRadius: 14,
                            border: "1px solid #e5e7eb",
                            background: canEditChecklist ? "#fff" : "#f3f4f6",
                            opacity: canEditChecklist ? 1 : 0.75,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!canEditChecklist}
                            onChange={(e) => {
                              const next = e.target.checked;
                              setForm((p) => ({
                                ...p,
                                checklist: { ...(p.checklist ?? {}), [c.key]: next },
                              }));
                            }}
                          />
                          <span style={{ fontSize: 13 }}>{c.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  {!canEditChecklist && (
                    <div style={{ marginTop: 10, color: "#6b7280", fontSize: 12 }}>
                      Checklist zablokowana (status: <b>Wydane</b>).
                      {user.role === "ADMIN" ? " Zaznacz „Odblokuj edycję”, aby zmienić." : ""}
                    </div>
                  )}
                </>
              )}

              <div style={styles.label}>Notatki</div>
              <textarea
                style={styles.textarea}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />

              <div style={{ ...styles.row, marginTop: 12, justifyContent: "space-between" }}>
                <button style={styles.btnPrimary} onClick={upsertLead} disabled={saving} type="button">
                  {saving ? "Zapis..." : editing ? "Zapisz zmiany" : "Dodaj leada"}
                </button>

                {editing && (
                  <button style={styles.btnDanger} onClick={() => deleteLead(editing.id)} disabled={saving} type="button">
                    Usuń
                  </button>
                )}
              </div>

              <div style={{ marginTop: 12, color: "#6b7280", fontSize: 12 }}>
                {loading
                  ? "Ładowanie…"
                  : user.role === "ADMIN"
                  ? "ADMIN: widzisz wszystko."
                  : "SALES: widzisz tylko swoje leady (backend)."}
              </div>
            </div>

            {/* RIGHT */}
            <div style={styles.tableWrap}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                <input
                  style={{ ...styles.input, flex: 1, minWidth: 220 }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Szukaj…"
                />

                <select
                  style={{ ...styles.select, width: 220 }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="Wszystkie">Wszystkie etapy</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    style={{
                      ...styles.btnSm,
                      background: followupactiveTab === "all" ? "#e5e7eb" : "#f9fafb",
                      fontWeight: followupactiveTab === "all" ? 800 : 600,
                    }}
                    onClick={() => setFollowupactiveTab("all")}
                    type="button"
                  >
                    Wszystkie
                  </button>
                  <button
                    style={{
                      ...styles.btnSm,
                      background: followupactiveTab === "today" ? "#e5e7eb" : "#f9fafb",
                      fontWeight: followupactiveTab === "today" ? 800 : 600,
                    }}
                    onClick={() => setFollowupactiveTab("today")}
                    type="button"
                  >
                    Dzisiaj
                  </button>
                  <button
                    style={{
                      ...styles.btnSm,
                      background: followupactiveTab === "overdue" ? "#fee2e2" : "#f9fafb",
                      borderColor: followupactiveTab === "overdue" ? "#fecaca" : "#e5e7eb",
                      fontWeight: followupactiveTab === "overdue" ? 800 : 600,
                    }}
                    onClick={() => setFollowupactiveTab("overdue")}
                    type="button"
                  >
                    Zaległe
                  </button>
                </div>

                {user.role === "ADMIN" && (
                  <select
                    style={{ ...styles.select, width: 220 }}
                    value={ownerFilter}
                    onChange={(e) => setOwnerFilter(e.target.value)}
                  >
                    <option value="Wszyscy">Wszyscy opiekunowie</option>
                    <option value={user.id}>Ja ({user.name})</option>
                    {uniqueUsers
                      .filter((u) => (u.role === "SALES" || u.role === "ADMIN") && u.id !== user.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                  </select>
                )}

                <select style={{ ...styles.select, width: 150 }} value={sort} onChange={(e) => setSort(e.target.value as any)}>
                  <option value="newest">Najnowsze</option>
                  <option value="oldest">Najstarsze</option>
                  <option value="name">A→Z</option>
                </select>
              </div>

              <div style={styles.tableBox}>
                <div style={{ maxHeight: 520, overflow: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Lead</th>
                        <th style={styles.th}>Etap</th>
                        <th style={styles.th}>Auto</th>
                        <th style={styles.th}>Budżet</th>
                        <th style={styles.th}>Kontakt</th>
                        <th style={styles.th}>Akcje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td style={styles.td} colSpan={6}>
                            <div style={{ color: "#6b7280" }}>{loading ? "Ładowanie…" : "Brak wyników."}</div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((l) => (
                          <tr
                            key={l.id}
                            onClick={() => setEditingId(l.id)}
                            style={{
                              cursor: "pointer",
                              background: editingId === l.id ? "rgba(37,99,235,.10)" : "transparent",
                            }}
                          >
                            <td style={styles.td}>
                              <div style={{ fontWeight: 800, marginBottom: 2 }}>{l.name}</div>
                              <div style={styles.small}>
                                Tel: {l.phone || "—"} • utw.: {formatDate(l.createdAt)}
                              </div>
                              {l.notes ? (
                                <div style={{ marginTop: 6, color: "#374151" }}>
                                  {l.notes.length > 90 ? l.notes.slice(0, 90) + "…" : l.notes}
                                </div>
                              ) : null}
                            </td>

                            <td style={styles.td}>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                <span style={statusBadgeStyle(l.status)}>{l.status}</span>
                                <select
                                  style={{ ...styles.select, width: 170 }}
                                  value={l.status}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => quickStatus(l.id, e.target.value as LeadStatus)}
                                >
                                  {STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>

                            <td style={styles.td}>
                              <div style={{ fontWeight: 800 }}>
                                {(l.model || "—") + (l.year ? ` • ${l.year}` : "")}
                              </div>
                              {l.auctionUrl ? (
                                <a
                                  href={l.auctionUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ fontSize: 12 }}
                                >
                                  Aukcja ↗
                                </a>
                              ) : (
                                <div style={styles.small}>—</div>
                              )}
                              {l.status === "Kupiony" && l.vin ? <div style={styles.small}>VIN: {l.vin}</div> : null}
                            </td>

                            <td style={styles.td}>
                              <div style={{ fontWeight: 800 }}>{formatPLN(l.budgetPln) || "—"}</div>
                            </td>

                            <td style={styles.td}>
                              <div style={{ display: "grid", gap: 6 }}>
                                <div style={styles.small}>Follow-up: {formatDate(l.lastContactAt)}</div>
                              </div>
                            </td>

                            <td style={styles.td}>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <button
                                  style={styles.btnSm}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    touchContact(l.id);
                                  }}
                                  type="button"
                                >
                                  Dziś ✅
                                </button>

                                <button
                                  style={styles.btnSm}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFollowupInDays(l.id, 1);
                                  }}
                                  type="button"
                                >
                                  +1d
                                </button>
                                <button
                                  style={styles.btnSm}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFollowupInDays(l.id, 3);
                                  }}
                                  type="button"
                                >
                                  +3d
                                </button>
                                <button
                                  style={styles.btnSm}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFollowupInDays(l.id, 7);
                                  }}
                                  type="button"
                                >
                                  +7d
                                </button>

                                <button
                                  style={{ ...styles.btnSm, background: "#dc2626", color: "#fff", borderColor: "#dc2626" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteLead(l.id);
                                  }}
                                  type="button"
                                >
                                  Usuń
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ marginTop: 12, color: "#6b7280", fontSize: 12 }}>
                Tip: leady pobierane są z <code>/api/leads?userId=...&role=...</code>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
