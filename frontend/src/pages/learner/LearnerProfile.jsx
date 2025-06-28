import { useEffect, useState } from "react";
import axiosInstance from '../../axios';

const LearnerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editData, setEditData] = useState({});
  const [profilePic, setProfilePic] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get("users/profile/", {
      headers: { Authorization: `Bearer ${localStorage.getItem("access")}` }
    }).then(res => {
      setProfile(res.data);
      setEditData(res.data);
      setLoading(false);
    }).catch(err => {
      console.error("Error fetching learner profile:", err);
      setLoading(false);
    });
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!editData.full_name) newErrors.full_name = "Full name is required";
    if (!editData.phone) newErrors.phone = "Phone is required";
    return newErrors;
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const formData = new FormData();
    for (let key in editData) {
      if (Array.isArray(editData[key])) {
        editData[key].forEach(val => formData.append(key, val));
      } else if (editData[key] !== null && editData[key] !== undefined) {
        formData.append(key, editData[key]);
      }
    }
    if (profilePic) formData.append("profile_picture", profilePic);

    axiosInstance.patch("users/profile/", formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
        "Content-Type": "multipart/form-data",
      }
    }).then(res => {
      alert("Profile updated successfully");
      setErrors({});
      setProfile(res.data);
    }).catch(err => {
      console.error("Error updating profile:", err);
    });
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Learner Profile</h2>

      <div className="grid gap-4 max-w-xl">
        <input name="full_name" value={editData.full_name || ''} onChange={handleChange} placeholder="Full Name" />
        {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name}</p>}

        <input name="phone" value={editData.phone || ''} onChange={handleChange} placeholder="Phone" />
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}

        <textarea name="learning_goals" value={editData.learning_goals || ''} onChange={handleChange} placeholder="Learning Goals" />

        <input name="preferred_categories" value={editData.preferred_categories?.join(", ") || ''} onChange={(e) => setEditData({ ...editData, preferred_categories: e.target.value.split(",") })} placeholder="Preferred Categories (comma-separated)" />

        <input name="languages_known" value={editData.languages_known?.join(", ") || ''} onChange={(e) => setEditData({ ...editData, languages_known: e.target.value.split(",") })} placeholder="Languages Known (comma-separated)" />

        <input type="file" onChange={(e) => setProfilePic(e.target.files[0])} />
        {profile?.profile_picture && (
          <img src={profile.profile_picture} alt="Current" className="w-24 h-24 rounded-full mt-2" />
        )}

        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
      </div>
    </div>
  );
};

export default LearnerProfile;
