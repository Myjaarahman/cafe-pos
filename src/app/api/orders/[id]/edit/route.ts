import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const data = await request.json();

    if (!id || !data?.items) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    interface OrderItemPayload {
  item_id: string;
  quantity: number;
  unit_price: number;
}

const total = data.items.reduce(
  (sum: number, it: OrderItemPayload) => sum + it.unit_price * it.quantity,
  0
);


    // Update order table
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ total })
      .eq('id', id);

    if (orderError)
      return NextResponse.json({ error: orderError.message }, { status: 500 });

    // Delete old items first
    await supabaseAdmin.from('order_items').delete().eq('order_id', id);

    // Insert updated items
    const { error: itemError } = await supabaseAdmin
      .from('order_items')
      .insert(
  data.items.map((it: OrderItemPayload) => ({
    order_id: id,
    item_id: it.item_id,
    quantity: it.quantity,
    unit_price: it.unit_price,
  }))
)


    if (itemError)
      return NextResponse.json({ error: itemError.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
