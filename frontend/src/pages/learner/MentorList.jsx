import React, { useEffect, useState } from "react";
import { fetchMentors } from "../../api/mentorshipAPI";
import { useNavigate } from "react-router-dom";

const MentorList = () => {
    const [mentors, setMentors] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMentors()
            .then((res) => {
                console.log("Full API response:", res.data);
                setMentors(res.data); // Use res.data directly if it's an array
            })
            .catch((err) => console.error("Failed to fetch mentors", err));
    }, []);

    console.log("Mentors state before rendering:", mentors);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">All Mentors</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(mentors) && mentors.map((mentor, index) => {
                    console.log(`Mentor ${index} ID:`, mentor.user_id); // 👈 Added log for individual mentor

                    return (
                        <div
                            key={mentor.id}
                            className="border p-4 rounded-lg shadow hover:shadow-lg transition"
                        >
                            <img
                                src={mentor.profile_picture || "https://via.placeholder.com/100"}
                                alt={mentor.full_name || "Mentor"}
                                className="w-24 h-24 rounded-full object-cover mb-2"
                            />

                            <h3 className="text-lg font-semibold">{mentor.full_name || "Unnamed Mentor"}</h3>
                            <p className="text-sm text-gray-600">{mentor.bio || "No bio available"}</p>
                            <p className="text-sm mt-1">
                                Experience: {mentor.experience_years ?? "N/A"} years
                            </p>
                            <p className="text-sm mt-1">
                                Categories: {(mentor.preferred_categories || []).join(", ")}
                            </p>
                            <p className="text-sm mt-1">
                                Languages: {(mentor.languages_known || []).join(", ")}
                            </p>

                            <button
                                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={() => navigate(`/learner/book-session/${mentor.user_id}`)}
                            >
                                Book Session
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MentorList;

