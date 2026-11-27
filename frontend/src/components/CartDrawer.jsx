import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, MapPin, CreditCard, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    deliveryFee,
    total,
    setActiveOrder
  } = useCart();

  const { user, token, openAuthModal } = useAuth();

  const [address, setAddress] = useState('42 Dev Lane, Tech Park, Suite 101');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    if (!user) {
      setIsCartOpen(false);
      openAuthModal('login');
      return;
    }

    if (!address.trim()) {
      setErrorMsg('Please enter a delivery address');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cartItems,
          address,
          paymentMethod
        })
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Success
      clearCart();
      setIsCartOpen(false);
      setActiveOrder(data.order);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slideInRight">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-800">Your Order</h2>
              <span className="text-xs bg-brand-100 text-brand-700 px-2.5 py-0.5 rounded-full font-bold">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <span className="text-5xl mb-3">🍽️</span>
                <p className="text-base font-bold text-slate-700">Your cart is empty</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Discover our delicious burgers, pizzas, and drinks to add to your order.
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-100"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{item.name}</h4>
                    <p className="text-xs font-extrabold text-brand-600 mt-0.5">
                      ${parseFloat(item.price).toFixed(2)}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-800 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout section */}
          {cartItems.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
              {/* Delivery Address input */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3 text-brand-600" /> Delivery Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter street, apartment, floor..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Payment Method selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <CreditCard className="w-3 h-3 text-brand-600" /> Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash on Delivery')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      paymentMethod === 'Cash on Delivery'
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    💵 Cash on Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Card (Demo)')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      paymentMethod === 'Card (Demo)'
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    💳 Credit Card
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 pt-2 text-xs text-slate-500 border-t border-slate-200/60">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate-700">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-brand-600">${total.toFixed(2)}</span>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-600 font-semibold bg-red-50 p-2 rounded-lg">
                  {errorMsg}
                </p>
              )}

              {/* Checkout Action Button */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50"
              >
                <span>{loading ? 'Placing Order...' : user ? 'Confirm & Place Order' : 'Log In to Place Order'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
