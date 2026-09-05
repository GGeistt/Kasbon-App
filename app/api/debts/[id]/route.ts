import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseUpdateDebtBody } from "@/lib/debts/validation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

type RequireUserResult =
  | {
      error: NextResponse<{ error: string }>;
      supabase: SupabaseClient<Database>;
      userId: null;
    }
  | {
      error: null;
      supabase: SupabaseClient<Database>;
      userId: string;
    };

async function requireUser(): Promise<RequireUserResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: errorResponse("Kamu harus login dulu.", 401),
      supabase,
      userId: null,
    };
  }

  return {
    error: null,
    supabase,
    userId: user.id,
  };
}

export async function PATCH(request: NextRequest, context: RouteContext<"/api/debts/[id]">) {
  const { id } = await context.params;

  if (!uuidPattern.test(id)) {
    return errorResponse("ID kasbon tidak valid.", 400);
  }

  const { error: authError, supabase, userId } = await requireUser();

  if (authError) {
    return authError;
  }

  const body = await readJson(request);
  const parsed = parseUpdateDebtBody(body);

  if (!parsed.ok) {
    return errorResponse(parsed.message, 400);
  }

  let updatePayload = parsed.data;

  if ("settled_at" in parsed.data && parsed.data.settled_at !== null) {
    const { data: currentDebt, error: currentDebtError } = await supabase
      .from("debts")
      .select("settled_at")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (currentDebtError) {
      return errorResponse("Gagal membaca status kasbon.", 500);
    }

    if (!currentDebt) {
      return errorResponse("Kasbon tidak ditemukan.", 404);
    }

    updatePayload = {
      ...parsed.data,
      settled_at: currentDebt.settled_at ?? parsed.data.settled_at,
    };
  }

  const { data, error } = await supabase
    .from("debts")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    return errorResponse("Gagal mengubah kasbon.", 500);
  }

  if (!data) {
    return errorResponse("Kasbon tidak ditemukan.", 404);
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: NextRequest, context: RouteContext<"/api/debts/[id]">) {
  const { id } = await context.params;

  if (!uuidPattern.test(id)) {
    return errorResponse("ID kasbon tidak valid.", 400);
  }

  const { error: authError, supabase, userId } = await requireUser();

  if (authError) {
    return authError;
  }

  const { data, error } = await supabase
    .from("debts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return errorResponse("Gagal menghapus kasbon.", 500);
  }

  if (!data) {
    return errorResponse("Kasbon tidak ditemukan.", 404);
  }

  return NextResponse.json({ data: { id } });
}
