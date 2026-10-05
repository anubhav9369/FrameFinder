import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/api-auth";
import { verifyPaymentSignature } from "@/lib/razorpay";

interface VerifyBody {
  orderId?: unknown;
  paymentId?: unknown;
  signature?: unknown;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { supabase, user } = session;

  const body = (await request.json()) as VerifyBody;
  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
  const signature = typeof body.signature === "string" ? body.signature : "";
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { error: "orderId, paymentId and signature are required" },
      { status: 400 },
    );
  }

  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const { data: sub, error: findError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (findError || !sub) {
    return NextResponse.json({ error: "subscription_not_found" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      razorpay_payment_id: paymentId,
      current_period_end: new Date(Date.now() + THIRTY_DAYS_MS).toISOString(),
    })
    .eq("id", (sub as { id: string }).id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
