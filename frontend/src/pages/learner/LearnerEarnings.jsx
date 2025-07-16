import React, { useEffect, useState } from "react";
import axiosInstance from "../../axios";

const LearnerEarnings = () => {
  const [walletAmount, setWalletAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await axiosInstance.get("premium/learner/earnings/");
      setWalletAmount(res.data.wallet_balance);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch earnings.");
    }
  };

  const handlePayout = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await axiosInstance.post("premium/learner/payout/");
      setMessage(res.data.message || "Payout requested successfully.");
      fetchEarnings(); // refresh after payout
    } catch (err) {
      setError(err.response?.data?.error || "Failed to initiate payout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Your Referral Earnings</h2>

      <p className="text-lg mb-4">Total: ₹{walletAmount.toFixed(2)}</p>

      {message && <p className="text-green-600 mb-2">{message}</p>}
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <button
        onClick={handlePayout}
        disabled={loading || walletAmount < 1}
        className={`w-full px-4 py-2 rounded ${
          loading || walletAmount < 1
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {loading ? "Processing..." : "Request Payout"}
      </button>
    </div>
  );
};

export default LearnerEarnings;
