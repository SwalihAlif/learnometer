import { useEffect, useState } from "react";
import axiosInstance from "../../axios";
import { useNavigate } from "react-router-dom";

export default function MentorEarningsPage() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

const fetchWalletBalance = () => {
  setLoading(true);
  axiosInstance.get("mentorship/mentor/wallet-balance/")
    .then((res) => {
      setWalletBalance(res.data.wallet_balance);
    })
    .catch((err) => {
      if (err.response && err.response.status === 401) {
        navigate("/login");
      } else {
        setError("Failed to fetch wallet balance");
        console.error(err);
      }
    })
    .finally(() => {
      setLoading(false);
    });
};

useEffect(() => {
  fetchWalletBalance();
}, [navigate]);




    const handleWithdraw = () => {
    if (walletBalance <= 0) {
      alert("No balance available for withdrawal.");
      return;
    }

    setProcessing(true);

    axiosInstance.post("mentorship/mentor/request-payout/")
      .then(() => {
        alert("Withdrawal successful!");
        fetchWalletBalance();
      })
      .catch((err) => {
        alert(err.response?.data?.error || "Withdrawal failed.");
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  if (loading) return <div className="p-4">Loading wallet balance...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mentor Wallet</h1>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium">Wallet Balance</h2>
        <p className="text-3xl font-semibold text-green-600">₹{walletBalance}</p>
      </div>
            <button
        onClick={handleWithdraw}
        disabled={processing || walletBalance <= 0}
        className={`px-4 py-2 rounded bg-blue-600 text-white ${processing || walletBalance <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {processing ? "Processing..." : "Withdraw"}
      </button>
    </div>
  );
}