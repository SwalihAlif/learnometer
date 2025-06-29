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
    <div className="p-4">
      {loading ? (
        <p className="text-gray-600">Loading quiz...</p>
      ) : quizData.length === 0 ? (
        <p className="text-red-600 font-medium">⚠️ No questions added yet in this topic.</p>
      ) : (
        <>
          {quizData.map((q, i) => (
            <div key={q.question_id} className="mb-6">
              <p className="font-semibold">{i + 1}. {q.question}</p>
              <div className="ml-4">
                {q.options.map((opt, j) => (
                  <label key={j} className="block">
                    <input
                      type="radio"
                      name={`q-${q.question_id}`}
                      onChange={() => handleOptionSelect(q.question_id, opt.text)}
                    />{" "}
                    {opt.text}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Submit Quiz
          </button>

          {score !== null && (
            <div className="mt-4 font-bold text-green-600">
              Your Score: {score} / {quizData.length}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Quiz;
