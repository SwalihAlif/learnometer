import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { showDialog } from '../../redux/slices/confirmDialogSlice';
import {
  getQuestionsByTopic,
  postQuestion,
  updateQuestion,
  deleteQuestion,
  generateAiAnswer,
  postAnswer,
  updateAnswer,
  deleteAnswer,
} from '../../api/notesApi';

const NotesPage = () => {
  const { topicId } = useParams();
  const dispatch = useDispatch();

  const [questions, setQuestions] = useState([]);
  const [newQ, setNewQ] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [aiText, setAiText] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    getQuestionsByTopic(topicId).then((res) => setQuestions(res.results));
  }, [topicId]);

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!newQ.trim()) return;
    const newQuestion = await postQuestion(topicId, { question_text: newQ });
    setQuestions((prev) => [newQuestion, ...prev]);
    setNewQ('');
  };

  const handleDeleteQuestion = (id) => {
    dispatch(
      showDialog({
        message: 'Are you sure you want to delete this question?',
        onConfirm: async () => {
          await deleteQuestion(id);
          setQuestions((prev) => prev.filter((q) => q.id !== id));
        },
      })
    );
  };

  const handleEditQuestion = (q) => {
    setEditingQuestionId(q.id);
    setEditingText(q.question_text);
  };

  const handleUpdateQuestion = async (id) => {
    const updated = await updateQuestion(id, editingText);
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question_text: updated.question_text } : q))
    );
    setEditingQuestionId(null);
    setEditingText('');
  };

  const openAiModal = (q) => {
    setSelectedQuestion(q);
    setAiText('');
    setShowAiModal(true);
  };

  const handleGenerateAi = async () => {
    setLoadingAi(true);
    const res = await generateAiAnswer(selectedQuestion.question_text);
    setAiText(res.ai_answer);
    setLoadingAi(false);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Notes - Questions & Answers</h1>

      {/* Add Question Form */}
      <form onSubmit={handleCreateQuestion} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newQ}
          onChange={(e) => setNewQ(e.target.value)}
          placeholder="Enter your question"
          className="flex-1 border px-3 py-2 rounded"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
      </form>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="border rounded p-4 shadow">
            {/* Question Header */}
            <div className="flex justify-between items-start">
              {editingQuestionId === q.id ? (
                <div className="w-full">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                    rows={3}
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => handleUpdateQuestion(q.id)}
                      className="px-4 py-2 text-white rounded-lg font-medium transition-colors bg-indigo-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingQuestionId(null);
                        setEditingText('');
                      }}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <h3 className="text-lg font-medium mb-2 text-indigo-950">Q: {q.question_text}</h3>
              )}

              <div className="flex gap-3 text-sm">
                <button
                  onClick={() => openAiModal(q)}
                  className="text-blue-600 hover:underline"
                >
                  AI
                </button>
                <button
                  onClick={() => handleEditQuestion(q)}
                  className="text-green-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Answer Section */}
            <div className="mt-4">
              {!q.answer ? (
                q.showAnswerForm ? (
                  <>
                    <textarea
                      className="w-full border p-2 rounded"
                      placeholder="Write your answer..."
                      value={q.newAnswer || ''}
                      onChange={(e) =>
                        setQuestions((prev) =>
                          prev.map((item) =>
                            item.id === q.id ? { ...item, newAnswer: e.target.value } : item
                          )
                        )
                      }
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={async () => {
                          const newAns = await postAnswer(q.id, q.newAnswer);
                          setQuestions((prev) =>
                            prev.map((item) =>
                              item.id === q.id
                                ? { ...item, answer: newAns, showAnswerForm: false, newAnswer: '' }
                                : item
                            )
                          );
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() =>
                          setQuestions((prev) =>
                            prev.map((item) =>
                              item.id === q.id
                                ? { ...item, showAnswerForm: false, newAnswer: '' }
                                : item
                            )
                          )
                        }
                        className="text-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() =>
                      setQuestions((prev) =>
                        prev.map((item) =>
                          item.id === q.id ? { ...item, showAnswerForm: true } : item
                        )
                      )
                    }
                    className="text-indigo-600 text-sm underline"
                  >
                    Add Answer
                  </button>
                )
              ) : q.showAnswer ? (
                <div className="mt-2 bg-gray-100 p-3 rounded">
                  <textarea
                    className="w-full border p-2 rounded"
                    value={q.editingAnswerText || q.answer.answer_text}
                    onChange={(e) =>
                      setQuestions((prev) =>
                        prev.map((item) =>
                          item.id === q.id
                            ? { ...item, editingAnswerText: e.target.value }
                            : item
                        )
                      )
                    }
                  />
                  <div className="text-sm mt-2 flex gap-3">
                    <button
                      onClick={async () => {
                        const updated = await updateAnswer(
                          q.answer.id,
                          q.editingAnswerText || q.answer.answer_text
                        );
                        setQuestions((prev) =>
                          prev.map((item) =>
                            item.id === q.id
                              ? {
                                  ...item,
                                  answer: updated,
                                  editingAnswerText: '',
                                }
                              : item
                          )
                        );
                      }}
                      className="text-green-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={() =>
                        dispatch(
                          showDialog({
                            message: 'Delete this answer?',
                            onConfirm: async () => {
                              await deleteAnswer(q.answer.id);
                              setQuestions((prev) =>
                                prev.map((item) =>
                                  item.id === q.id
                                    ? {
                                        ...item,
                                        answer: null,
                                        showAnswer: false,
                                        editingAnswerText: '',
                                      }
                                    : item
                                )
                              );
                            },
                          })
                        )
                      }
                      className="text-red-500"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() =>
                        setQuestions((prev) =>
                          prev.map((item) =>
                            item.id === q.id ? { ...item, showAnswer: false } : item
                          )
                        )
                      }
                      className="text-gray-500"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() =>
                    setQuestions((prev) =>
                      prev.map((item) =>
                        item.id === q.id ? { ...item, showAnswer: true } : item
                      )
                    )
                  }
                  className="text-indigo-600 text-sm underline"
                >
                  View Answer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-xl relative">
            <button
              onClick={() => setShowAiModal(false)}
              className="absolute top-2 right-3 text-2xl font-bold text-gray-600"
            >
              ×
            </button>
            <h2 className="text-lg font-semibold mb-2">
              AI Answer for: <span className="italic">{selectedQuestion?.question_text}</span>
            </h2>
            <button
              onClick={handleGenerateAi}
              className="mb-3 bg-blue-600 text-white px-4 py-1 rounded"
            >
              Generate
            </button>
            {loadingAi && <p className="text-sm text-gray-600">Generating...</p>}
            {aiText && (
              <div className="bg-gray-100 border rounded p-3 mt-2 max-h-60 overflow-auto">
                <p>{aiText}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(aiText)}
                  className="mt-2 text-sm text-blue-600 underline"
                >
                  Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
