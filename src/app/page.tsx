'use client';

if (process.env.NEXT_PUBLIC_DISABLE_AUTH) {
  // skip any auth redirect logic
}

import { useEffect, useMemo, useState } from 'react';
import { MenuItem, CartItem, Order } from '@/types';
import { formatCurrency } from '@/utils/money';

export default function Home() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [waitingNumber, setWaitingNumber] = useState<number | ''>('');
  const [autoNumbers, setAutoNumbers] = useState<number[]>([]);

  // Load menu from Supabase API
  useEffect(() => {
    fetch('/api/menu')
      .then(r => r.json())
      .then(d => setMenu(d.items || []));
  }, []);

  // Load active orders every few seconds
  useEffect(() => {
    const load = () =>
      fetch('/api/orders')
        .then(r => r.json())
        .then(d => setOrders(d.orders || []));
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  // Compute available waiting numbers (1–30)
  useEffect(() => {
    const occupied = new Set(orders.map(o => o.order_number));
    const available: number[] = [];
    for (let n = 1; n <= 30; n++) if (!occupied.has(n)) available.push(n);
    setAutoNumbers(available);
    if (waitingNumber && occupied.has(waitingNumber)) setWaitingNumber('');
  }, [orders, waitingNumber]);

  // Calculate total
  const total = useMemo(
    () => cart.reduce((sum, it) => sum + it.unit_price * it.quantity, 0),
    [cart]
  );

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const found = prev.find(p => p.item_id === item.id);
      if (found) {
        return prev.map(p =>
          p.item_id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      } else {
        return [
          ...prev,
          {
            item_id: item.id,
            name: item.name,
            quantity: 1,
            unit_price: Number(item.price),
          },
        ];
      }
    });
  };

  const decFromCart = (id: string) => {
    setCart(prev =>
      prev
        .map(it =>
          it.item_id === id ? { ...it, quantity: it.quantity - 1 } : it
        )
        .filter(it => it.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const randomAvailableNumber = () => {
    if (autoNumbers.length === 0) return;
    const pick = autoNumbers[Math.floor(Math.random() * autoNumbers.length)];
    setWaitingNumber(pick);
  };

  const confirmOrder = async () => {
    if (cart.length === 0) {
      alert('Cart is empty.');
      return;
    }
    if (waitingNumber === '') {
      alert('Pick a waiting number (or press Auto Pick).');
      return;
    }

    const payload = {
      order_number: waitingNumber,
      items: cart.map(c => ({
        item_id: c.item_id,
        quantity: c.quantity,
        unit_price: c.unit_price,
      })),
    };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Failed to save order.');
      return;
    }
    clearCart();
    setWaitingNumber('');
  };

  const markServed = async (id: string) => {
    const res = await fetch(`/api/orders/${id}/serve`, { method: 'PATCH' });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || 'Failed to mark served');
    }
  };

  // Group menu by category + temperature
  const grouped = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    for (const m of menu) {
      const key = m.category + (m.temp ? ` • ${m.temp}` : '');
      (map[key] ||= []).push(m);
    }
    return map;
  }, [menu]);

  return (
    <div className="min-h-screen bg-amber-50 text-zinc-900">
      <header className="p-4 bg-amber-700 text-white text-2xl font-semibold">
        DaVinci Cafe POS ☕
      </header>

      <main className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
        {/* LEFT: Active Orders */}
        <section className="md:col-span-3 bg-white rounded-2xl shadow p-3">
          <h2 className="text-lg font-semibold mb-2">Active Orders</h2>
          <div className="space-y-3 max-h-[72vh] overflow-auto pr-1">
            {orders.map(o => (
              <div key={o.id} className="border rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold">#{o.order_number}</div>
                  <div className="text-sm">
                    {new Date(o.created_at).toLocaleTimeString()}
                  </div>
                </div>
                <ul className="mt-2 text-sm space-y-1">
                  {o.order_items?.map((oi: Order['order_items'][number]) => (
                    <li key={oi.id} className="flex justify-between">
                      <span>
                        {oi.quantity}× {oi.menu_items?.name || oi.item_id}
                      </span>
                      <span>
                        {formatCurrency(oi.unit_price * oi.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex items-center justify-between">
                  <div className="font-semibold">
                    {formatCurrency(Number(o.total))}
                  </div>
                  <button
                    onClick={() => markServed(o.id)}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm active:scale-95"
                  >
                    Served ✅
                  </button>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-sm text-zinc-500">No active orders.</div>
            )}
          </div>
        </section>

        {/* CENTER: Menu */}
        <section className="md:col-span-6 bg-white rounded-2xl shadow p-3">
          <h2 className="text-lg font-semibold mb-2">Menu</h2>
          <div className="space-y-6 max-h-[72vh] overflow-auto pr-1">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="text-sm font-semibold text-amber-800 mb-2">
                  {group}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {items.map(item => (
                    <button
                      key={item.id}
                      className="border rounded-xl p-4 text-left active:scale-95"
                      onClick={() => addToCart(item)}
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-zinc-600">
                        {formatCurrency(Number(item.price))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT: Cart + Total */}
        <section className="md:col-span-3 bg-white rounded-2xl shadow p-3">
          <h2 className="text-lg font-semibold mb-2">Current Order</h2>
          <div className="space-y-2 max-h-[48vh] overflow-auto pr-1">
            {cart.map(it => (
              <div
                key={it.item_id}
                className="flex items-center justify-between border rounded-xl px-3 py-2"
              >
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-zinc-500">
                    {formatCurrency(it.unit_price)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decFromCart(it.item_id)}
                    className="px-2 py-1 border rounded-lg"
                  >
                    –
                  </button>
                  <div className="w-8 text-center">{it.quantity}</div>
                  <button
                    onClick={() =>
                      addToCart({
                        id: it.item_id,
                        name: it.name,
                        price: it.unit_price,
                        category: '',
                        temp: null,
                        active: true,
                        sort_order: 0,
                      } as MenuItem)
                    }
                    className="px-2 py-1 border rounded-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-sm text-zinc-500">
                Tap items to add to order.
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm">Waiting Number (1–30)</div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={30}
                  className="w-20 border rounded-lg px-2 py-1 text-right"
                  value={waitingNumber}
                  onChange={e =>
                    setWaitingNumber(e.target.value ? Number(e.target.value) : '')
                  }
                />
                <button
                  onClick={randomAvailableNumber}
                  className="px-2 py-1 border rounded-lg text-sm"
                >
                  Auto Pick
                </button>
              </div>
            </div>
            <div className="text-xs text-zinc-500 mb-3">
              Available: {autoNumbers.length ? autoNumbers.join(', ') : '—'}
            </div>
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={confirmOrder}
                className="flex-1 px-3 py-2 bg-amber-700 text-white rounded-xl active:scale-95"
              >
                Confirm Order
              </button>
              <button
                onClick={clearCart}
                className="px-3 py-2 border rounded-xl"
              >
                Clear
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
