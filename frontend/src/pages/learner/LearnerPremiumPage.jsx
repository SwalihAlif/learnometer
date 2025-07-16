import { useState } from "react";
import axiosInstance from "../../axios";

export default function LearnerPremiumPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetPremium = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axiosInstance.post("premium/learner/create-premium-checkout/");
      window.location.href = res.data.checkout_url;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to initiate payment.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Learnometer Premium</h1>

      <p className="mb-4 text-gray-600">
        Create unlimited courses, access exclusive mentorship sessions, download premium resources, and leverage advanced AI tools to support your learning journey.
      </p>

      <p className="text-lg font-semibold mb-6">Price: ₹1000 (One-Time)</p>

      <button
        onClick={handleGetPremium}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition"
      >
        {loading ? "Redirecting to Checkout..." : "Get Premium Now"}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}
