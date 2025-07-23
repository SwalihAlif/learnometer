import axiosInstance from "../axios";

const getHabits = () => axiosInstance.get("habits/list-create/");
const createHabit = (data) => axiosInstance.post("habits/list-create/", data);
const getHabitProgress = (habitId) => axiosInstance.get(`habits/list/${habitId}/progress/`);
const markDayComplete = (habitId, dayNumber) => axiosInstance.patch(`habits/complete/${habitId}/progress/${dayNumber}/`, { is_completed: true });
const updateHabit = (habitId, data) => axiosInstance.patch(`habits/list-create/${habitId}/`, data);
const deleteHabit = (habitId) => axiosInstance.delete(`habits/list-create/${habitId}/`);
const getCompletedHabits = () => axiosInstance.get("habits/completed/")




  export default {
  getHabits,
  createHabit,
  getHabitProgress,
  markDayComplete,
  updateHabit,
  deleteHabit,
  getCompletedHabits,
};

    // path('list-create/', HabitListCreateView.as_view(), name='habit-list-create'),
    // path('list/<int:habit_id>/progress/', HabitProgressListView.as_view(), name='habit-progress'),
    // path('complete/<int:habit_id>/progress/<int:day_number>/', MarkHabitDayCompleteView.as_view(), name='habit-day-complete'),