import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { showDialog } from '../../redux/slices/confirmDialogSlice';
import {
    getQuestionsByTopic,
    postQuestion,
    deleteQuestion,
    generateAiAnswer,
    postAnswer,
    updateAnswer,
    deleteAnswer,
    updateQuestion,
} from '../../api/notesApi';
import {
    Plus,
    Trash2,
    Edit3,
    Sparkles,
    Eye,
    EyeOff,
    Save,
    X,
    Copy,
    MessageSquare,
    BookOpen
} from 'lucide-react';

const NotesPage = () => {
    const { topicId } = useParams();
    const [questions, setQuestions] = useState([]);
    const [newQ, setNewQ] = useState('');
    const [showAiModal, setShowAiModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [aiText, setAiText] = useState('');
    const [loadingAi, setLoadingAi] = useState(false);

    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [editedText, setEditedText] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const dispatch = useDispatch();

    useEffect(() => {
        getQuestionsByTopic(topicId).then((res) => setQuestions(res.results));
    }, [topicId]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedQuestions = questions.slice(startIndex, endIndex);
    const totalPages = Math.ceil(questions.length / itemsPerPage);

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
        if (!newQ.trim()) return;
        const newQuestion = await postQuestion(topicId, { question_text: newQ });
        setQuestions([newQuestion, ...questions]);
        setNewQ('');
        setCurrentPage(1); // show newly added question
        toast.success("Question Created successfully! ✅");
    };

    const handleEditClick = (question) => {
        setEditingQuestionId(question.id);
        setEditedText(question.question_text);
    };

    const handleUpdateQuestion = async () => {
        if (!editedText.trim()) return;

        try {
            await updateQuestion(editingQuestionId, {
                question_text: editedText,
                main_topic: topicId,
            });

            setQuestions(prev =>
                prev.map(q =>
                    q.id === editingQuestionId ? { ...q, question_text: editedText } : q
                )
            );

            setEditingQuestionId(null);
            setEditedText('');
            toast.success("Question updated successfully! ✅");
        } catch (err) {
            console.error("Question Update failed", err);
            toast.error("Failed to update the question ❌");
        }
    };

    const handleUpdateAnswer = async (q) => {
        const editedAnswerText = q.editingAnswerText ?? q.answer.answer_text;
        if (!editedAnswerText.trim()) return;

        try {
            await updateAnswer(q.answer.id, {
                answer_text: editedAnswerText,
                question: q.id,
            });

            setQuestions((prev) =>
                prev.map((item) =>
                    item.id === q.id
                        ? {
                            ...item,
                            answer: { ...item.answer, answer_text: editedAnswerText },
                            editingAnswerText: undefined,
                        }
                        : item
                )
            );

            toast.success("Answer updated successfully! ✅");
        } catch (err) {
            console.error("Answer Update failed", err);
            toast.error("Failed to update the answer ❌");
        }
    };

    const handleDeleteQuestion = (id) => {
        dispatch(showDialog({
            message: 'Are you sure you want to delete this question?',
            onConfirm: async () => {
                setQuestions(prev => {
                    const updated = prev.filter(q => q.id !== id);
                    const newTotalPages = Math.ceil(updated.length / itemsPerPage);
                    if (currentPage > newTotalPages) {
                        setCurrentPage(Math.max(1, newTotalPages));
                    }
                    return updated;
                });
                await deleteQuestion(id);
                toast.success("Question deleted successfully 🗑️");
            }
        }));
    };

    const openAiModal = (question) => {
        setSelectedQuestion(question);
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                {/* Header */}
                <div className="bg-[#4F46E5] rounded-2xl shadow-lg border border-[#4F46E5] p-6 mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white rounded-lg">
                            <BookOpen className="w-6 h-6 text-[#4F46E5]" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Notes</h1>
                    </div>
                    <p className="text-[#FACC15] font-medium">Questions & Answers</p>
                </div>



                {/* Add Question Form */}
                <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 mb-8">
                    <form onSubmit={handleCreateQuestion} className="flex gap-3">
                        <div className="flex-1 relative">
                            <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                            <input
                                type="text"
                                value={newQ}
                                onChange={(e) => setNewQ(e.target.value)}
                                placeholder="What would you like to learn about?"
                                className="w-full pl-11 pr-4 py-3 border-2 border-indigo-100 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-indigo-900 placeholder-indigo-400"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <Plus className="w-5 h-5" />
                            Add Question
                        </button>
                    </form>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                    {paginatedQuestions.map((q) => (
                        <div key={q.id} className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
                            {/* Question Header */}
                            <div className="bg-gradient-to-r from-indigo-50 to-yellow-50 p-3 border-b border-indigo-100">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-indigo-100 rounded-lg mt-1">
                                                <MessageSquare className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            {editingQuestionId === q.id ? (
                                                <input
                                                    value={editedText}
                                                    onChange={(e) => setEditedText(e.target.value)}
                                                    className="border border-indigo-300 rounded px-2 py-1 w-full text-base"
                                                    autoFocus
                                                />
                                            ) : (
                                                <p className="text-lg font-semibold text-indigo-900 leading-relaxed">
                                                    {q.question_text}
                                                </p>
                                            )}

                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {editingQuestionId === q.id ? (
                                            <>
                                                <button
                                                    onClick={handleUpdateQuestion}
                                                    className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingQuestionId(null);
                                                        setEditedText('');
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md font-medium"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => openAiModal(q)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                    AI
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(q)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteQuestion(q.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            </>
                                        )}

                                    </div>
                                </div>
                            </div>

                            {/* Answer Section */}
                            <div className="p-3">
                                {!q.answer ? (
                                    <>
                                        {!q.showAnswerForm ? (
                                            <button
                                                onClick={() => {
                                                    setQuestions(prev =>
                                                        prev.map(item => item.id === q.id ? { ...item, showAnswerForm: true } : item)
                                                    );
                                                }}
                                                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add Answer
                                            </button>
                                        ) : (
                                            <div className="space-y-4">
                                                <textarea
                                                    className="w-full border-2 border-indigo-100 rounded-xl p-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-indigo-900 placeholder-indigo-400"
                                                    rows="4"
                                                    placeholder="Share your knowledge..."
                                                    value={q.newAnswer || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setQuestions(prev =>
                                                            prev.map(item =>
                                                                item.id === q.id ? { ...item, newAnswer: value } : item
                                                            )
                                                        );
                                                    }}
                                                />
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={async () => {
                                                            const newAns = await postAnswer(q.id, q.newAnswer);
                                                            setQuestions(prev =>
                                                                prev.map(item =>
                                                                    item.id === q.id
                                                                        ? { ...item, answer: newAns, showAnswerForm: false, newAnswer: '' }
                                                                        : item
                                                                )
                                                            );
                                                            toast.success('Answer added successfully ✅');
                                                        }}
                                                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-5 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        Save Answer
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setQuestions(prev =>
                                                                prev.map(item =>
                                                                    item.id === q.id ? { ...item, showAnswerForm: false, newAnswer: '' } : item
                                                                )
                                                            )
                                                        }
                                                        className="flex items-center gap-2 text-gray-600 hover:text-gray-700 px-5 py-2 border border-gray-300 rounded-lg font-medium transition-all duration-200 hover:bg-gray-50"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {!q.showAnswer ? (
                                            <button
                                                onClick={() => {
                                                    setQuestions(prev =>
                                                        prev.map(item => item.id === q.id ? { ...item, showAnswer: true } : item)
                                                    );
                                                }}
                                                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Answer
                                            </button>
                                        ) : (
                                            <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-5 border border-indigo-100">
                                                <textarea
                                                    className="w-full border-2 border-indigo-100 rounded-xl p-4 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-indigo-900 bg-white"
                                                    rows="4"
                                                    value={typeof q.editingAnswerText !== 'undefined' ? q.editingAnswerText : q.answer.answer_text}
                                                    onChange={(e) =>
                                                        setQuestions(prev =>
                                                            prev.map(item =>
                                                                item.id === q.id ? { ...item, editingAnswerText: e.target.value } : item
                                                            )
                                                        )
                                                    }
                                                />
                                                <div className="flex gap-3 mt-4">
                                                    <button
                                                        onClick={() => handleUpdateAnswer(q)}
                                                        className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors duration-200"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        Save
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            dispatch(showDialog({
                                                                message: 'Are you sure you want to delete this answer?',
                                                                onConfirm: async () => {
                                                                    await deleteAnswer(q.answer.id);
                                                                    setQuestions(prev =>
                                                                        prev.map(item =>
                                                                            item.id === q.id
                                                                                ? { ...item, answer: null, showAnswer: false, editingAnswerText: '' }
                                                                                : item
                                                                        )
                                                                    );
                                                                }
                                                            }))
                                                        }
                                                        className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setQuestions(prev =>
                                                                prev.map(item =>
                                                                    item.id === q.id ? { ...item, showAnswer: false } : item
                                                                )
                                                            )
                                                        }
                                                        className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-medium transition-colors duration-200"
                                                    >
                                                        <EyeOff className="w-4 h-4" />
                                                        Hide
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                        </div>
                    ))}
                </div>

                {/* AI Modal */}
                {showAiModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-indigo-100">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-indigo-600 to-yellow-500 p-6 text-white relative">
                                <button
                                    onClick={() => setShowAiModal(false)}
                                    className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-bold">AI Assistant</h2>
                                </div>
                                <p className="text-indigo-100 font-medium">
                                    Question: <span className="italic font-normal">"{selectedQuestion.question_text}"</span>
                                </p>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-4">
                                <button
                                    onClick={handleGenerateAi}
                                    disabled={loadingAi}
                                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    {loadingAi ? 'Generating...' : 'Generate AI Answer'}
                                </button>

                                {loadingAi && (
                                    <div className="flex items-center gap-3 text-indigo-600">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                                        <p className="font-medium">AI is thinking...</p>
                                    </div>
                                )}

                                {aiText && (
                                    <div className="bg-gradient-to-br from-gray-50 to-indigo-50 border-2 border-indigo-100 rounded-xl p-5 max-h-80 overflow-auto">
                                        <p className="text-indigo-900 leading-relaxed whitespace-pre-wrap">{aiText}</p>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(aiText)}
                                            className="mt-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Copy to Clipboard
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-center gap-2 mt-6">
  <button
    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
    disabled={currentPage === 1}
    className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
  >
    Previous
  </button>

  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
    <button
      key={pageNum}
      onClick={() => setCurrentPage(pageNum)}
      className={`px-4 py-2 rounded ${
        currentPage === pageNum
          ? "bg-indigo-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {pageNum}
    </button>
  ))}

  <button
    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
    disabled={currentPage === totalPages}
    className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
  >
    Next
  </button>
</div>





        </div>
    );
};

export default NotesPage;