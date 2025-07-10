import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import toast from "react-hot-toast";
import { isBefore, parseISO } from "date-fns";
//stripe import
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';


const BookMentorSession = () => {
  const { mentorId } = useParams();
  const [mentor, setMentor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const SLOTS_PER_PAGE = 5;

  const stripe = useStripe();
  const elements = useElements();

  const fetchMentor = async () => {
    try {
      const res = await axiosInstance.get(`users/profile/${mentorId}/`);
      setMentor(res.data);
    } catch (error) {
      toast.error("Failed to load mentor info.");
      console.error("Mentor fetch error:", error);
    }
  };

  const fetchAvailability = async () => {
    if (!mentorId || mentorId === "undefined") return;
    try {
      const res = await axiosInstance.get(`mentorship/availability/?mentor=${mentorId}`);
      setAvailability(res.data?.results || res.data);
    } catch (error) {
      toast.error("Could not fetch mentor availability.");
      console.error(error);
    }
  };

  const fetchSlotsForDate = async (date) => {
    if (!mentorId || mentorId === "undefined" || !date) return;
    const isoDate = date.toLocaleDateString("en-CA");
    try {
      const res = await axiosInstance.get(`mentorship/availability/?mentor=${mentorId}&date=${isoDate}`);
      const allSlots = res.data?.results || res.data;

      const now = new Date();
      const futureSlots = allSlots.filter(slot => {
        const slotDateTime = new Date(`${slot.date}T${slot.start_time}`);
        return !isBefore(slotDateTime, now);
      });

      if (futureSlots.length === 0) toast("No upcoming slots for selected date.");
      setSlots(futureSlots);
      setCurrentPage(1); // reset pagination
    } catch (error) {
      toast.error("Error loading slots.");
      console.error(error);
    }
  };

  useEffect(() => {
    if (mentorId && mentorId !== "undefined") {
      fetchMentor();
      fetchAvailability();
    }
  }, [mentorId]);





const handleBook = async (slot) => {
  if (!stripe || !elements) {
    toast.error("❌ Stripe is not ready");
    return;
  }

  const now = new Date();
  const slotStart = new Date(`${slot.date}T${slot.start_time}`);
  if (isBefore(slotStart, now)) {
    toast.error("⏰ This slot is in the past.");
    return;
  }

  try {
    const payload = {
      type: "session",
      mentor_id: mentor.user_id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      amount: slot.session_price || 500.0,
    };

    console.log("Slot amount:", slot.session_price);

    // 🧾 Step 1: Create PaymentIntent from backend
    const res = await axiosInstance.post("mentorship/book-session/", payload);
    const { clientSecret, bookingId } = res.data;
    console.log("✅ PaymentIntent created:", res.data);

    // 💳 Step 2: Confirm card payment
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    console.log("💬 Stripe confirm result:", result);

    // 🎯 Step 3: Handle payment outcome
    if (result.error) {
      toast.error(result.error.message || "❌ Payment failed");
    } else {
      const status = result.paymentIntent?.status;

      switch (status) {
        case "succeeded":
          toast.success("🎉 Payment successful! Session booked.");
          fetchSlotsForDate(selectedDate);
          break;

        case "requires_capture":
          toast.success("✅ Payment authorized. Capture required.");
          break;

        case "requires_action":
          toast("⚠️ Additional authentication required.");
          break;

        default:
          toast.error(`⚠️ Unexpected status: ${status}`);
      }
    }

  } catch (err) {
    if (err.response?.data) {
      const { error, onboarding_url } = err.response.data;
      console.error("❌ Booking failed:", err.response.data);

      toast.error(error || "Booking or payment failed.");

      if (onboarding_url) {
        toast("⚠️ Mentor not onboarded to Stripe. Redirecting...");
        window.open(onboarding_url, "_blank");
      }
    } else {
      toast.error("❌ Booking or payment failed due to server issue.");
      console.error("❗ Unknown Stripe booking error", err);
    }
  }
};




  const availableDates = availability.map((slot) => slot.date);
  const tileClassName = ({ date }) => {
    const iso = date.toLocaleDateString("en-CA");
    if (availableDates.includes(iso)) return "bg-green-200";
    if (date < new Date()) return "line-through bg-gray-100";
    return "bg-red-100 line-through";
  };

  const totalPages = Math.ceil(slots.length / SLOTS_PER_PAGE);
  const paginatedSlots = slots.slice((currentPage - 1) * SLOTS_PER_PAGE, currentPage * SLOTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Book Your Mentorship Session
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-teal-500 to-blue-500 mx-auto rounded-full"></div>
        </div>

        {/* Mentor Profile Card */}
        {mentor && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2"></div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl font-bold text-teal-600">
                      {mentor.full_name?.charAt(0)?.toUpperCase() || 'M'}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    {mentor.full_name}
                  </h2>
                  
                  {mentor.bio && (
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {mentor.bio}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">💼</span>
                        <span className="text-sm font-medium text-gray-500">Experience</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {mentor.experience_years} years
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">📚</span>
                        <span className="text-sm font-medium text-gray-500">Sessions</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {mentor.session_count} completed
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">⭐</span>
                        <span className="text-sm font-medium text-gray-500">Rating</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {mentor.avg_rating || "N/A"}
                      </p>
                    </div>
                  </div>
                  
                  {mentor.languages_known && mentor.languages_known.length > 0 && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-500 mb-2 block">Languages:</span>
                      <div className="flex flex-wrap gap-2">
                        {mentor.languages_known.map((lang, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {mentor.preferred_categories && mentor.preferred_categories.length > 0 && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-500 mb-2 block">Expertise:</span>
                      <div className="flex flex-wrap gap-2">
                        {mentor.preferred_categories.map((category, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">📅</span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Select a Date</h3>
            </div>
            
            <div className="calendar-container">
              <Calendar
                onChange={(date) => {
                  setSelectedDate(date);
                  fetchSlotsForDate(date);
                }}
                tileClassName={tileClassName}
                minDate={new Date()}
                maxDate={new Date(new Date().setDate(new Date().getDate() + 30))}
                className="w-full"
              />
            </div>
            
            <div className="mt-6 text-sm text-gray-600">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-200 rounded mr-2"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
                  <span>Unavailable</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
                  <span>Past dates</span>
                </div>
              </div>
            </div>
          </div>

          {/* Time Slots Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
            {selectedDate ? (
              <>
                <div className="flex items-center mb-6">
                  <span className="text-2xl mr-3">🕒</span>
                  <h4 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Available Slots
                  </h4>
                </div>
                
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    {selectedDate.toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>

                {paginatedSlots.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">😔</div>
                    <p className="text-gray-500 text-lg">No upcoming slots available for this date.</p>
                    <p className="text-gray-400 text-sm mt-2">Try selecting a different date.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="group border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <span className="text-lg mr-2">🕒</span>
                                <span className="text-lg font-semibold text-gray-900">
                                  {slot.start_time_ampm} - {slot.end_time_ampm}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-lg mr-2">💰</span>
                                <span className="text-2xl font-bold text-amber-600">
                                  ₹{slot.session_price}
                                </span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleBook(slot)}
                              disabled={slot.is_booked}
                              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                                slot.is_booked
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                              }`}
                            >
                              {slot.is_booked ? "Already Booked" : "Book Now"}
                            </button>
                          </div>
                        </div>
                      ))}
                      </div>


                      {/* Stripe card */}
                      <div className="mt-6 border rounded-md p-4">
                        <h3 className="text-lg font-bold mb-2">Enter your card details</h3>
                        <CardElement className="p-2 border rounded-md" />
                      </div>


                      {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-8">
                        <div className="flex gap-2">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                            <button
                              key={pg}
                              onClick={() => setCurrentPage(pg)}
                              className={`w-10 h-10 rounded-full font-semibold transition-all duration-200 ${
                                pg === currentPage
                                  ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              {pg}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-gray-500 text-lg">Please select a date to view available time slots.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .calendar-container .react-calendar {
          width: 100%;
          background: white;
          border: none;
          font-family: inherit;
        }
        
        .calendar-container .react-calendar__tile {
          position: relative;
          padding: 0.75rem 0.5rem;
          background: none;
          text-align: center;
          line-height: 16px;
          font-size: 0.875rem;
          border-radius: 0.5rem;
          margin: 2px;
        }
        
        .calendar-container .react-calendar__tile:enabled:hover,
        .calendar-container .react-calendar__tile:enabled:focus {
          background-color: #e6fffa;
        }
        
        .calendar-container .react-calendar__tile--active {
          background: linear-gradient(135deg, #0f766e, #059669) !important;
          color: white;
        }
        
        @media (max-width: 640px) {
          .calendar-container .react-calendar__tile {
            padding: 0.5rem 0.25rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BookMentorSession;