"use client";

import { useState, useEffect } from "react";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function OneClickCheckout({ userId, cartItems, onCheckoutSuccess }) {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);

  useEffect(() => {
    fetchSavedCards();
  }, [userId]);

  const fetchSavedCards = async () => {
    try {
      const res = await fetch(`/api/checkout/one-click?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setCards(data.cards);
        const defaultCard = data.cards.find(c => c.isDefault);
        if (defaultCard) {
          setSelectedCard(defaultCard.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch cards:", error);
    }
  };

  const handleCheckout = async () => {
    if (!selectedCard) {
      toast.error("Please select a payment card");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout/one-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          cartItems,
          addressId: "address-123", // Should come from context/state
          savedCardId: selectedCard
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Order placed successfully! 🎉");
        onCheckoutSuccess?.(data.orders);
      } else {
        toast.error(data.error || "Checkout failed");
      }
    } catch (error) {
      toast.error("Checkout error. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCard = async (cardId) => {
    const { showConfirm } = await import('@/lib/alertUtils');
    const confirmed = await showConfirm(
      'Delete Card?',
      'Are you sure you want to delete this card? You can add it again later.'
    );
    
    if (!confirmed) return;
    
    try {
      // Implement delete endpoint as needed
      setCards(cards.filter(c => c.id !== cardId));
      if (selectedCard === cardId) {
        setSelectedCard(cards[0]?.id || null);
      }
      toast.success("Card deleted");
    } catch (error) {
      toast.error("Failed to delete card");
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Express Checkout
        </h3>
      </div>

      {cards.length > 0 ? (
        <>
          {/* Saved Cards */}
          <div className="space-y-3 mb-6">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Select Payment Method
            </label>

            {cards.map((card) => (
              <div
                key={card.id}
                onClick={() => setSelectedCard(card.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  selectedCard === card.id
                    ? "border-blue-500 bg-white dark:bg-gray-800"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                      {card.brand.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {card.brand} •••• {card.last4}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Expires {card.expMonth}/{card.expYear}
                      </p>
                    </div>
                  </div>

                  {card.isDefault && (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold px-3 py-1 rounded-full">
                      Default
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCard(card.id);
                    }}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={loading || !selectedCard}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? "Processing..." : "Complete Purchase"}
            <CreditCard className="w-5 h-5" />
          </button>

          {/* Add Card Option */}
          <button
            onClick={() => setShowAddCard(true)}
            className="w-full mt-3 border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 font-medium py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Card
          </button>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No saved payment methods yet
          </p>
          <button
            onClick={() => setShowAddCard(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition flex items-center justify-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Add Payment Method
          </button>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
        💡 One-click checkout lets you pay faster with your saved cards. Your
        payment information is secure and encrypted.
      </p>
    </div>
  );
}
