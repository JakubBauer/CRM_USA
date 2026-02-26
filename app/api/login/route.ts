import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body?.phone || !body?.password) {
    return NextResponse.json({ error: "Brak danych logowania" }, { status: 400 });
  }

  const phone = String(body.phone ?? "").trim();
  const password = String(body.password ?? "").trim();

  const { data, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("phone", phone)
    .eq("password", password)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Nieprawidłowy numer telefonu lub hasło" }, { status: 401 });
  }

  return NextResponse.json({ id: data.id, name: data.name, role: data.role });
}