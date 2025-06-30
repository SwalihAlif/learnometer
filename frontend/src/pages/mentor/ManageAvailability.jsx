import React, { useEffect, useState } from 'react';
import {
    getMentorSlots,
    createMentorSlot,
    deleteMentorSlot
} from '../../api/mentorshipAPI';
import { format, addDays, parse } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const ManageAvailability = () => {
    const [allSlots, setAllSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ start_time: '', end_time: '', session_price: '', duration: 30 });

    const fetchSlots = async () => {
        try {
            const res = await getMentorSlots();
            setAllSlots(res.data.results || []); // ensure it's an array
            console.log("Fetched slots:", res.data);
        } catch (error) {
            console.error("Failed to fetch slots", error);
            setAllSlots([]);  // fallback to empty array on error
        }
    };

    useEffect(() => {
        fetchSlots();
    }, []);

  const formatTo12Hour = (timeStr) => {
  try {
    const [hours, minutes, seconds] = timeStr.split(":");
    const dateObj = new Date();
    dateObj.setHours(parseInt(hours));
    dateObj.setMinutes(parseInt(minutes));
    dateObj.setSeconds(seconds ? parseInt(seconds) : 0);
    return format(dateObj, "hh:mm a");
  } catch (e) {
    console.error("Invalid time format:", timeStr);
    return "Invalid Time";
  }
};

    const handleCreate = async () => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        try {
            await createMentorSlot({ ...form, date: dateStr });
            fetchSlots();
            setShowModal(false);
            setForm({ start_time: '', end_time: '', session_price: '', duration: 30 });
        } catch (err) {
            alert("Error creating slot");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteMentorSlot(id);
            fetchSlots();
        } catch (err) {
            alert("Error deleting slot");
        }
    };

    const getTileClassName = ({ date }) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const slots = allSlots.filter(slot => slot.date === dateStr);
        if (slots.length === 0) return 'bg-[#ECFDF5] text-gray-400';
        const booked = slots.filter(slot => slot.is_booked);
        if (booked.length === slots.length) return 'bg-[#F59E0B] text-white';
        return 'bg-[#0F766E] text-white';
    };

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const slotsForDate = allSlots.filter(slot => slot.date === selectedDateStr);

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4 text-[#0F766E]">📅 Manage Availability</h2>

            <div className="mb-4">
                <Calendar
                    onChange={setSelectedDate}
                    value={selectedDate}
                    tileClassName={getTileClassName}
                />
            </div>

            <button
                onClick={() => setShowModal(true)}
                className="bg-[#0F766E] text-white px-4 py-2 rounded hover:bg-[#064E3B]"
            >
                + Add Slot
            </button>

            <h3 className="mt-6 text-lg font-semibold text-[#0F766E]">Slots for {selectedDateStr}</h3>
            <ul className="mt-2 list-disc ml-6">
                {slotsForDate.length > 0 ? slotsForDate.map(slot => (
                    <li key={slot.id} className="mb-1">
                        {formatTo12Hour(slot.start_time)} - {formatTo12Hour(slot.end_time)} | ₹{slot.session_price}
                        <span className="ml-2 text-sm text-gray-500">{slot.is_booked ? "Booked" : "Free"}</span>
                        {!slot.is_booked && (
                            <button onClick={() => handleDelete(slot.id)} className="ml-3 text-red-500 hover:underline">Delete</button>
                        )}
                    </li>
                )) : <li className="text-gray-500">No slots yet.</li>}
            </ul>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4 text-[#0F766E]">Create Slot - {selectedDateStr}</h3>
                        <div className="space-y-3">
                            <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full border p-2 rounded" />
                            <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full border p-2 rounded" />
                            <input type="number" placeholder="Session Price (₹)" value={form.session_price} onChange={e => setForm({ ...form, session_price: e.target.value })} className="w-full border p-2 rounded" />
                            <input type="number" placeholder="Duration (minutes)" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="w-full border p-2 rounded" />
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded border border-gray-400">Cancel</button>
                            <button onClick={handleCreate} className="px-4 py-2 rounded bg-[#0F766E] text-white hover:bg-[#064E3B]">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAvailability;

