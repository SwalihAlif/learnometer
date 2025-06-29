import { useParams } from 'react-router-dom';
import {useState, useEffect } from 'react';
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

    const dispatch = useDispatch();

    useEffect(() => {
        getQuestionsByTopic(topicId).then((res) => setQuestions(res.results));
    }, [topicId]);

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
        if (!newQ.trim()) return;
        const newQuestion = await postQuestion(topicId, { question_text: newQ });
        setQuestions([newQuestion, ...questions]);
        setNewQ('');
    };

    const handleDeleteQuestion = (id) => {
        dispatch(showDialog({
            message: 'Are you sure you want to delete this question?',
            onConfirm: async () => {
                await deleteQuestion(id);
                setQuestions(prev => prev.filter(q => q.id !== id));
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
                <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <BookOpen className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-indigo-900">Notes</h1>
                    </div>
                    <p className="text-indigo-600 font-medium">Questions & Answers</p>
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
                    {questions.map((q) => (
                        <div key={q.id} className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
                            {/* Question Header */}
                            <div className="bg-gradient-to-r from-indigo-50 to-yellow-50 p-6 border-b border-indigo-100">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-indigo-100 rounded-lg mt-1">
                                                <MessageSquare className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <p className="text-lg font-semibold text-indigo-900 leading-relaxed">
                                                {q.question_text}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openAiModal(q)}
                                            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            AI
                                        </button>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-all duration-200 hover:shadow-md">
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
                                    </div>
                                </div>
                            </div>

                            {/* Answer Section */}
                            <div className="p-6">
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
                                                                    item.id === q.id ? { ...item, answer: newAns, showAnswerForm: false, newAnswer: '' } : item
                                                                )
                                                            );
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
                                                    value={q.editingAnswerText || q.answer.answer_text}
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
                                                        onClick={async () => {
                                                            const updated = await updateAnswer(q.answer.id, q.editingAnswerText || q.answer.answer_text);
                                                            setQuestions(prev =>
                                                                prev.map(item =>
                                                                    item.id === q.id ? { ...item, answer: updated, editingAnswerText: '' } : item
                                                                )
                                                            );
                                                        }}
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
        </div>
    );
};

export default NotesPage;