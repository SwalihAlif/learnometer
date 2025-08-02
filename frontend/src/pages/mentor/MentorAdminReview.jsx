import React from "react";
import AdminReviewForm from "../../components/common/AdminReviewForm";

const MentorReview = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Mentor Feedback</h1>
      <AdminReviewForm role="mentor" />
    </div>
  );
};

export default MentorReview;
