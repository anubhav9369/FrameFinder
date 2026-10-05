import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/api-auth";
import { planById } from "@/lib/plans";
import { getRazorpay } from "@/lib/razorpay";

interface OrderBody {
  planId?: unknown;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const { supabase, user } = session;

  const body = (await request.json()) as OrderBody;
  const planId = typeof body.planId === "string" ? body.planId : "";
  const plan = planById(planId);

  if (!plan || plan.priceInr <= 0) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  try {
    const order = await getRazorpay().orders.create({
      amount: plan.priceInr * 100,
      currency: "INR",
      receipt: `ff_${user.id}_${Date.now()}`,
    });

    const { error: dbError } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan_id: plan.id,
      status: "created",
      razorpay_order_id: order.id,
    });
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id as string,
      amount: order.amount as number,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "order creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
