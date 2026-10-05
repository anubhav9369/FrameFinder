import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createServiceClient } from "@/lib/supabase/service";

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
}

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
  };
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  // Webhooks are unauthenticated by design — the signature is the auth.
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (payload.event === "payment.captured") {
    const entity = payload.payload?.payment?.entity;
    if (entity?.order_id) {
      const supabase = createServiceClient();
      await supabase
        .from("subscriptions")
        .update({
          status: "active",
          razorpay_payment_id: entity.id,
          current_period_end: new Date(Date.now() + THIRTY_DAYS_MS).toISOString(),
        })
        .eq("razorpay_order_id", entity.order_id);
    }
  }

  return NextResponse.json({ received: true });
}
