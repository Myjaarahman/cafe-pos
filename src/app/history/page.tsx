'use client';
import { useEffect, useState, useMemo } from 'react';
import { Order } from '@/types';
import { formatCurrency } from '@/utils/money';

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => {
        // Filter only served or cancelled orders
        const past = (d.orders || []).filter(
          (o: Order) => o.status === 'served' || o.status === 'cancelled'
        );
        // Sort by date descending (newest first)
        past.sort(
          (a: Order, b: Order) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(past);
      });
  }, []);

  // Group orders by date (yyyy-mm-dd)
  const groupedOrders = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    for (const o of orders) {
      const date = new Date(o.created_at)
        .toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        .toString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(o);
    }
    return groups;
  }, [orders]);

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <h1 className="text-2xl font-bold mb-4 text-amber-800">
        Past Orders 📜
      </h1>

      {Object.entries(groupedOrders).length === 0 && (
        <div className="text-zinc-500 text-sm">No past orders found.</div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedOrders).map(([date, orders]) => (
          <div key={date}>
            <h2 className="text-lg font-semibold text-amber-700 mb-2">
              {date}
            </h2>

            <div className="space-y-3">
              {orders.map(o => (
                <div
                  key={o.id}
                  className="bg-white rounded-xl shadow p-4 border border-amber-100"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold">
                      Order #{o.order_number}
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        o.status === 'served'
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {o.status.toUpperCase()}
                    </div>
                  </div>

                  <ul className="text-sm text-zinc-700 space-y-1 mb-2">
                    {o.order_items?.map(oi => (
                      <li
                        key={oi.id}
                        className="flex justify-between border-b border-dotted border-zinc-200 pb-0.5"
                      >
                        <span>
                          {oi.quantity}× {oi.menu_items?.name || oi.item_id}
                        </span>
                        <span>
                          {formatCurrency(oi.unit_price * oi.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex justify-between items-center text-sm text-zinc-600">
                    <div>
                      🕒{' '}
                      {new Date(o.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="font-semibold text-amber-700">
                      Total: {formatCurrency(Number(o.total))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
