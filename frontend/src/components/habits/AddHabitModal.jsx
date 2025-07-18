import { useState } from "react";
import api from "../../api/habitService";

function AddHabitModal({ onClose, onHabitAdded }) {
  const [title, setTitle] = useState("");
  const [totalDays, setTotalDays] = useState(21);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createHabit({ title, total_days: totalDays });
      onHabitAdded();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h2 className="text-xl font-bold mb-4">Add New Habit</h2>
        <input
          type="text"
          placeholder="Habit Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border p-2 mb-3 w-full rounded"
        />
        <input
          type="number"
          value={totalDays}
          onChange={(e) => setTotalDays(Number(e.target.value))}
          className="border p-2 mb-3 w-full rounded"
          min="1"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">Save</button>
        <button onClick={onClose} className="mt-2 text-sm text-gray-600 w-full">Cancel</button>
      </form>
    </div>
  );
}

export default AddHabitModal;