import { useEffect, useState } from "react";
import axiosInstance from "../../axios";
import { Crown, Sparkles, CreditCard, ArrowRight, Gift  } from 'lucide-react';


export default function LearnerPremiumPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [inputReferralCode, setInputReferralCode] = useState("");
  const [isStripeOnboarded, setIsStripeOnboarded] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState(1000)



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

  useEffect(() => {
    const fetchPremiumPrice = async () => {

      try {

        const res = await axiosInstance.get("premium/learner/premium/price/");
        console.log("Premium price: ", res.data)
        setPremiumPrice(res.data.premium_price)
      } catch (err) {
        console.error(err)
      }

    };
    fetchPremiumPrice();
  }, [])

  useEffect(() => {
    const fetchStripeStatus = async () => {
      try {
        const response = await axiosInstance.get("premium/learner/stripe/status/");
        console.log("Stripe status: ", response.data)
        setIsStripeOnboarded(response.data.onboarding_complete);

      } catch (err) {
        console.error("Error in Stripe status fetching: ", err)
      }

    };
    fetchStripeStatus();
  })

  const handleCreateAccount = async () => {
    try {
      const response = await axiosInstance.post('premium/learner/stripe/create/');
      const data = response.data;

      if (data.onboarding_required && data.onboarding_url) {
        // Redirect to Stripe onboarding link
        window.location.href = data.onboarding_url;
      } else {
        // Onboarding already completed
        alert('Stripe account already set up and onboarded.');
      }
    } catch (err) {
      console.error('Failed to create Stripe account:', err);
      alert(err.response?.data?.error || 'Something went wrong. Try again later.');
    }
  };

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


  // if (isActive) {
  //   return (
  //     <div className="max-w-xl mx-auto p-6 text-center">
  //       <h1 className="text-3xl font-bold mb-4">You are a Premium Learner!</h1>
  //       {referralCode && (
  //         <p className="text-lg font-semibold">
  //           Your Referral Code: <span className="text-blue-600">{referralCode}</span>
  //         </p>
  //       )}
  //     </div>
  //   );
  // }

  // if (!isStripeOnboarded) {
  //   return (
  //     <div className="p-4 bg-white rounded shadow text-center">
  //       <p className="mb-4 text-lg font-medium text-gray-700">
  //         🎉 Subscribe to premium and start earning! You’ll get <span className="font-bold">30%</span> from every referral using your code.
  //       </p>
  //       <button
  //         onClick={handleCreateAccount}
  //         className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  //       >
  //         Create Payment Account
  //       </button>
  //     </div>
  //   );
  // }


  // return (
  //   <div className="max-w-xl mx-auto p-6 text-center">
  //     <h1 className="text-3xl font-bold mb-4">Learnometer Premium</h1>

  //     <p className="mb-4 text-gray-600">
  //       Create unlimited courses, access exclusive mentorship sessions, download premium resources, and leverage advanced AI tools to support your learning journey.
  //     </p>

  //     <p className="text-lg font-semibold mb-6">Price: ₹1000 (One-Time)</p>

  //     {/* Referral Input */}
  //     <input
  //       type="text"
  //       value={inputReferralCode}
  //       onChange={(e) => setInputReferralCode(e.target.value)}
  //       placeholder="Referral Code (optional)"
  //       className="border p-2 rounded w-full mb-4"
  //     />

  //     <button
  //       onClick={handleGetPremium}
  //       disabled={loading}
  //       className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition"
  //     >
  //       {loading ? "Redirecting to Checkout..." : "Get Premium Now"}
  //     </button>

  //     {error && <p className="text-red-500 mt-4">{error}</p>}
  //   </div>
  // );

    return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* 1. Premium Learner View */}
      {isActive && (
        <div className="max-w-md w-full bg-indigo-950 text-white rounded-2xl shadow-xl p-8 text-center border border-indigo-600 animate-fade-in-up transition-transform transform hover:scale-105">
          <Sparkles className="mx-auto w-16 h-16 text-yellow-400 mb-6 animate-pulse" />
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">You are a Premium Learner!</h1>
          <p className="text-gray-300 mb-6">Welcome to the exclusive community. Enjoy your premium benefits!</p>
          {referralCode && (
            <div className="bg-indigo-800 rounded-xl p-4 mt-6">
              <p className="text-sm font-light uppercase text-gray-400">Your Personal Referral Code</p>
              <p className="text-2xl font-bold tracking-widest mt-1 text-yellow-400">{referralCode}</p>
            </div>
          )}
        </div>
      )}

      {/* 2. Stripe Onboarding View */}
      {!isActive && !isStripeOnboarded && (
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-200 animate-fade-in-up transition-transform transform hover:scale-105">
          <Gift className="mx-auto w-12 h-12 text-indigo-600 mb-4" />
          <h2 className="text-2xl font-bold text-indigo-950 mb-3">Become a Learnometer Affiliate</h2>
          <p className="mb-6 text-gray-700">
            🎉 Subscribe to premium and start earning! You’ll get <span className="font-bold text-indigo-600">30%</span> from every referral using your code.
          </p>
          <button
            onClick={handleCreateAccount}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors duration-300"
          >
            {loading ? "Redirecting..." : "Create Payment Account"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      )}  

      {/* 3. Main Premium Subscription View */}
      {!isActive && isStripeOnboarded && (
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-200 animate-fade-in-up transition-transform transform hover:scale-105">
          <Crown className="mx-auto w-12 h-12 text-yellow-400 mb-4" />
          <h1 className="text-3xl font-bold text-indigo-950 mb-2">Go Premium</h1>
          <p className="text-gray-600 mb-6">
            Create unlimited courses, access exclusive mentorship sessions, download premium resources, and leverage advanced AI tools to support your learning journey.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-gray-500">One-Time Payment</p>
            <p className="text-3xl font-bold text-indigo-950">₹{premiumPrice}</p>
          </div>

          {/* Referral Input */}
          <div className="mb-4">
            <label htmlFor="referral" className="sr-only">Referral Code</label>
            <input
              id="referral"
              type="text"
              value={inputReferralCode}
              onChange={(e) => setInputReferralCode(e.target.value)}
              placeholder="Referral Code (optional)"
              className="border border-gray-300 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
            />
          </div>

          <button
            onClick={handleGetPremium}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold hover:bg-indigo-700 transition-colors duration-300"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Redirecting to Checkout...
              </>
            ) : (
              <>
                Get Premium Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
      )}
    </div>
  );
}
