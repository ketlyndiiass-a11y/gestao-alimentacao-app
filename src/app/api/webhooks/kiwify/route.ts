import { NextRequest, NextResponse } from "next/server";
import { findPlan, type PlanId } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type KiwifyPayload = {
  order_status?: string;
  webhook_event_type?: string;
  subscription_id?: string;
  checkout_link?: string;
  Product?: {
    product_id?: string;
    product_name?: string;
  };
  Customer?: {
    full_name?: string;
    email?: string;
    mobile?: string | null;
    CPF?: string | null;
  };
  Subscription?: {
    next_payment?: string;
    status?: string;
    customer_access?: {
      access_until?: string;
    };
    plan?: {
      id?: string;
      name?: string;
    };
  };
  token?: string;
};

type SubscriptionStatus = "active" | "past_due" | "canceled" | "expired";

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getWebhookToken(request: NextRequest, payload: KiwifyPayload) {
  const authorization = request.headers.get("authorization") ?? "";
  const bearerToken = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7)
    : "";

  return (
    request.headers.get("x-kiwify-token") ??
    request.headers.get("x-webhook-token") ??
    bearerToken ??
    payload.token ??
    ""
  );
}

function isAuthorized(request: NextRequest, payload: KiwifyPayload) {
  const expectedToken = process.env.KIWIFY_WEBHOOK_TOKEN;

  if (!expectedToken) {
    return true;
  }

  return getWebhookToken(request, payload) === expectedToken;
}

function planFromPayload(payload: KiwifyPayload): PlanId {
  const candidates = [
    payload.Subscription?.plan?.id,
    payload.Subscription?.plan?.name,
    payload.Product?.product_id,
    payload.Product?.product_name,
    payload.checkout_link
  ].map(normalizeText);

  const essentialIds = [
    process.env.KIWIFY_ESSENTIAL_PLAN_ID,
    process.env.KIWIFY_ESSENTIAL_PRODUCT_ID,
    process.env.KIWIFY_ESSENTIAL_CHECKOUT_LINK
  ].map(normalizeText);

  const managementIds = [
    process.env.KIWIFY_MANAGEMENT_PLAN_ID,
    process.env.KIWIFY_MANAGEMENT_PRODUCT_ID,
    process.env.KIWIFY_MANAGEMENT_CHECKOUT_LINK
  ].map(normalizeText);

  const eliteIds = [
    process.env.KIWIFY_ELITE_PLAN_ID,
    process.env.KIWIFY_ELITE_PRODUCT_ID,
    process.env.KIWIFY_ELITE_CHECKOUT_LINK
  ].map(normalizeText);

  if (candidates.some((candidate) => candidate && essentialIds.includes(candidate))) {
    return "essential";
  }

  if (candidates.some((candidate) => candidate && managementIds.includes(candidate))) {
    return "management";
  }

  if (candidates.some((candidate) => candidate && eliteIds.includes(candidate))) {
    return "elite";
  }

  if (candidates.some((candidate) => candidate.includes("elite"))) {
    return "elite";
  }

  if (
    candidates.some(
      (candidate) =>
        candidate.includes("gest") ||
        candidate.includes("gestao") ||
        candidate.includes("profissional") ||
        candidate.includes("management")
    )
  ) {
    return "management";
  }

  return "essential";
}

function statusFromPayload(payload: KiwifyPayload): SubscriptionStatus {
  const eventType = normalizeText(payload.webhook_event_type);
  const orderStatus = normalizeText(payload.order_status);
  const subscriptionStatus = normalizeText(payload.Subscription?.status);

  if (
    eventType.includes("canceled") ||
    eventType.includes("cancelado") ||
    eventType.includes("reembols") ||
    eventType.includes("chargeback")
  ) {
    return "canceled";
  }

  if (
    eventType.includes("late") ||
    eventType.includes("atras") ||
    eventType.includes("recus") ||
    orderStatus.includes("refused") ||
    orderStatus.includes("recused") ||
    subscriptionStatus.includes("late")
  ) {
    return "past_due";
  }

  if (
    eventType.includes("approved") ||
    eventType.includes("aprov") ||
    eventType.includes("renewed") ||
    eventType.includes("renov") ||
    orderStatus === "paid" ||
    subscriptionStatus === "active"
  ) {
    return "active";
  }

  return "past_due";
}

function plusDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function currentPeriodEnd(payload: KiwifyPayload, status: SubscriptionStatus) {
  if (status !== "active") {
    return null;
  }

  return (
    payload.Subscription?.customer_access?.access_until ??
    payload.Subscription?.next_payment ??
    plusDays(30)
  );
}

function retentionUntil(status: SubscriptionStatus) {
  if (status === "past_due" || status === "canceled") {
    return plusDays(45);
  }

  return null;
}

async function findOrCreateUser(email: string) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { data: usersPage, error: existingUserError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (existingUserError) {
    throw existingUserError;
  }

  const existingUser = usersPage.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );

  if (existingUser?.id) {
    return existingUser.id;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: crypto.randomUUID()
  });

  if (error || !data.user) {
    throw error ?? new Error("Could not create auth user.");
  }

  return data.user.id;
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { ok: false, error: "Supabase service role is not configured." },
      { status: 500 }
    );
  }

  const payload = (await request.json()) as KiwifyPayload;

  if (!isAuthorized(request, payload)) {
    return NextResponse.json({ ok: false, error: "Unauthorized webhook." }, { status: 401 });
  }

  const email = payload.Customer?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Webhook without customer email." },
      { status: 400 }
    );
  }

  const userId = await findOrCreateUser(email);
  const planCode = planFromPayload(payload);
  const status = statusFromPayload(payload);
  const plan = findPlan(planCode);

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
    id: userId,
    full_name: payload.Customer?.full_name ?? null,
    document_number: payload.Customer?.CPF ?? null,
    phone: payload.Customer?.mobile ?? null
  });

  if (profileError) {
    return NextResponse.json({ ok: false, error: profileError.message }, { status: 500 });
  }

  const { error: subscriptionError } = await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      plan_code: planCode,
      status,
      gateway_subscription_id: payload.subscription_id ?? null,
      current_period_end: currentPeriodEnd(payload, status),
      canceled_at: status === "canceled" ? new Date().toISOString() : null,
      data_retention_until: retentionUntil(status)
    },
    { onConflict: "user_id" }
  );

  if (subscriptionError) {
    return NextResponse.json({ ok: false, error: subscriptionError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    email,
    status,
    plan: plan.name
  });
}
