import { useState } from "react";
import axiosInstance from "../../axios";

export default function AdminAddTestBalancePage() {
  const [amount, setAmount] = useState(100000); // Default ₹1,00,000
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddBalance = async (e) => {
    e.preventDefault();

    if (amount <= 0) {
      setMessage("Please enter a valid amount in INR.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axiosInstance.post("adminpanel/add-test-balance/", {
        amount: amount,
      });

      setMessage(response.data.message || "Balance added successfully.");
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to add balance.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin – Add Test Balance</h1>

      <form onSubmit={handleAddBalance} className="space-y-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="border p-2 rounded w-full"
          placeholder="Amount in INR"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Processing..." : "Add Test Balance"}
        </button>

        {message && (
          <p className="mt-2 text-sm">{message}</p>
        )}
      </form>
    </div>
  );
}
