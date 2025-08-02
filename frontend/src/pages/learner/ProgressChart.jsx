import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../../axios';
import Chart from 'chart.js/auto';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ProgressChart = () => {
  const chartRef = useRef();
  const pdfRef = useRef();
  const chartInstanceRef = useRef(null);
  const [reportData, setReportData] = useState([]);
  const [totals, setTotals] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    axiosInstance.get('topics/progress-report/')
      .then((res) => {
        console.log('📦 Backend Report Data:', res.data);
        setReportData(res.data);

        // Calculate total and completed subtopics
        const totalCount = res.data.reduce((acc, cur) => acc + cur.total, 0);
        const completedCount = res.data.reduce((acc, cur) => acc + cur.completed, 0);
        setTotals({ total: totalCount, completed: completedCount });

        renderChart(res.data);
      })
      .catch((err) => {
        console.error('❌ Error fetching report:', err);
      });
  }, []);

  const renderChart = (data) => {
    if (chartRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy(); // Destroy existing chart before creating a new one
      }

      chartInstanceRef.current = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: data.map((r) => r.course_title),
          datasets: [
            {
              label: 'Progress (%)',
              data: data.map((r) => r.score),
              backgroundColor: '#4F46E5',
              borderRadius: 5
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Course Completion (%)',
              font: {
                size: 18
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { stepSize: 10 }
            }
          }
        }
      });
    }
  };

const downloadPDF = () => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.text('📈 Course Progress Report', 14, 20);

  // Summary
  doc.setFontSize(12);
  doc.text(`Total Subtopics: ${totals.total}`, 14, 30);
  doc.text(`Completed Subtopics: ${totals.completed}`, 14, 36);
  doc.text(`Overall Completion Rate: ${totals.total ? ((totals.completed / totals.total) * 100).toFixed(1) : 0}%`, 14, 42);

  // Table
  const tableData = reportData.map(r => [
    r.course_title,
    r.completed,
    r.total,
    `${r.score}%`
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['Course', 'Completed', 'Total', 'Score']],
    body: tableData,
    theme: 'striped',
  });

  doc.save('progress_report.pdf');
};

  return (
    <div ref={pdfRef} className="bg-white p-6 rounded shadow max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-[#0D1117]">📈 Course Progress Report</h2>

      {/* Overall Summary */}
      <div className="mb-6 text-gray-700 text-lg">
        <p><strong>Total Subtopics:</strong> {totals.total}</p>
        <p><strong>Completed Subtopics:</strong> {totals.completed}</p>
        <p><strong>Overall Completion Rate:</strong> {totals.total ? ((totals.completed / totals.total) * 100).toFixed(1) : 0}%</p>
      </div>

      {/* Chart */}
      <canvas ref={chartRef} />

      {/* List Summary */}
      <ul className="mt-6 text-gray-700">
        {reportData.map((r, i) => (
          <li key={i} className="mb-2">
            <strong>{r.course_title}:</strong> {r.completed} / {r.total} completed ({r.score}%)
          </li>
        ))}
      </ul>

      {/* Download Button */}
      <button
        onClick={downloadPDF}
        className="mt-6 px-4 py-2 bg-[#FACC15] text-[#0D1117] rounded hover:bg-yellow-400"
      >
        📄 Download PDF
      </button>
    </div>
  );
};

export default ProgressChart;
