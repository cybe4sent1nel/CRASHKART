"use client";

import { useState, useEffect } from "react";
import { Flame, Clock } from "lucide-react";
import Link from "next/link";

export default function FlashSaleCard({ saleId, onLoadComplete }) {
  const [sale, setSale] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSale();
  }, [saleId]);

  const fetchSale = async () => {
    try {
      const res = await fetch(`/api/flash-sales?saleId=${saleId}`);
      const data = await res.json();
      if (data.success) {
        setSale(data.sale);
        onLoadComplete?.();
      }
    } catch (error) {
      console.error("Failed to fetch sale:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sale) return;

    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(sale.endTime);
      const remaining = Math.max(0, end - now);

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeRemaining({
        hours,
        minutes,
        seconds,
        total: remaining
      });

      if (remaining === 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [sale]);

  if (loading || !sale) {
    return (
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-80 animate-pulse" />
    );
  }

  if (!timeRemaining || timeRemaining.total <= 0) {
    return null; // Sale ended
  }

  return (
    <Link href={`/flash-sale/${sale.id}`}>
      <div className="relative group cursor-pointer overflow-hidden rounded-lg">
        {/* Banner Background */}
        <div className="relative h-80 bg-gradient-to-br from-red-500 to-orange-500 p-6 flex flex-col justify-between">
          {/* Flash Sale Badge */}
          <div className="flex items-center gap-2 w-fit">
            <Flame className="w-6 h-6 text-yellow-300 animate-pulse" />
            <span className="bg-yellow-300 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
              FLASH SALE
            </span>
          </div>

          {/* Title & Discount */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">{sale.title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-yellow-300">
                {sale.discount}%
              </span>
              <span className="text-white text-lg">OFF</span>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm rounded-lg p-3 w-fit">
            <Clock className="w-5 h-5 text-yellow-300" />
            <div className="text-white font-mono text-sm">
              <span className="text-lg font-bold">{String(timeRemaining.hours).padStart(2, "0")}</span>
              <span>:</span>
              <span className="text-lg font-bold">{String(timeRemaining.minutes).padStart(2, "0")}</span>
              <span>:</span>
              <span className="text-lg font-bold">{String(timeRemaining.seconds).padStart(2, "0")}</span>
            </div>
          </div>
        </div>

        {/* Product Preview */}
        <div className="bg-white dark:bg-gray-800 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Featured Products
          </p>

          {sale.products && sale.products.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {sale.products.slice(0, 4).map((product) => (
                <div key={product.id} className="text-center">
                  {product.images && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded mx-auto mb-2"
                    />
                  )}
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {product.name}
                  </p>
                  <div className="flex items-center justify-center gap-1 text-xs mt-1">
                    <span className="line-through text-gray-500">
                      ₹{Math.round(product.originalPrice)}
                    </span>
                    <span className="text-green-600 font-bold">
                      ₹{Math.round(product.salePrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sale.products && sale.products.length > 4 && (
            <p className="text-xs text-center text-gray-500 mt-2">
              +{sale.products.length - 4} more products
            </p>
          )}

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (sale.sold / (sale.maxQuantity * 5)) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {sale.sold} sold
            </p>
          </div>

          <button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition group-hover:shadow-lg">
            Shop Sale
          </button>
        </div>
      </div>
    </Link>
  );
}
