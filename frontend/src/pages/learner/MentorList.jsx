import React, { useEffect, useState } from "react";
import { fetchMentors } from "../../api/mentorshipAPI";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { isBefore } from "date-fns";

const ITEMS_PER_PAGE = 10;

const MentorList = () => {
  const [mentors, setMentors] = useState([]);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const res = await fetchMentors();
      const data = Array.isArray(res.data) ? res.data : [];

      const now = new Date();

      // Keep all mentors but filter their slots to only show future ones
      const updatedMentors = data.map((mentor) => {
        const futureSlots = (mentor.slots || []).filter((slot) => {
          const slotDateTime = new Date(`${slot.date}T${slot.start_time}`);
          return !isBefore(slotDateTime, now);
        });

        return { ...mentor, slots: futureSlots };
      });

      setMentors(updatedMentors);
    } catch (err) {
      toast.error("Failed to load mentors.");
      console.error("Mentor fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPages = Math.ceil(mentors.length / ITEMS_PER_PAGE);
  const paginatedMentors = mentors.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <span className="text-2xl">👨‍🏫</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Mentors</h1>
              <p className="text-gray-600 mt-1">Connect with experienced mentors to accelerate your learning journey</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {paginatedMentors.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl text-gray-400">📚</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No mentors available</h3>
            <p className="text-gray-600">Check back later for new mentors joining our platform.</p>
          </div>
        ) : (
          <>
            {/* Mentors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {paginatedMentors.map((mentor, index) => (
                <div
                  key={mentor.user_id || index}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:-translate-y-1 overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <img
                          src={mentor.profile_picture || "https://via.placeholder.com/100"}
                          alt={mentor.full_name || "Mentor"}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                        {mentor.full_name || "Unnamed Mentor"}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 pb-6">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                      {mentor.bio || "No bio available"}
                    </p>

                    {/* Info Grid */}
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center text-sm">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-blue-600">⏱️</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-gray-600">Experience:</span>
                          <span className="font-semibold text-gray-900 ml-1">
                            {mentor.experience_years ?? "N/A"} years
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start text-sm">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                          <span className="text-purple-600">🏷️</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-gray-600 block mb-1">Categories:</span>
                          <div className="flex flex-wrap gap-1">
                            {(mentor.preferred_categories || []).length > 0 ? (
                              mentor.preferred_categories.slice(0, 2).map((category, idx) => (
                                <span key={idx} className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                  {category}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">N/A</span>
                            )}
                            {mentor.preferred_categories && mentor.preferred_categories.length > 2 && (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                +{mentor.preferred_categories.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start text-sm">
                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                          <span className="text-green-600">🌍</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-gray-600 block mb-1">Languages:</span>
                          <div className="flex flex-wrap gap-1">
                            {(mentor.languages_known || []).length > 0 ? (
                              mentor.languages_known.slice(0, 2).map((language, idx) => (
                                <span key={idx} className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                  {language}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">N/A</span>
                            )}
                            {mentor.languages_known && mentor.languages_known.length > 2 && (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                +{mentor.languages_known.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Availability Status */}
                    <div className="mb-5">
                      {mentor.slots && mentor.slots.length > 0 ? (
                        <div className="flex items-center justify-center p-3 bg-green-50 border border-green-200 rounded-xl">
                          <span className="text-green-600 mr-2">✅</span>
                          <span className="text-sm font-semibold text-green-700">
                            {mentor.slots.length} upcoming session{mentor.slots.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-3 bg-red-50 border border-red-200 rounded-xl">
                          <span className="text-red-500 mr-2">❌</span>
                          <span className="text-sm font-semibold text-red-600">No upcoming slots</span>
                        </div>
                      )}
                    </div>

                    {/* Book Session Button */}
                    <button
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 active:scale-95"
                      onClick={() => navigate(`/learner/book-session/${mentor.user_id}`)}
                    >
                      Book Session
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-1">
                <nav className="flex items-center space-x-1 bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      page === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    ← Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          page === p
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105"
                            : "text-gray-700 hover:bg-gray-100 hover:scale-105"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      page === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Next →
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MentorList;