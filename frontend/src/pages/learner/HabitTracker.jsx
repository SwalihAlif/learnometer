// src/pages/learner/HabitTracker.jsx
import { useState, useEffect } from "react";
import HabitList from "../../components/habits/HabitList";
import AddHabitModal from "../../components/habits/AddHabitModal";
import api from "../../api/habitService";

function HabitTracker() {
    const [showModal, setShowModal] = useState(false); 
    const [refresh, setRefresh] = useState(false);
    const [habitCount, setHabitCount] = useState(0);

    useEffect(() => {
        fetchHabitCount();
    }, [refresh]);

    const fetchHabitCount = async () => {
        try {
            const res = await api.getHabits();
            setHabitCount(res.data.results.length);
        } catch (err) {
            console.error(err);
        }
    };

    const handleHabitAdded = () => {
        setRefresh(!refresh);
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#1E1B4B]">Habit Tracker</h1>
                    <p className="text-[#4F46E5] mt-1 font-medium">
                        "Small consistent steps create big changes."
                    </p>
                </div>
                <button
                    onClick={() => habitCount < 5 && setShowModal(true)}
                    disabled={habitCount >= 5}
                    className={`px-5 py-2 rounded-xl font-semibold shadow-md transition-transform duration-300 ${habitCount >= 5
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-[#FACC15] text-[#1E1B4B] hover:scale-105"
                        }`}
                >
                    {habitCount >= 5 ? "Limit Reached" : "+ Add Habit"}
                </button>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
                <HabitList key={refresh} onHabitRemoved={handleHabitAdded} />
            </div>

            {showModal && (
                <AddHabitModal
                    onClose={() => setShowModal(false)}
                    onHabitAdded={handleHabitAdded}
                />
            )}

        </div>
    );
}

export default HabitTracker;

