import React, { useEffect, useState } from "react";
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this mentor?")) return;
    try {
      await axiosInstance.delete(`users/admin/mentors/${id}/`);
      setMentors((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axiosInstance.patch(`users/admin/mentors/${id}/`, {
        is_approved: true,
      });
      fetchMentors();
    } catch (err) {
      console.error("Approval failed", err);
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
      contact_number: mentor.contact_number || '',
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
    <div className="min-h-screen bg-[#0D1117] text-[#F9FAFB] p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#FACC15]">Manage Mentors</h1>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : mentors.length === 0 ? (
        <p className="text-center">No mentors found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-[#4F46E5] text-[#F9FAFB]">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Approved</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mentors.map((mentor) => (
                <tr key={mentor.id} className="border-b border-gray-700">
                  <td className="p-3">{mentor.full_name || "N/A"}</td>
                  <td className="p-3">{mentor.email}</td>
                  <td className="p-3">{mentor.contact_number || "N/A"}</td>
                  <td className="p-3">{mentor.is_approved ? "✅" : "❌"}</td>
                  <td className="p-3 space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openViewModal(mentor)}
                      className="bg-[#FACC15] text-[#0D1117] px-2 py-1 rounded font-semibold hover:bg-yellow-400"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEditModal(mentor)}
                      className="bg-[#4F46E5] text-white px-2 py-1 rounded font-semibold hover:bg-indigo-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(mentor.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded font-semibold hover:bg-red-700"
                    >
                      Delete
                    </button>
                    {!mentor.is_approved && (
                      <button
                        onClick={() => handleApprove(mentor.id)}
                        className="bg-green-600 text-white px-2 py-1 rounded font-semibold hover:bg-green-700"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md text-black relative">
            <h2 className="text-xl font-bold mb-4">
              {editMode ? "Edit Mentor" : "Mentor Details"}
            </h2>

            {editMode ? (
              <>
                <label className="block mb-2">
                  Full Name:
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleFormChange}
                    className="w-full mt-1 p-2 border rounded"
                  />
                </label>
                <label className="block mb-2">
                  Contact:
                  <input
                    type="text"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleFormChange}
                    className="w-full mt-1 p-2 border rounded"
                  />
                </label>
                <label className="block mb-2">
                  Bio:
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleFormChange}
                    className="w-full mt-1 p-2 border rounded"
                  />
                </label>
                <button
                  onClick={handleFormSubmit}
                  className="bg-blue-600 text-white px-4 py-2 mt-4 rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <p><strong>Name:</strong> {selectedMentor.full_name}</p>
                <p><strong>Email:</strong> {selectedMentor.email}</p>
                <p><strong>Contact:</strong> {selectedMentor.contact_number}</p>
                <p><strong>Bio:</strong> {selectedMentor.bio}</p>
              </>
            )}

            <button
              onClick={() => setSelectedMentor(null)}
              className="absolute top-2 right-2 text-black text-lg"
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMentors;
