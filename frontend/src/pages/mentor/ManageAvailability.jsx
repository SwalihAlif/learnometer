import React, { useEffect, useState } from 'react';
import {
  getMentorSlots,
  createMentorSlot,
  deleteMentorSlot,
} from '../../api/mentorshipAPI';
import { format, isToday, isBefore, parse } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { showDialog } from '../../redux/slices/confirmDialogSlice';

const ManageAvailability = () => {
  const [allSlots, setAllSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    start_time: '',
    end_time: '',
    session_price: '',
    duration: 30,
  });

  const dispatch = useDispatch();

  const fetchSlots = async () => {
    try {
      const res = await getMentorSlots();
      setAllSlots(res.data.results || []);
    } catch (error) {
      console.error("Fetch failed", error);
      setAllSlots([]);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const formatTo12Hour = (timeStr) => {
    try {
      const [h, m] = timeStr.split(":");
      const d = new Date();
      d.setHours(parseInt(h));
      d.setMinutes(parseInt(m));
      return format(d, "hh:mm a");
    } catch {
      return "Invalid Time";
    }
  };

  const handleCreate = async () => {
    const now = new Date();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const start = new Date(`${dateStr}T${form.start_time}`);
    const end = new Date(`${dateStr}T${form.end_time}`);

    if (isBefore(start, now)) {
      toast.error("Start time must be in the future.");
      return;
    }

    if (isBefore(end, start)) {
      toast.error("End time must be after start time.");
      return;
    }

    try {
      await createMentorSlot({ ...form, date: dateStr });
      toast.success("Slot created.");
      fetchSlots();
      setShowModal(false);
      setForm({ start_time: '', end_time: '', session_price: '', duration: 30 });
    } catch (err) {
      toast.error("Error creating slot.");
    }
  };

  const handleDelete = (id) => {
    dispatch(showDialog({
      title: 'Delete Slot',
      message: 'Are you sure you want to delete this slot?',
      onConfirm: async () => {
        try {
          await deleteMentorSlot(id);
          toast.success("Slot deleted.");
          fetchSlots();
        } catch {
          toast.error("Error deleting slot.");
        }
      }
    }));
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
    <div className="min-h-screen bg-gradient-to-br from-[#ECFDF5] via-green-50 to-teal-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-[#0F766E] mb-2 flex items-center justify-center gap-3">
            <span className="text-4xl">📅</span>
            Manage Your Availability
          </h2>
          <p className="text-gray-600 text-lg">Schedule your mentoring sessions and manage your time slots</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calendar Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-green-100">
            <h3 className="text-2xl font-semibold text-[#0F766E] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#0F766E] rounded-full"></span>
              Select Date
            </h3>
            
            <div className="calendar-wrapper bg-gray-50 p-4 rounded-xl">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                minDate={new Date()}
                tileClassName={getTileClassName}
                className="custom-calendar w-full"
              />
            </div>

            {/* Legend */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#ECFDF5] border-2 border-gray-300 rounded"></div>
                <span className="text-gray-600">No slots</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#0F766E] rounded"></div>
                <span className="text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#F59E0B] rounded"></div>
                <span className="text-gray-600">Fully booked</span>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="w-full mt-6 bg-gradient-to-r from-[#0F766E] to-[#064E3B] text-white px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold text-lg flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span>
              Add New Time Slot
            </button>
          </div>

          {/* Slots Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-green-100">
            <h3 className="text-2xl font-semibold text-[#0F766E] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#0F766E] rounded-full"></span>
              Slots for {format(selectedDate, 'MMM dd, yyyy')}
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {slotsForDate.length > 0 ? slotsForDate.map(slot => (
                <div key={slot.id} className="bg-gradient-to-r from-gray-50 to-green-50 border border-green-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-semibold text-gray-800">
                          {formatTo12Hour(slot.start_time)} - {formatTo12Hour(slot.end_time)}
                        </span>
                        <span className="bg-[#0F766E] text-white px-3 py-1 rounded-full text-sm font-medium">
                          ₹{slot.session_price}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          slot.is_booked 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                          {slot.is_booked ? "🔒 Booked" : "✅ Available"}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {slot.duration} min
                        </span>
                      </div>
                    </div>
                    
                    {!slot.is_booked && (
                      <button 
                        onClick={() => handleDelete(slot.id)} 
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg border border-red-200 hover:border-red-300 transition-all duration-200 font-medium"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-gray-400">📅</span>
                  </div>
                  <p className="text-gray-500 text-lg">No slots scheduled for this date</p>
                  <p className="text-gray-400 text-sm mt-1">Click "Add New Time Slot" to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#0F766E] to-[#064E3B] text-white p-6 rounded-t-2xl">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <span className="text-2xl">⏰</span>
                  Create Time Slot
                </h3>
                <p className="text-green-100 mt-1">
                  {format(selectedDate, 'EEEE, MMM dd, yyyy')}
                </p>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                    <input 
                      type="time" 
                      value={form.start_time} 
                      onChange={e => setForm({ ...form, start_time: e.target.value })} 
                      className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E] focus:ring-opacity-20 transition-all duration-200" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                    <input 
                      type="time" 
                      value={form.end_time} 
                      onChange={e => setForm({ ...form, end_time: e.target.value })} 
                      className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E] focus:ring-opacity-20 transition-all duration-200" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Session Price (₹)</label>
                  <input 
                    type="number" 
                    placeholder="Enter amount in ₹" 
                    value={form.session_price} 
                    onChange={e => setForm({ ...form, session_price: e.target.value })} 
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E] focus:ring-opacity-20 transition-all duration-200" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes)</label>
                  <input 
                    type="number" 
                    placeholder="Session duration" 
                    value={form.duration} 
                    onChange={e => setForm({ ...form, duration: e.target.value })} 
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E] focus:ring-opacity-20 transition-all duration-200" 
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate} 
                  className="px-6 py-3 bg-gradient-to-r from-[#0F766E] to-[#064E3B] text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold"
                >
                  Create Slot
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAvailability;