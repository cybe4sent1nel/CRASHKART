"use client";

import { useState } from "react";
import { Copy, Share2, Users } from "lucide-react";
import toast from "react-hot-toast";

export default function ReferralCard({ userId, userName }) {
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shareEmail, setShareEmail] = useState("");

  // Generate referral code
  const generateCode = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          userId
        })
      });

      const data = await res.json();
      if (data.success) {
        setReferralCode(data.referralCode);
        fetchStats();
        toast.success("Referral code generated!");
      }
    } catch (error) {
      toast.error("Failed to generate code");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch referral stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/referrals?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast.success("Copied to clipboard!");
    }
  };

  // Share via email
  const shareViaEmail = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invite",
          userId,
          friendEmail: shareEmail,
          friendName: shareEmail.split("@")[0]
        })
      });

      const data = await res.json();
      if (data.success) {
        setShareEmail("");
        toast.success(`Invitation sent to ${shareEmail}`);
        fetchStats();
      } else {
        toast.error(data.message || "Failed to send invite");
      }
    } catch (error) {
      toast.error("Error sending invite");
      console.error(error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Earn by Referring
        </h3>
      </div>

      {/* Referral Code Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Your Referral Code
        </p>
        {referralCode ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={referralCode}
              readOnly
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded font-mono font-bold"
            />
            <button
              onClick={copyToClipboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        ) : (
          <button
            onClick={generateCode}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded font-medium transition"
          >
            {loading ? "Generating..." : "Generate Your Code"}
          </button>
        )}
      </div>

      {/* Share via Email */}
      {referralCode && (
        <form onSubmit={shareViaEmail} className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Invite Friends
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Friend's email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
              required
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
            >
              <Share2 className="w-4 h-4" />
              Invite
            </button>
          </div>
        </form>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded p-3">
            <p className="text-2xl font-bold text-blue-600">
              ₹{stats.totalRewardsEarned}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              You've Earned
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded p-3">
            <p className="text-2xl font-bold text-green-600">
              {stats.completed}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Friends Joined
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
        💡 Share your code and earn ₹500 for each friend who signs up and makes
        their first purchase. They'll also get ₹500!
      </p>
    </div>
  );
}
