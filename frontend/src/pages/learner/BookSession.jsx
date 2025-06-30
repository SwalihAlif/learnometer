import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const BookMentorSession = () => {
    const { mentorId } = useParams();
    const [mentor, setMentor] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [slots, setSlots] = useState([]);

    const fetchMentor = async () => {
        try {
            const res = await axiosInstance.get(`users/profile/${mentorId}/`);
            setMentor(res.data);
        } catch (error) {
            console.error("Failed to fetch mentor:", error);
        }
    };

    const fetchAvailability = async () => {
        if (!mentorId || mentorId === "undefined") return;
        try {
            const res = await axiosInstance.get(`mentorship/availability/?mentor=${mentorId}`);
            setAvailability(res.data?.results || res.data);
        } catch (error) {
            console.error("Failed to fetch availability:", error);
        }
    };

    const fetchSlotsForDate = async (date) => {
        if (!mentorId || mentorId === "undefined" || !date) return;
        const isoDate = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
        try {
            const res = await axiosInstance.get(`mentorship/availability/?mentor=${mentorId}&date=${isoDate}`);
            setSlots(res.data?.results || res.data);
        } catch (error) {
            console.error("Failed to fetch slots:", error);
        }
    };

    useEffect(() => {
        if (mentorId && mentorId !== "undefined") {
            fetchMentor();
            fetchAvailability();
        }
    }, [mentorId]);

    const availableDates = availability.map((slot) => slot.date);

    const tileClassName = ({ date }) => {
        const iso = date.toLocaleDateString('en-CA');
        if (availableDates.includes(iso)) return "bg-green-200";
        if (date < new Date()) return "line-through bg-gray-100";
        return "bg-red-100 line-through";
    };

    const handleBook = async (slot) => {
        try {
            const payload = {
                mentor: mentor.user_id, // adjust if needed
                date: slot.date,
                start_time: slot.start_time,
                end_time: slot.end_time,
            };
            const res = await axiosInstance.post("mentorship/session-bookings/", payload);
            console.log("Booking success", res.data);
            alert("Session booked successfully!");
        } catch (err) {
            console.error("Booking failed", err);
            alert("Booking failed. Check console for errors.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            {mentor && (
                <div className="mb-6 bg-[#ECFDF5] border border-[#0F766E] p-4 rounded shadow">
                    <h2 className="text-2xl font-bold text-[#0F766E] mb-1">{mentor.full_name}</h2>
                    <p className="text-gray-700">{mentor.bio}</p>
                    <p><strong>Experience:</strong> {mentor.experience_years} years</p>
                    <p><strong>Languages:</strong> {mentor.languages_known?.join(", ")}</p>
                    <p><strong>Categories:</strong> {mentor.preferred_categories?.join(", ")}</p>
                    <p><strong>Sessions Completed:</strong> {mentor.session_count}</p>
                    <p><strong>Average Rating:</strong> ⭐ {mentor.avg_rating || "N/A"}</p>
                </div>
            )}

            <h3 className="text-xl font-semibold mb-2">Select a Date</h3>
            <Calendar
                onChange={(date) => {
                    setSelectedDate(date);
                    fetchSlotsForDate(date);
                }}
                tileClassName={tileClassName}
                minDate={new Date()}
                maxDate={new Date(new Date().setDate(new Date().getDate() + 30))}
            />

            {selectedDate && (
                <div className="mt-6">
                    <h4 className="text-lg font-bold mb-2">
                        Slots for {selectedDate.toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </h4>
                    <ul className="mt-2 space-y-2">
                        {slots.length === 0 ? (
                            <p className="text-gray-600">No slots available.</p>
                        ) : (
                            slots.map((slot) => (
                                <li
                                    key={slot.id}
                                    className="border border-[#F59E0B] bg-[#FFF7ED] p-3 rounded flex justify-between items-center"
                                >
                                    🕒 {slot.start_time_ampm} - {slot.end_time_ampm} | ₹{slot.session_price}
                                    <button
                                        onClick={() => handleBook(slot)}
                                        disabled={slot.is_booked}
                                        className={`ml-4 px-3 py-1 rounded text-white ${slot.is_booked
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-[#0F766E] hover:bg-[#064E3B]"
                                            }`}
                                    >
                                        {slot.is_booked ? "Booked" : "Book"}
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BookMentorSession;

