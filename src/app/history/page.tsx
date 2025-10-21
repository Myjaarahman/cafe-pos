'use client';
import { useEffect, useState } from 'react';
import { Order } from '@/types';
import { formatCurrency } from '@/utils/money';

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => {
        // filter served + cancelled orders
        const past = (d.orders || []).filter(
          (o: Order) => o.status === 'served' || o.status === 'cancelled'
        );
        setOrders(past);
      });
  }, []);

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Past Orders 📜</h1>
      <div className="space-y-4">
        {orders.map((o: Order) => (
          <div key={o.id} className="bg-white p-3 rounded-xl shadow">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">#{o.order_number}</div>
                <div className="text-sm text-zinc-500">
                  {new Date(o.created_at).toLocaleString()}
                </div>
              </div>
              <div
                className={`text-sm font-medium ${
                  o.status === 'served' ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {o.status.toUpperCase()}
              </div>
            </div>
            <ul className="mt-2 text-sm space-y-1">
              {o.order_items?.map((oi: Order['order_items'][number]) => (
                <li key={oi.id} className="flex justify-between">
                  <span>
                    {oi.quantity}× {oi.menu_items?.name || oi.item_id}
                  </span>
                  <span>{formatCurrency(oi.unit_price * oi.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 text-right font-semibold">
              Total: {formatCurrency(Number(o.total))}
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="text-zinc-500 text-sm">No past orders found.</div>
        )}
      </div>
    </div>
  );
}
