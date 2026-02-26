import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function safeChecklist(input: any) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(input)) out[String(k)] = !!v;
  return out;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "invalid body" }, 400);

  // wymagamy aktora (żeby egzekwować blokadę)
  const actorId = String(body?.actor_id ?? "").trim();
  const actorRole = String(body?.actor_role ?? "").trim(); // "ADMIN" | "SALES"
  if (!actorId || !actorRole) {
    return json({ error: "actor_id and actor_role are required" }, 400);
  }

  // pobierz obecny rekord (potrzebne do blokady + statusu)
  const { data: current, error: curErr } = await supabaseServer
    .from("leads")
    .select("id,status,checklist")
    .eq("id", params.id)
    .single();

  if (curErr) return json({ error: curErr.message }, 500);
  if (!current) return json({ error: "not found" }, 404);

  const currentStatus = String(current.status ?? "");
  const requestedStatus =
    body.status !== undefined ? String(body.status ?? "") : undefined;

  // status po update (jeśli ktoś zmienia) albo obecny
  const effectiveStatus = requestedStatus ?? currentStatus;

  // czy rekord jest "zamknięty"
  const isClosed = effectiveStatus === "Wydane";

  // admin może odblokować na jeden request
  const adminUnlock = !!body.admin_unlock;

  // jeśli zamknięte:
  // - SALES nigdy nie może zmieniać checklisty
  // - ADMIN może tylko gdy admin_unlock=true
  const checklistUpdateRequested = body.checklist !== undefined;

  if (isClosed && checklistUpdateRequested) {
    if (actorRole !== "ADMIN") {
      return json({ error: "Checklist is locked for SALES when status is Wydane" }, 403);
    }
    if (!adminUnlock) {
      return json({ error: "Checklist is locked. Send admin_unlock=true to edit." }, 403);
    }
  }

  const patch: any = {};

  if (body.name !== undefined) patch.name = String(body.name).trim();
  if (body.phone !== undefined) patch.phone = String(body.phone).trim();
  if (body.looking_for !== undefined) patch.looking_for = body.looking_for ?? null;
  if (body.budget_min !== undefined)
    patch.budget_min = body.budget_min == null ? null : Number(body.budget_min);
  if (body.budget_max !== undefined)
    patch.budget_max = body.budget_max == null ? null : Number(body.budget_max);

  if (body.status !== undefined) patch.status = body.status ?? null;

  if (body.potential !== undefined) patch.potential = body.potential ?? null;
  if (body.next_contact_at !== undefined) patch.next_contact_at = body.next_contact_at ?? null;

  // owner_id: tylko ADMIN może zmieniać
  if (body.owner_id !== undefined) {
    if (actorRole !== "ADMIN") return json({ error: "Forbidden: owner_id" }, 403);
    patch.owner_id = body.owner_id ?? null;
  }

  if (body.model !== undefined) patch.model = String(body.model).trim() || null;
  if (body.year !== undefined) patch.year = body.year == null ? null : Number(body.year);
  if (body.auction_url !== undefined)
    patch.auction_url = String(body.auction_url).trim() || null;

  // checklist (jsonb)
  if (body.checklist !== undefined) {
    patch.checklist = safeChecklist(body.checklist);
  }

  // VIN: tylko gdy status Kupiony, inaczej kasujemy
  if (body.vin !== undefined) {
    patch.vin = effectiveStatus === "Kupiony" ? (String(body.vin).trim() || null) : null;
  }

  const { data, error } = await supabaseServer
    .from("leads")
    .update(patch)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error } = await supabaseServer.from("leads").delete().eq("id", params.id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}