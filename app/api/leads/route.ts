import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function safeChecklist(input: any) {
  // oczekujemy obiektu { key: boolean }
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(input)) {
    out[String(k)] = !!v;
  }
  return out;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const role = searchParams.get("role");

  if (!userId) {
    return json({ error: "Missing userId" }, 400);
  }

  let query = supabaseServer
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (role !== "ADMIN") {
    query = query.eq("owner_id", userId);
  }

  const { data, error } = await query;

  if (error) return json({ error: error.message }, 500);
  return json(data ?? []);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
    return json({ error: "name is required" }, 400);
  }

  const actorId = String(body?.actor_id ?? "").trim();
  const actorRole = String(body?.actor_role ?? "").trim();
  if (!actorId || !actorRole) {
    return json({ error: "actor_id and actor_role are required" }, 400);
  }

  const status = body.status ?? null;

  // ✅ poprawnie wyliczony ownerId + użyty w payload
  const requestedOwnerId = String(body?.owner_id ?? "").trim();
  const ownerId = actorRole === "ADMIN" ? (requestedOwnerId || actorId) : actorId;

  // VIN tylko dla Kupiony
  const vin = status === "Kupiony" ? (String(body.vin ?? "").trim() || null) : null;

  // ✅ checklist
  const checklist = safeChecklist(body.checklist);

  const payload = {
    name: body.name.trim(),
    phone: String(body.phone ?? "").trim(),

    status,
    model: String(body.model ?? "").trim() || null,
    year: body.year == null ? null : Number(body.year),
    auction_url: String(body.auction_url ?? "").trim() || null,
    vin,

    looking_for: body.looking_for ?? null,
    budget_min: body.budget_min == null ? null : Number(body.budget_min),
    next_contact_at: body.next_contact_at ?? null,

    owner_id: ownerId,       // ✅ tu było źle
    checklist,               // ✅ nowe pole
  };

  const { data, error } = await supabaseServer
    .from("leads")
    .insert(payload)
    .select("*")
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
}