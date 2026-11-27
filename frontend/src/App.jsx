import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import OrderSuccessModal from './components/OrderSuccessModal';
import OrdersModal from './components/OrdersModal';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const menuRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadProducts = async () => {
      setLoading(true);
      setProductsError('');
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'All') {
          queryParams.append('category', selectedCategory);
        }
        if (searchQuery) {
          queryParams.append('search', searchQuery);
        }

        const res = await fetch(`/api/products?${queryParams.toString()}`, {
          signal: controller.signal
        });
        if (!res.ok) {
          throw new Error('Unable to load menu items. Please try again.');
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error('The menu response was invalid.');
        }
        setProducts(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setProductsError(err.message || 'Unable to load menu items.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    loadProducts();
    return () => controller.abort();
  }, [selectedCategory, searchQuery, reloadKey]);

  const scrollToMenu = () => {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Hero Banner */}
      <Hero onOrderNowClick={scrollToMenu} />

      {/* Menu / Catalog Section */}
      <main ref={menuRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {selectedCategory === 'All' ? 'Popular Specialties' : `${selectedCategory}`}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Made fresh to order with locally sourced premium ingredients.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-semibold bg-white px-3 py-1.5 rounded-full border border-slate-200">
            Showing {products.length} delicious options
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-slate-200 h-72 rounded-3xl" />
            ))}
          </div>
        ) : productsError ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-red-200">
            <h3 className="text-lg font-bold text-slate-800">Menu unavailable</h3>
            <p className="text-sm text-red-600 mt-2">{productsError}</p>
            <button
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-4 px-4 py-2 bg-brand-50 text-brand-700 text-xs font-bold rounded-xl hover:bg-brand-100"
            >
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80">
            <span className="text-5xl">🔍</span>
            <h3 className="text-lg font-bold text-slate-800 mt-3">No matching items found</h3>
            <p className="text-xs text-slate-400 mt-1">Try searching for something else or clear filters.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="mt-4 px-4 py-2 bg-brand-50 text-brand-700 text-xs font-bold rounded-xl hover:bg-brand-100"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CravingBites — Full-Stack Educational Deployment Demo.</p>
          <div className="flex gap-4 text-xs font-semibold text-slate-600">
            <span>Node.js / Express</span>
            <span>•</span>
            <span>React + Vite + Tailwind</span>
            <span>•</span>
            <span>PostgreSQL & Prisma</span>
            <span>•</span>
            <span>Dockerized</span>
          </div>
        </div>
      </footer>

      {/* Modals & Slide-out Drawers */}
      <CartDrawer />
      <AuthModal />
      <OrderSuccessModal />
      <OrdersModal />
    </div>
  );
}
