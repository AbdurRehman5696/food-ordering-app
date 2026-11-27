import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  PLACED: 'New',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered'
};

const NEXT_STATUS = {
  PLACED: { status: 'PREPARING', label: 'Accept order' },
  PREPARING: { status: 'OUT_FOR_DELIVERY', label: 'Send for delivery' },
  OUT_FOR_DELIVERY: { status: 'DELIVERED', label: 'Mark delivered' }
};

async function readResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'The request failed');
  }
  return data;
}

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [overviewResponse, ordersResponse] = await Promise.all([
          fetch('/api/admin/overview', { headers, signal: controller.signal }),
          fetch(`/api/admin/orders?page=${page}&status=${statusFilter}`, {
            headers,
            signal: controller.signal
          })
        ]);
        const [overviewData, ordersData] = await Promise.all([
          readResponse(overviewResponse),
          readResponse(ordersResponse)
        ]);
        setOverview(overviewData);
        setOrders(ordersData.orders);
        setTotal(ordersData.total);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load the admin dashboard.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    return () => controller.abort();
  }, [token, page, statusFilter, refreshKey]);

  const updateOrderStatus = async (order) => {
    const transition = NEXT_STATUS[order.status];
    if (!transition) return;

    setUpdatingOrder(order.id);
    setError('');
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: transition.status })
      });
      await readResponse(response);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message || 'Unable to update order status.');
    } finally {
      setUpdatingOrder('');
    }
  };

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const cards = overview ? [
    { label: 'Total orders', value: overview.totalOrders, icon: ShoppingBag, tone: 'text-indigo-700 bg-indigo-50' },
    { label: 'Customers', value: overview.totalCustomers, icon: Users, tone: 'text-sky-700 bg-sky-50' },
    { label: 'Order revenue', value: formatCurrency(overview.totalRevenue), icon: DollarSign, tone: 'text-emerald-700 bg-emerald-50' },
    { label: 'New orders', value: overview.ordersByStatus.PLACED, icon: Clock3, tone: 'text-amber-700 bg-amber-50' },
    { label: 'Preparing', value: overview.ordersByStatus.PREPARING, icon: ChefHat, tone: 'text-orange-700 bg-orange-50' },
    { label: 'Out for delivery', value: overview.ordersByStatus.OUT_FOR_DELIVERY, icon: Truck, tone: 'text-violet-700 bg-violet-50' },
    { label: 'Delivered', value: overview.ordersByStatus.DELIVERED, icon: CheckCircle2, tone: 'text-teal-700 bg-teal-50' }
  ] : [];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">CravingBites</p>
              <h1 className="text-xl font-extrabold">Admin dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-slate-300">{user?.email}</span>
            <a href="/" className="text-sm font-semibold text-slate-300 hover:text-white">Storefront</a>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-extrabold">Overview</h2>
            <p className="text-sm text-slate-500 mt-1">Review sales, customers, and current order progress.</p>
          </div>
          <button
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {overview && (
          <section aria-label="Order overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map(({ label, value, icon: Icon, tone }) => (
              <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500">{label}</p>
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-extrabold">{value}</p>
              </article>
            ))}
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold">Customer orders</h2>
              <p className="text-xs text-slate-500 mt-1">Customer names, emails, delivery details, and order items.</p>
            </div>
            <label className="text-sm font-semibold text-slate-600">
              Filter
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                <option value="ALL">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                  <option value={status} key={status}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          {loading && orders.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No orders found for this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Order / Customer</th>
                    <th className="px-5 py-3">Items</th>
                    <th className="px-5 py-3">Delivery</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Next action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const transition = NEXT_STATUS[order.status];
                    return (
                      <tr key={order.id} className="align-top">
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">#{order.id}</p>
                          <p className="mt-1 font-semibold">{order.user.name}</p>
                          <p className="text-xs text-slate-500">{order.user.email}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <ul className="space-y-1">
                            {order.items.map((item) => (
                              <li key={item.id} className="text-slate-700">
                                {item.quantity} × {item.product.name}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-xs text-slate-500">{order.paymentMethod}</p>
                        </td>
                        <td className="px-5 py-4 max-w-48 whitespace-normal text-slate-600">{order.address}</td>
                        <td className="px-5 py-4 font-extrabold">{formatCurrency(order.totalAmount)}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {transition ? (
                            <button
                              onClick={() => updateOrderStatus(order)}
                              disabled={updatingOrder === order.id}
                              className="whitespace-nowrap rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50"
                            >
                              {updatingOrder === order.id ? 'Updating...' : transition.label}
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700">Complete</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
            <p className="text-xs text-slate-500">
              {total === 0 ? '0 orders' : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total} orders`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                aria-label="Previous page"
                className="rounded-lg border border-slate-300 p-2 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages || loading}
                aria-label="Next page"
                className="rounded-lg border border-slate-300 p-2 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
