import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showDialog, hideDialog } from "../../redux/slices/confirmDialogSlice";
import { Users, Mail, Phone, FileText, Award, CheckCircle, XCircle, Edit, Eye, Trash2, UserCheck, UserX, Calendar, Globe, Tag, X } from "lucide-react";

import axiosInstance from "../../axios";

const ManageMentors = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const res = await axiosInstance.get("users/admin/mentors/");
      setMentors(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to fetch mentors", err);
    } finally {
      setLoading(false);
    }
  };

  const dispatch = useDispatch();

  const handleDelete = (id) => {
    dispatch(showDialog({
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this mentor?",
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`users/admin/mentors/${id}/`);
          setMentors((prev) => prev.filter((m) => m.id !== id));
        } catch (err) {
          console.error("Delete failed", err);
        } finally {
          dispatch(hideDialog());
        }
      },
      onCancel: () => {
        dispatch(hideDialog());
      }
    }));
  };

  const handleApprovalToggle = async (id, approvalStatus) => {
    try {
      await axiosInstance.patch(`users/admin/mentors/${id}/`, {
        is_approved: approvalStatus,
      });
      fetchMentors(); // Refresh the data
    } catch (err) {
      console.error("Approval status update failed", err);
    }
  };

  const openViewModal = (mentor) => {
    setSelectedMentor(mentor);
    setEditMode(false);
  };

  const openEditModal = (mentor) => {
    setSelectedMentor(mentor);
    setFormData({
      full_name: mentor.full_name || '',
      phone: mentor.phone || '',
      bio: mentor.bio || '',
    });
    setEditMode(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async () => {
    try {
      await axiosInstance.patch(`users/admin/mentors/${selectedMentor.id}/`, formData);
      setSelectedMentor(null);
      fetchMentors();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-8 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-10 h-10" />
            Manage Mentors
          </h1>
          <p className="text-blue-100 text-lg">Monitor and manage all registered mentors</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <div className="mt-4 text-center text-gray-300 font-medium">Loading mentors...</div>
            </div>
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-slate-800 rounded-2xl p-12 border border-slate-700 shadow-xl">
              <Users className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-300 mb-2">No Mentors Found</h3>
              <p className="text-gray-400">No registered mentors to display at the moment.</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                    <th className="p-4 text-left font-semibold">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
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
                        <Award className="w-4 h-4" />
                        Experience
                      </div>
                    </th>
                    <th className="p-4 text-left font-semibold">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Status
                      </div>
                    </th>
                    <th className="p-4 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mentors.map((mentor, index) => (
                    <tr 
                      key={mentor.id} 
                      className={`border-b border-slate-700 hover:bg-slate-700/30 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/50'
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-medium text-white">
                          {mentor.full_name || <span className="text-gray-400 italic">Not provided</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-purple-300 font-medium">{mentor.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-300">
                          {mentor.phone || <span className="text-gray-500 italic">Not provided</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-300 max-w-xs truncate">
                          {mentor.bio || <span className="text-gray-500 italic">No bio</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-300">
                          {mentor.experience_years ? `${mentor.experience_years} years` : <span className="text-gray-500 italic">Not specified</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {mentor.is_approved ? (
                            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              Approved
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                              <XCircle className="w-4 h-4" />
                              Pending
                            </div>
                          )}
                        </div>
                      </td>
<td className="p-4">
  <div className="flex items-center gap-2 flex-wrap">
    <button
      onClick={() => openViewModal(mentor)}
      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-2 py-1 text-sm rounded-md font-medium transition-all duration-200 transform hover:scale-105 shadow-md flex items-center gap-1"
    >
      <Eye className="w-4 h-4" />
      View
    </button>
    <button
      onClick={() => openEditModal(mentor)}
      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-2 py-1 text-sm rounded-md font-medium transition-all duration-200 transform hover:scale-105 shadow-md flex items-center gap-1"
    >
      <Edit className="w-4 h-4" />
      Edit
    </button>
    <button
      onClick={() => handleDelete(mentor.id)}
      className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-2 py-1 text-sm rounded-md font-medium transition-all duration-200 transform hover:scale-105 shadow-md flex items-center gap-1"
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
    {mentor.is_approved ? (
      <button
        onClick={() => handleApprovalToggle(mentor.id, false)}
        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-2 py-1 text-sm rounded-md font-medium transition-all duration-200 transform hover:scale-105 shadow-md flex items-center gap-1"
      >
        <UserX className="w-4 h-4" />
        Disapprove
      </button>
    ) : (
      <button
        onClick={() => handleApprovalToggle(mentor.id, true)}
        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-2 py-1 text-sm rounded-md font-medium transition-all duration-200 transform hover:scale-105 shadow-md flex items-center gap-1"
      >
        <UserCheck className="w-4 h-4" />
        Approve
      </button>
    )}
  </div>
</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {selectedMentor && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white text-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    {editMode ? (
                      <>
                        <Edit className="w-7 h-7" />
                        Edit Mentor
                      </>
                    ) : (
                      <>
                        <Users className="w-7 h-7" />
                        Mentor Details
                      </>
                    )}
                  </h2>
                  <button 
                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors duration-200" 
                    onClick={() => setSelectedMentor(null)}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Users className="w-4 h-4 inline mr-2" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleFormChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                        placeholder="Enter full name"
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
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                        placeholder="Enter contact number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleFormChange}
                        rows="4"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
                        placeholder="Enter bio"
                      />
                    </div>
                    
                    <button
                      onClick={handleFormSubmit}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center mb-6">
                      <img
                        src={selectedMentor.profile_picture}
                        alt="Mentor Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-purple-200 shadow-lg"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-5 h-5 text-purple-600" />
                          <strong className="text-gray-700">Name</strong>
                        </div>
                        <p className="text-gray-800 font-medium">{selectedMentor.full_name}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-5 h-5 text-purple-600" />
                          <strong className="text-gray-700">Email</strong>
                        </div>
                        <p className="text-gray-800 font-medium">{selectedMentor.email}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="w-5 h-5 text-purple-600" />
                          <strong className="text-gray-700">Contact</strong>
                        </div>
                        <p className="text-gray-800 font-medium">{selectedMentor.phone}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          <strong className="text-gray-700">Member Since</strong>
                        </div>
                        <p className="text-gray-800 font-medium">
                          {new Date(selectedMentor.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <strong className="text-gray-700">Bio</strong>
                      </div>
                      <p className="text-gray-800">{selectedMentor.bio}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-5 h-5 text-purple-600" />
                        <strong className="text-gray-700">Expertise</strong>
                      </div>
                      <p className="text-gray-800">{selectedMentor.preferred_categories}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-5 h-5 text-purple-600" />
                        <strong className="text-gray-700">Languages</strong>
                      </div>
                      <p className="text-gray-800">{selectedMentor.languages_known}</p>
                    </div>
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

export default ManageMentors;