import React from 'react';
import { CheckCircle2, Clock, ChefHat, Bike, Home, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function OrderSuccessModal() {
  const { activeOrder, setActiveOrder } = useCart();

  if (!activeOrder) return null;

  const steps = [
    { num: 1, label: 'Order Placed', icon: Clock },
    { num: 2, label: 'Kitchen Preparing', icon: ChefHat },
    { num: 3, label: 'On The Way', icon: Bike },
    { num: 4, label: 'Delivered', icon: Home }
  ];
  const statusSteps = {
    PLACED: 1,
    PREPARING: 2,
    OUT_FOR_DELIVERY: 3,
    DELIVERED: 4
  };
  const currentStep = statusSteps[activeOrder.status] || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 animate-scaleUp text-center">
        {/* Close */}
        <button
          onClick={() => setActiveOrder(null)}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration header */}
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h3 className="text-2xl font-extrabold text-slate-900">
          Order Confirmed! 🎉
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Order ID: <span className="font-mono font-bold text-slate-800">{activeOrder.id}</span>
        </p>

        {/* Live Animated Status Tracker */}
        <div className="my-8 px-2">
          <div className="relative flex items-center justify-between">
            {/* Progress line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 w-full z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-700 z-0"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((s) => {
              const Icon = s.icon;
              const isPassed = currentStep >= s.num;
              const isCurrent = currentStep === s.num;

              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isPassed
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : 'bg-white border-2 border-slate-200 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold mt-2 whitespace-nowrap ${
                    isPassed ? 'text-emerald-700' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary card */}
        <div className="p-4 bg-slate-50 rounded-2xl text-left text-xs space-y-2 border border-slate-100">
          <div className="flex justify-between text-slate-600">
            <span>Delivery Address:</span>
            <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">
              {activeOrder.address}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Payment Method:</span>
            <span className="font-semibold text-slate-800">{activeOrder.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-slate-800 font-bold pt-2 border-t border-slate-200">
            <span>Total Paid:</span>
            <span className="text-brand-600 font-extrabold text-sm">
              ${parseFloat(activeOrder.totalAmount).toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={() => setActiveOrder(null)}
          className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
