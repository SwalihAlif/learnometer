import React, { useEffect, useState } from "react";
import axiosInstance from "../../axios";
import { X } from "lucide-react";

const ManageLearner = () => {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    contact_number: "",
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this learner?")) return;
    try {
      await axiosInstance.delete(`users/admin/learners/${id}/`);
      setLearners((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
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
      contact_number: learner.contact_number || "",
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
    <div className="min-h-screen bg-[#0D1117] text-[#F9FAFB] p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#FACC15]">Manage Learners</h1>
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : learners.length === 0 ? (
        <p className="text-center">No learners found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-[#4F46E5] text-[#F9FAFB]">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {learners.map((learner) => (
                <tr key={learner.id} className="border-b border-gray-700">
                  <td className="p-3">{learner.full_name || "N/A"}</td>
                  <td className="p-3">{learner.email}</td>
                  <td className="p-3">{learner.contact_number || "N/A"}</td>
                  <td className="p-3 space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openViewModal(learner)}
                      className="bg-[#FACC15] text-[#0D1117] px-3 py-1 rounded font-semibold hover:bg-yellow-400"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEditModal(learner)}
                      className="bg-[#4F46E5] text-white px-3 py-1 rounded font-semibold hover:bg-indigo-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(learner.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded font-semibold hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {viewModalOpen && selectedLearner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded-lg w-96 relative">
            <button className="absolute top-2 right-2" onClick={() => setViewModalOpen(false)}>
              <X />
            </button>
            <h2 className="text-xl font-bold mb-4">Learner Details</h2>
            <p><strong>Name:</strong> {selectedLearner.full_name}</p>
            <p><strong>Email:</strong> {selectedLearner.email}</p>
            <p><strong>Contact:</strong> {selectedLearner.contact_number || "N/A"}</p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded-lg w-96 relative">
            <button className="absolute top-2 right-2" onClick={() => setEditModalOpen(false)}>
              <X />
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Learner</h2>
            <div className="space-y-3">
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleFormChange}
                placeholder="Full Name"
                className="w-full p-2 border rounded"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="Email"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleFormChange}
                placeholder="Contact Number"
                className="w-full p-2 border rounded"
              />
              <button
                onClick={handleFormSubmit}
                className="bg-[#4F46E5] text-white px-4 py-2 rounded font-semibold hover:bg-indigo-600 w-full"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLearner;

