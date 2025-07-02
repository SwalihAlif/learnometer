// pages/admin/ManageLearner.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../axios";
import { X, User, Mail, Phone, FileText, Target, Calendar, Globe, Tag } from "lucide-react";
import { useDispatch } from "react-redux";
import { showDialog } from "../../redux/slices/confirmDialogSlice";

const ManageLearner = () => {
  const dispatch = useDispatch();

  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    fetchLearners();
  }, []);

  const fetchLearners = async () => {
    try {
      const res = await axiosInstance.get("users/admin/learners/");
      setLearners(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to fetch learners", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    dispatch(
      showDialog({
        title: "Delete Learner",
        message: "Are you sure you want to delete this learner?",
        onConfirm: async () => {
          try {
            await axiosInstance.delete(`users/admin/learners/${id}/`);
            setLearners((prev) => prev.filter((l) => l.id !== id));
          } catch (err) {
            console.error("Delete failed", err);
          }
        },
      })
    );
  };

  const openViewModal = (learner) => {
    setSelectedLearner(learner);
    setViewModalOpen(true);
  };

  const openEditModal = (learner) => {
    setSelectedLearner(learner);
    setFormData({
      full_name: learner.full_name || "",
      email: learner.email || "",
      phone: learner.phone || "",
    });
    setEditModalOpen(true);
  };

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async () => {
    try {
      await axiosInstance.put(`users/admin/learners/${selectedLearner.id}/`, formData);
      fetchLearners();
      setEditModalOpen(false);
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <User className="w-10 h-10" />
            Manage Learners
          </h1>
          <p className="text-indigo-100 text-lg">Monitor and manage all registered learners</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="mt-4 text-center text-gray-300 font-medium">Loading learners...</div>
            </div>
          </div>
        ) : learners.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-slate-800 rounded-2xl p-12 border border-slate-700 shadow-xl">
              <User className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-300 mb-2">No Learners Found</h3>
              <p className="text-gray-400">No registered learners to display at the moment.</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <th className="p-4 text-left font-semibold">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Name
                      </div>
                    </th>
                    <th className="p-4 text-left font-semibold">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </div>
                    </th>
                    <th className="p-4 text-left font-semibold">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Contact
                      </div>
                    </th>
                    <th className="p-4 text-left font-semibold">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Bio
                      </div>
                    </th>
                    <th className="p-4 text-left font-semibold">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Goal
                      </div>
                    </th>
                    <th className="p-4 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {learners.map((learner, index) => (
                    <tr 
                      key={learner.id} 
                      className={`border-b border-slate-700 hover:bg-slate-700/30 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/50'
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-medium text-white">
                          {learner.full_name || <span className="text-gray-400 italic">Not provided</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-indigo-300 font-medium">{learner.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-300">
                          {learner.phone || <span className="text-gray-500 italic">Not provided</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-300 max-w-xs truncate">
                          {learner.bio || <span className="text-gray-500 italic">No bio</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-300 max-w-xs truncate">
                          {learner.learning_goal || <span className="text-gray-500 italic">No goal set</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openViewModal(learner)}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditModal(learner)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(learner.id)}
                            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View Modal */}
        {viewModalOpen && selectedLearner && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white text-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <User className="w-7 h-7" />
                    Learner Details
                  </h2>
                  <button 
                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors duration-200" 
                    onClick={() => setViewModalOpen(false)}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-center mb-6">
                  <img
                    src={selectedLearner.profile_picture}
                    alt="Learner Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200 shadow-lg"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-indigo-600" />
                      <strong className="text-gray-700">Name</strong>
                    </div>
                    <p className="text-gray-800 font-medium">{selectedLearner.full_name}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-5 h-5 text-indigo-600" />
                      <strong className="text-gray-700">Email</strong>
                    </div>
                    <p className="text-gray-800 font-medium">{selectedLearner.email}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-5 h-5 text-indigo-600" />
                      <strong className="text-gray-700">Contact</strong>
                    </div>
                    <p className="text-gray-800 font-medium">{selectedLearner.phone}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      <strong className="text-gray-700">Member Since</strong>
                    </div>
                    <p className="text-gray-800 font-medium">
                      {new Date(selectedLearner.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <strong className="text-gray-700">Bio</strong>
                  </div>
                  <p className="text-gray-800">{selectedLearner.bio}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-5 h-5 text-indigo-600" />
                    <strong className="text-gray-700">Preferred Categories</strong>
                  </div>
                  <p className="text-gray-800">{selectedLearner.preferred_categories}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    <strong className="text-gray-700">Languages Known</strong>
                  </div>
                  <p className="text-gray-800">{selectedLearner.languages_known}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white text-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <User className="w-7 h-7" />
                    Edit Learner
                  </h2>
                  <button 
                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors duration-200" 
                    onClick={() => setEditModalOpen(false)}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleFormChange}
                    placeholder="Enter full name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Enter email address"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="Enter contact number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  />
                </div>
                
                <button
                  onClick={handleFormSubmit}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Update Learner
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageLearner;