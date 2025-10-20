import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type Params = { params: { id: string } };

export async function PATCH(_req: Request, { params }: Params) {
  const { id } = params;
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'served' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
