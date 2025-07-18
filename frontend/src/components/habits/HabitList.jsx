import { useEffect, useState } from "react";
import api from "../../api/habitService";
import { Link } from "react-router-dom";

function HabitList({ onHabitRemoved }) {
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const res = await api.getHabits();
      console.log(res.data);
      setHabits(res.data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveHabit = async (habitId) => {
    try {
      await api.deleteHabit(habitId);
      fetchHabits();
      if (onHabitRemoved) onHabitRemoved();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Habits</h1>
      <ul className="space-y-2">
        {habits.map(habit => (
          <li key={habit.id} className="border p-4 rounded-lg flex justify-between items-center">
            <Link to={`/learner/habit/${habit.id}`} className="font-semibold text-blue-600">
              {habit.title} ({habit.total_days} days)
            </Link>
            <button
              onClick={() => handleRemoveHabit(habit.id)}
              className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HabitList;
