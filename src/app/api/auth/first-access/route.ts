import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type FirstAccessPayload = {
  email?: string;
  password?: string;
};

type SubscriptionAccessRow = {
  status: string;
  data_retention_until: string | null;
};

function isActiveOrInsideRetention(subscription?: SubscriptionAccessRow | null) {
  if (!subscription) {
    return false;
  }

  if (subscription.status === "active") {
    return true;
  }

  if (!subscription.data_retention_until) {
    return false;
  }

  return new Date(subscription.data_retention_until).getTime() >= Date.now();
}

async function findUserByEmail(email: string) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (error) {
    throw error;
  }

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { ok: false, error: "Supabase service role não configurado." },
      { status: 500 }
    );
  }

  const payload = (await request.json()) as FirstAccessPayload;
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password ?? "";

  if (!email || password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Informe o e-mail da compra e uma senha com pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  const user = await findUserByEmail(email);

  if (!user?.id) {
    return NextResponse.json(
      { ok: false, error: "Este e-mail ainda não possui uma compra liberada." },
      { status: 404 }
    );
  }

  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select("status, data_retention_until")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionError || !isActiveOrInsideRetention(subscription)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Este e-mail ainda não possui uma assinatura ativa. Use o mesmo e-mail da compra."
      },
      { status: 403 }
    );
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
