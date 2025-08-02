import { useEffect, useState } from 'react';
import axiosInstance from '../../axios';

const AdminHabitDashboard = () => {
  const [habits, setHabits] = useState([]);
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState({ total_pages: 1, has_next: false, has_previous: false });

  useEffect(() => {
    axiosInstance.get(`adminpanel/admin/habit-report/?page=${page}`)
      .then((res) => {
        setHabits(res.data.results);
        console.log("Habit data: ", res.data)
        setPageInfo({
          total_pages: res.data.total_pages,
          has_next: res.data.has_next,
          has_previous: res.data.has_previous,
        });
      })
      .catch((err) => console.error('Error:', err));
  }, [page]);

  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setPage((prev) => (pageInfo.has_next ? prev + 1 : prev));

  return (
    <div className="bg-[#0D1117] text-white min-h-screen py-10 px-6">
      <h1 className="text-3xl font-bold text-[#FACC15] mb-8">🧠 Admin Habit Tracker</h1>

      {habits.length === 0 ? (
        <p className="text-gray-400">No habits available.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border border-[#30363D]">
              <thead className="bg-[#21262D] text-[#FACC15] text-left">
                <tr>
                  <th className="py-3 px-4">Learner</th>
                  <th className="py-3 px-4">Habit</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Completed Days</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {habits.map((habit, i) => (
                  <tr key={i} className="border-t border-[#30363D] hover:bg-[#161B22]">
                    <td className="py-3 px-4">{habit.learner}</td>
                    <td className="py-3 px-4">{habit.habit}</td>
                    <td className="py-3 px-4">{habit.days}</td>
                    <td className="py-3 px-4">{habit.completed_days}</td>
                    <td className={`py-3 px-4 font-semibold ${habit.status === 'Completed' ? 'text-green-400' : 'text-red-400'}`}>
                      {habit.status === 'Completed' ? '✅ Completed' : '❌ Not Completed'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 🔄 Pagination Controls */}
          <div className="flex justify-between items-center mt-6">
            <button onClick={handlePrev} disabled={!pageInfo.has_previous} className="bg-[#21262D] text-white px-4 py-2 rounded disabled:opacity-50">◀ Prev</button>
            <span className="text-[#FACC15] font-medium">Page {page} of {pageInfo.total_pages}</span>
            <button onClick={handleNext} disabled={!pageInfo.has_next} className="bg-[#21262D] text-white px-4 py-2 rounded disabled:opacity-50">Next ▶</button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminHabitDashboard;
