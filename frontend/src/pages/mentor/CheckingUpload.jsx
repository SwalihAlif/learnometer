import React, { useState } from "react";
import axiosInstance from "../../axios";

const CheckingUpload = () => {
  const [formData, setFormData] = useState({
    message: "",
    image: null,
    video: null,
    audio: null,
  });

  const handleChange = (e) => {
    const { name, files, value } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sendData = new FormData();
    sendData.append("message", formData.message);
    if (formData.image) sendData.append("image", formData.image);
    if (formData.video) sendData.append("video", formData.video);
    if (formData.audio) sendData.append("audio", formData.audio);

    try {
      const response = await axiosInstance.post("mentorship/checking-upload/", sendData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Uploaded:", response.data);
    } catch (err) {
      console.error("Error uploading:", err.response?.data || err.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-md space-y-6"
    >
      <h2 className="text-xl font-semibold text-gray-800 text-center">Upload Feedback</h2>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Feedback Message
        </label>
        <textarea
          id="message"
          name="message"
          rows="4"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-300"
          placeholder="Write your feedback..."
          value={formData.message}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
          Upload Image
        </label>
        <input
          type="file"
          name="image"
          id="image"
          accept="image/*"
          onChange={handleChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </div>

      <div>
        <label htmlFor="video" className="block text-sm font-medium text-gray-700 mb-1">
          Upload Video
        </label>
        <input
          type="file"
          name="video"
          id="video"
          accept="video/*"
          onChange={handleChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </div>

      <div>
        <label htmlFor="audio" className="block text-sm font-medium text-gray-700 mb-1">
          Upload Audio
        </label>
        <input
          type="file"
          name="audio"
          id="audio"
          accept="audio/*"
          onChange={handleChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </div>

      <div className="text-center">
        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
        >
          Submit Feedback
        </button>
      </div>
    </form>
  );
};

export default CheckingUpload;
