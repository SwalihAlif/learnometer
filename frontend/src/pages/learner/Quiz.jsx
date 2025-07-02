import axiosInstance from "../../axios";
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const Quiz = () => {
  const [quizData, setQuizData] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true); // optional loading state
  const { mainTopicId } = useParams();

  useEffect(() => {
    setLoading(true);
    axiosInstance.get(`topics/quiz/generate/${mainTopicId}/`)
      .then(res => {
        setQuizData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading quiz data:", err);
        setLoading(false);
      });
  }, [mainTopicId]);

  const handleOptionSelect = (qId, optionText) => {
    setAnswers({ ...answers, [qId]: optionText });
  };

  const handleSubmit = () => {
    let correctCount = 0;
    quizData.forEach((q) => {
      const selected = answers[q.question_id];
      const correctOption = q.options.find(opt => opt.is_correct);
      if (selected === correctOption.text) correctCount++;
    });
    setScore(correctCount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Quiz Time!</h1>
          <p className="text-gray-600">Test your knowledge and see how well you've learned</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your quiz...</p>
            </div>
          </div>
        ) : quizData.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Questions Available</h3>
            <p className="text-red-600 font-medium">No questions have been added to this topic yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quiz Questions */}
            {quizData.map((q, i) => (
              <div key={q.question_id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <h3 className="text-white font-semibold text-lg">
                    Question {i + 1} of {quizData.length}
                  </h3>
                </div>
                
                <div className="p-6">
                  <p className="text-xl font-medium text-gray-800 mb-6 leading-relaxed">
                    {q.question}
                  </p>
                  
                  <div className="space-y-3">
                    {q.options.map((opt, j) => (
                      <label 
                        key={j} 
                        className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name={`q-${q.question_id}`}
                          onChange={() => handleOptionSelect(q.question_id, opt.text)}
                          className="w-5 h-5 text-indigo-600 border-2 border-gray-300 focus:ring-indigo-500 focus:ring-2"
                        />
                        <span className="ml-4 text-gray-700 font-medium group-hover:text-indigo-700 transition-colors">
                          {opt.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Submit Button */}
            <div className="text-center pt-4">
              <button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg"
              >
                Submit Quiz
              </button>
            </div>

            {/* Score Display */}
            {score !== null && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mt-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎉</span>
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-2">Quiz Complete!</h3>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {score} / {quizData.length}
                </div>
                <p className="text-green-700 font-medium">
                  {score === quizData.length ? "Perfect score! Excellent work!" :
                   score >= quizData.length * 0.8 ? "Great job! You're doing well!" :
                   score >= quizData.length * 0.6 ? "Good effort! Keep learning!" :
                   "Keep practicing! You'll improve with time!"}
                </p>
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(score / quizData.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;
