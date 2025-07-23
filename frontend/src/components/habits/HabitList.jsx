import { useEffect, useState } from "react";
import api from "../../api/habitService";
import { Link } from "react-router-dom";
import EditHabitModal from "../../components/habits/EditHabitModal";


function HabitList({ onHabitRemoved }) {
  const [habits, setHabits] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [editingHabit, setEditingHabit] = useState(null);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(1);

  useEffect(() => {
    fetchHabits();
    fetchCompletedHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const res = await api.getHabits(`?page=${page}`);
      console.log(res.data);  
      setHabits(res.data.results || []);
      setCount(Math.ceil(res.data.count / 10));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompletedHabits = async () => {
    try {
      const res = await api.getCompletedHabits();
      console.log("Completed habits: ", res);
      const ids = res.data.map(h => h.id);
      console.log("Completed ids: ", ids)
      setCompletedIds(ids);

    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveHabit = async (habitId) => {
    try {
      await api.deleteHabit(habitId);
      fetchHabits();
      if (onHabitRemoved) onHabitRemoved();
    } catch (err) {
      console.error(err);
    }
  };

  const handleHabitUpdated = () => {
    fetchHabits();
    if (onHabitRemoved) onHabitRemoved();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Habits</h1>
      <ul className="space-y-2">
        {habits.map((habit) => {
          const isCompleted = completedIds.includes(habit.id);
          return (
            <li
              key={habit.id}
              className={`border p-4 rounded-lg flex justify-between items-center ${
                isCompleted ? "bg-green-100 border-green-400" : ""
              }`}
            >
              <Link to={`/learner/habit/${habit.id}`} className="font-semibold text-blue-600">
                {habit.title} ({habit.total_days} days)
              </Link>
              <div className="flex items-center">
                {isCompleted && <span className="text-green-600 font-bold mr-2">✅</span>}
                <button
                  onClick={() => setEditingHabit(habit)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemoveHabit(habit.id)}
                  className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

            {/* Pagination Controls */}
      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-2 py-1 font-semibold">Page {page} of {count}</span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, count))}
          disabled={page === count}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onHabitUpdated={handleHabitUpdated}
        />
      )}
    </div>
  );
}

export default HabitList;
