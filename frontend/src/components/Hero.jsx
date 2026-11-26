import React from 'react';
import { Sparkles, Flame, Clock, Award } from 'lucide-react';

export default function Hero({ onOrderNowClick }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-stone-900 text-white py-14 sm:py-20 rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-6 shadow-2xl">
      {/* Decorative background blurs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* Left Column Content */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs font-bold tracking-wide">
            <Flame className="w-4 h-4 text-brand-400 animate-pulse" />
            <span>STUDENT DEVOPS MASTERCLASS SPECIAL</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Craving Great Food? <br />
            <span className="bg-gradient-to-r from-brand-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
              Hot & Fresh In 20 Min.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0">
            Handcrafted burgers, artisan stonebaked pizzas, and refreshers delivered straight to your door. Experience modern microservice ordering built for production.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <button
              onClick={onOrderNowClick}
              className="px-8 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/30 hover:shadow-brand-500/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Explore Menu 🍔
            </button>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1 font-medium bg-white/10 px-3 py-1.5 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> ~20 min delivery
              </span>
              <span className="flex items-center gap-1 font-medium bg-white/10 px-3 py-1.5 rounded-xl">
                <Award className="w-3.5 h-3.5 text-brand-400" /> 4.9★ Top Rated
              </span>
            </div>
          </div>
        </div>

        {/* Right Column Featured Banner Image */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="relative animate-float">
            <img
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80"
              alt="Gourmet Truffle Burger"
              className="w-72 sm:w-80 h-72 sm:h-80 object-cover rounded-3xl shadow-2xl border-4 border-white/10 rotate-2 hover:rotate-0 transition-transform duration-300"
            />
            {/* Floating pill badges */}
            <div className="absolute -bottom-4 -left-4 bg-white text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-slate-100">
              <span className="text-base">🔥</span>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Chef's Choice</p>
                <p>Truffle Angus Burger</p>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-brand-600 text-white px-3.5 py-1.5 rounded-2xl shadow-lg text-xs font-extrabold">
              $13.99
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
