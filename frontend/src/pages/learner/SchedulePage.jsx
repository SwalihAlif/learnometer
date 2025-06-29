import { useEffect, useState } from 'react';

import axiosInstance from '../../axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Calendar, Download, RefreshCw, Clock, BookOpen } from 'lucide-react';

const LearningSchedulePage = () => {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);

  const normalizeSchedule = (rawSchedule) => {
    const normalized = {};
    for (const [date, items] of Object.entries(rawSchedule || {})) {
      normalized[date] = Array.isArray(items) ? items : [items];
    }
    return normalized;
  };

  const fetchSchedule = async () => {
    try {
      const res = await axiosInstance.get('topics/schedule/');
      setSchedule(normalizeSchedule(res.data));
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
    }
  };

  const generateSchedule = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('topics/generate-schedule/');
      setSchedule(normalizeSchedule(res.data));
    } catch (err) {
      console.error('Error generating schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor('#4F46E5');
    doc.text('Your Schedule for Learning', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor('#1E1B4B');
    doc.text('“Consistent progress is better than delayed perfection.”', 14, 28);

    let y = 40;

    Object.entries(schedule).forEach(([date, entries]) => {
      doc.setTextColor('#4F46E5');
      doc.setFontSize(14);
      doc.text(`${date}`, 14, y);
      y += 4;

      autoTable(doc, {
        startY: y + 2,
        head: [['Topic', 'Start Time', 'End Time']],
        body: entries.map((item) => [item.title, item.start, item.end]),
        theme: 'striped',
        styles: {
          head: { fillColor: [250, 204, 21] }, // #FACC15
          alternateRow: { fillColor: [249, 250, 251] }, // #F9FAFB
          textColor: '#1E1B4B',
          fontSize: 10,
        },
        margin: { left: 14, right: 14 },
      });

      y = doc.lastAutoTable.finalY + 10;
    });

    doc.save('learning_schedule.pdf');
  };

  useEffect(() => {
    fetchSchedule();
  }, );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-yellow-50 py-4 px-4 sm:py-8 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
{/* Header Section */}
<div className="bg-gradient-to-r from-[#4F46E5] to-indigo-600 text-white rounded-2xl shadow-2xl overflow-hidden mb-8">
  <div className="px-6 py-8 sm:px-8 sm:py-12">
    <div className="flex items-center justify-center gap-4 text-center">
      <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 sm:p-4 flex items-center justify-center">
        <Calendar className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">
          Your Learning Schedule
        </h1>
        <p className="text-[#FACC15] text-sm sm:text-base lg:text-lg font-medium">
          "Consistent progress is better than delayed perfection."
        </p>
      </div>
    </div>
  </div>
  <div className="h-2 bg-gradient-to-r from-[#FACC15] to-yellow-300"></div>
</div>


{Object.keys(schedule).length === 0 ? (
  <div className="text-center py-10">
    <div className="bg-white rounded-xl shadow p-6 max-w-xl mx-auto border border-gray-200">
      <div className="bg-[#F9FAFB] rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <BookOpen className="w-8 h-8 text-[#4F46E5]" />
      </div>
      <h3 className="text-lg font-semibold text-[#1E1B4B] mb-2">No Schedule Yet</h3>
      <p className="text-gray-600 text-sm">
        Ready to start your learning journey? Generate your personalized schedule below.
      </p>
    </div>
  </div>
) : (
  <div className="space-y-4 mb-6">
    {Object.keys(schedule).map((date) => (
      <div key={date}>
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          
          {/* Date Header */}
          <div className="bg-gradient-to-r from-[#4F46E5] to-indigo-600 px-4 py-3 flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-sm rounded p-1.5">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-white">{date}</h2>
          </div>

          {/* Schedule Items */}
          <div className="p-4 space-y-3">
            {schedule[date].map((item, idx) => (
              <div key={idx} className="bg-[#F9FAFB] border-l-4 border-[#FACC15] rounded-lg px-3 py-2 hover:bg-gray-50 transition">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-[#1E1B4B] hover:text-[#4F46E5]">{item.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>{item.start} - {item.end}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    ))}
  </div>
)}


        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={generateSchedule}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#4F46E5] hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Generating...' : Object.keys(schedule).length === 0 ? 'Generate Schedule' : 'Regenerate Schedule'}
          </button>

          {Object.keys(schedule).length > 0 && (
            <button
              onClick={downloadPDF}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#FACC15] hover:bg-yellow-400 text-[#1E1B4B] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          )}
        </div>

        {/* Stats Footer */}
        {Object.keys(schedule).length > 0 && (
          <div className="mt-12 bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="bg-[#F9FAFB] rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#4F46E5]" />
                </div>
                <p className="text-2xl font-bold text-[#1E1B4B]">{Object.keys(schedule).length}</p>
                <p className="text-sm text-gray-600">Learning Days</p>
              </div>
              <div className="space-y-2">
                <div className="bg-[#F9FAFB] rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#4F46E5]" />
                </div>
                <p className="text-2xl font-bold text-[#1E1B4B]">
                  {Object.values(schedule).reduce((acc, day) => acc + day.length, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Topics</p>
              </div>
              <div className="space-y-2">
                <div className="bg-[#F9FAFB] rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#4F46E5]" />
                </div>
                <p className="text-2xl font-bold text-[#1E1B4B]">
                  {Math.round(Object.values(schedule).reduce((acc, day) => acc + day.length * 1.5, 0))}h
                </p>
                <p className="text-sm text-gray-600">Estimated Time</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningSchedulePage;