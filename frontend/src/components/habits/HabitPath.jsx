import { useEffect, useState } from "react";
import api from "../../api/habitService";
import MountainsAndTrees from "./MountainsAndTrees";
import { useParams } from "react-router-dom";

function HabitPath() {
  const [progress, setProgress] = useState([]);
  const { habitId } = useParams();

  useEffect(() => {
    fetchProgress();
  }, [habitId]);

  const fetchProgress = async () => {
    try {
      const res = await api.getHabitProgress(habitId);
      setProgress(res.data);
    } catch (err) {
      console.error(err);
    }
  };


  const toggleDayCompletion = async (dayNumber, isCurrentlyCompleted) => {
    try {
      if (isCurrentlyCompleted) {
        await api.unmarkDayComplete(habitId, dayNumber)
      } else {
        await api.markDayComplete(habitId, dayNumber)
      }
      fetchProgress();
    } catch (err) {
      console.error('Failed to toggle completion:', err)
    }
  }

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-emerald-50 overflow-hidden">
      <MountainsAndTrees />
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-semibold text-gray-800">Your Journey</h2>
            <div className="text-sm text-gray-600">
              {progress.filter(day => day.is_completed).length} / {progress.length} days
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-24 left-0 w-full h-full p-8">
        <div className="relative max-w-4xl mx-auto">
          <div className="grid grid-cols-7 gap-6 md:gap-8">
            {progress.map((day, index) => {
              const isCompleted = day.is_completed;
              const isToday = !isCompleted && index === progress.findIndex(d => !d.is_completed);
              return (
                <div key={day.day_number} className="relative flex flex-col items-center">
                  {index > 0 && (
                    <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 w-16 h-1 rounded-full ${progress[index - 1].is_completed ? 'bg-green-300' : 'bg-gray-200'
                      }`}></div>
                  )}
                  <button
                    onClick={() => toggleDayCompletion(day.day_number, day.is_completed)}

                    className={`
                      relative w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold
                      transition-all duration-300 transform hover:scale-105
                      ${isCompleted
                        ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg shadow-green-200 border-2 border-green-300'
                        : isToday
                          ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-200 border-2 border-blue-300 animate-pulse'
                          : 'bg-white text-gray-600 shadow-md border-2 border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {isCompleted ? '✓' : day.day_number}
                    {isCompleted && (
                      <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-ping"></div>
                    )}
                  </button>
                  <div className={`mt-2 text-xs font-medium ${isCompleted ? 'text-green-600' : isToday ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                    Day {day.day_number}
                  </div>
                  {day.day_number % 7 === 0 && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                        Week {Math.ceil(day.day_number / 7)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {progress.filter(day => day.is_completed).length}
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {progress.length - progress.filter(day => day.is_completed).length}
            </div>
            <div className="text-xs text-gray-600">Remaining</div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20 max-w-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            🎯
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">Keep Going!</div>
            <div className="text-xs text-gray-600">
              {progress.filter(day => day.is_completed).length > 0
                ? `${Math.round((progress.filter(day => day.is_completed).length / progress.length) * 100)}% complete`
                : 'Start your journey today'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HabitPath;
