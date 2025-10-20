import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type OrderItemPayload = {
  item_id: string;
  quantity: number;
  unit_price: number;
};

export async function GET() {
  // List active orders with items
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, total, status, created_at, order_items(id, item_id, quantity, unit_price, menu_items(name))')
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { order_number, items } = body as {
    order_number: number;
    items: OrderItemPayload[];
  };

  if (!order_number || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const total = items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);

  const { data: order, error: errOrder } = await supabaseAdmin
    .from('orders')
    .insert({ order_number, total, status: 'active' })
    .select('*')
    .single();

  if (errOrder) return NextResponse.json({ error: errOrder.message }, { status: 500 });

  const rows = items.map((it) => ({
    order_id: order.id,
    item_id: it.item_id,
    quantity: it.quantity,
    unit_price: it.unit_price,
  }));

  const { error: errItems } = await supabaseAdmin
    .from('order_items')
    .insert(rows);

  if (errItems) return NextResponse.json({ error: errItems.message }, { status: 500 });

  return NextResponse.json({ ok: true, order_id: order.id });
}
