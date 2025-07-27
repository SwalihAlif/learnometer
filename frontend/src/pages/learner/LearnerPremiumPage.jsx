import { useEffect, useState } from "react";
import axiosInstance from "../../axios";

export default function LearnerPremiumPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [inputReferralCode, setInputReferralCode] = useState("");


  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axiosInstance.get("premium/learner/premium/status/");
        setIsActive(res.data.is_active);
        console.log("is active: ", res.data.is_active)
        setReferralCode(res.data.referral_code);
        console.log("Referral code: ", res.data.referral_code)
      } catch (err) {
        console.error(err);

      }
    };
    fetchStatus();
  }, []);

const handleGetPremium = async () => {
  setLoading(true);
  setError("");

  try {
    const res = await axiosInstance.post("premium/learner/create-premium-checkout/", {
      referral_code: inputReferralCode.trim() || null,
    });

    if (res.data.onboarding_required) {
      window.location.href = res.data.onboarding_url;
    } else if (res.data.checkout_url) {
      window.location.href = res.data.checkout_url;
    } else {
      setError("Unexpected server response. Please try again later.");
      console.error("Unexpected response:", res.data);
    }
  } catch (err) {
    setError(err.response?.data?.error || "Failed to initiate payment.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};


    if (isActive) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">You are a Premium Learner!</h1>
        {referralCode && (
          <p className="text-lg font-semibold">
            Your Referral Code: <span className="text-blue-600">{referralCode}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Learnometer Premium</h1>

      <p className="mb-4 text-gray-600">
        Create unlimited courses, access exclusive mentorship sessions, download premium resources, and leverage advanced AI tools to support your learning journey.
      </p>

      <p className="text-lg font-semibold mb-6">Price: ₹1000 (One-Time)</p>

      {/* Referral Input */}
      <input
        type="text"
        value={inputReferralCode}
        onChange={(e) => setInputReferralCode(e.target.value)}
        placeholder="Referral Code (optional)"
        className="border p-2 rounded w-full mb-4"
      />

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
