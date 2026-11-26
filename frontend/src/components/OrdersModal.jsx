import React, { useState, useEffect } from 'react';
import { X, Clock, Package, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function OrdersModal() {
  const { isOrdersOpen, setIsOrdersOpen } = useCart();
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOrdersOpen && token) {
      fetchOrders();
    }
  }, [isOrdersOpen, token]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOrdersOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-extrabold text-slate-800">Order History</h3>
          </div>
          <button
            onClick={() => setIsOrdersOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading past orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No past orders found</p>
              <p className="text-xs mt-1">Place an order to see it appear in real-time!</p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 font-mono">#{ord.id}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {ord.status || 'CONFIRMED'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString()}</span>
                  <span className="font-extrabold text-slate-900">${parseFloat(ord.totalAmount).toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  📍 {ord.address} · {ord.paymentMethod}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
