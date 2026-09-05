import { NextResponse, type NextRequest } from "next/server";
import {
  parseCreateDebtBody,
  parseDebtStatusFilter,
  parseDebtTypeFilter,
} from "@/lib/debts/validation";
import { createClient } from "@/lib/supabase/server";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return errorResponse("Kamu harus login dulu.", 401);
  }

  const status = parseDebtStatusFilter(request.nextUrl.searchParams.get("status"));
  if (!status.ok) {
    return errorResponse(status.message, 400);
  }

  const type = parseDebtTypeFilter(request.nextUrl.searchParams.get("type"));
  if (!type.ok) {
    return errorResponse(type.message, 400);
  }

  let query = supabase
    .from("debts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status.data === "settled") {
    query = query.not("settled_at", "is", null);
  }

  if (status.data === "unsettled") {
    query = query.is("settled_at", null);
  }

  if (type.data !== "all") {
    query = query.eq("type", type.data);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse("Gagal ambil data kasbon.", 500);
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return errorResponse("Kamu harus login dulu.", 401);
  }

  const body = await readJson(request);
  const parsed = parseCreateDebtBody(body, user.id);

  if (!parsed.ok) {
    return errorResponse(parsed.message, 400);
  }

  const { data, error } = await supabase
    .from("debts")
    .insert(parsed.data)
    .select("*")
    .single();

  if (error) {
    return errorResponse("Gagal menyimpan kasbon.", 500);
  }

  return NextResponse.json({ data }, { status: 201 });
}
