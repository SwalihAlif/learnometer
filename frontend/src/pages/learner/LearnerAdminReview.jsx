import React from "react";
import AdminReviewForm from "../../components/common/AdminReviewForm";

const LearnerReview = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Learner Feedback</h1>
      <AdminReviewForm role="learner" />
    </div>
  );
};

export default LearnerReview;
