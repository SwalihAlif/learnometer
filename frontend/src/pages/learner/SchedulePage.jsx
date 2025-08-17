import { useEffect, useState } from 'react';
import axiosInstance from '../../axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const LearningSchedulePage = () => {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);

  // Helper to group schedule items by date
  const groupByDate = (scheduleArr) => {
    const grouped = {};
    scheduleArr.forEach(item => {
      if (!grouped[item.date]) grouped[item.date] = [];
      grouped[item.date].push({
        title: `${item.course} - ${item.main_topic}`,
        start: item.start_time,
        end: item.end_time,
        ...item, // in case you want more props
      });
    });
    return grouped;
  };

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("topics/schedule/");
      // res.data.schedule is the array
      const grouped = groupByDate(res.data.schedule || []);
      setSchedule(grouped);
    } catch (err) {
      console.error("Failed to fetch schedule:", err);
      setSchedule({});
    }
    setLoading(false);
  };

  // const generateSchedule = async () => {
  //   setLoading(true);
  //   try {
  //     const res = await axiosInstance.post('topics/generate-schedule/');
  //     await fetchSchedule();
  //     // convert flat list to grouped
  //     const grouped = {};
  //     res.data.forEach(item => {
  //       const date = item.date;
  //       if (!grouped[date]) grouped[date] = [];
  //       grouped[date].push({
  //         title: item.topic_title || item.title,
  //         start: item.start_time?.slice(0, 5),
  //         end: item.end_time?.slice(0, 5),
  //       });
  //     });
  //     setSchedule(grouped);
  //   } catch (err) {
  //     console.error('Error generating schedule:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const generateSchedule = async () => {
  setLoading(true);
  try {
    await axiosInstance.post('topics/generate-schedule/');
    await fetchSchedule(); // this will update the state with latest from backend
  } catch (err) {
    console.error('Error generating schedule:', err);
  } finally {
    setLoading(false);
  }
};

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Learning Schedule', 14, 20);

    let y = 30;
    Object.entries(schedule).forEach(([date, entries]) => {
      doc.text(`${date}`, 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [['Topic', 'Start', 'End']],
        body: entries.map(item => [item.title, item.start, item.end]),
        theme: 'grid',
        margin: { left: 14, right: 14 },
      });

      y = doc.lastAutoTable.finalY + 10;
    });

    doc.save('schedule.pdf');
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

return (
  <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-2xl mt-10">
    <h1 className="text-2xl font-extrabold text-indigo-700 mb-6 text-center">
      📅 Your Learning Schedule
    </h1>

    <div className="flex flex-wrap gap-4 justify-center mb-6">
      <button
        onClick={generateSchedule}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl shadow transition"
      >
        🚀 Generate Schedule
      </button>
      <button
        onClick={downloadPDF}
        className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-xl shadow transition"
      >
        📄 Download PDF
      </button>
    </div>

    {loading && (
      <div className="text-center text-gray-600 font-medium mb-4 animate-pulse">
        Generating your schedule...
      </div>
    )}

    <div className="space-y-6">
      {Object.keys(schedule).length === 0 ? (
        <div className="text-center text-gray-500 text-sm">
          ⏳ No schedule yet. Click “Generate Schedule” to get started.
        </div>
      ) : (
        Object.entries(schedule).map(([date, entries]) => (
          <div key={date} className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-bold text-indigo-600 mb-2">
              📆 {date}
            </h2>
            <ul className="divide-y divide-gray-200">
              {entries.map((item, idx) => (
                <li key={idx} className="py-2 flex items-center justify-between text-sm text-gray-700">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-gray-500">{item.start} - {item.end}</span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  </div>
);

};

export default LearningSchedulePage;

