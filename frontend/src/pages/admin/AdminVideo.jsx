import { useEffect, useState } from "react";
import axiosInstance from "../../axios";
import toast, { Toaster } from "react-hot-toast";

function AdminVideosPage() {
    const [videos, setVideos] = useState([]);
    const [form, setForm] = useState({ title: "", youtube_url: "" });
    const [editingId, setEditingId] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchVideos(page);
    }, [page]);

    const fetchVideos = async (pageNumber = 1) => {
        try {
            const res = await axiosInstance.get(`adminpanel/motivational-videos/?page=${pageNumber}`);
            setVideos(res.data.results);
            setTotalPages(Math.ceil(res.data.count / 10));
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch videos.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axiosInstance.patch(`adminpanel/motivational-videos/${editingId}/`, form);
                toast.success("Video updated successfully.");
            } else {
                await axiosInstance.post("adminpanel/motivational-videos/", form);
                toast.success("Video added successfully.");
            }
            fetchVideos(page);
            setForm({ title: "", youtube_url: "" });
            setEditingId(null);
        } catch (err) {
            console.error(err);
            toast.error("Operation failed.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this video?")) {
            try {
                await axiosInstance.delete(`adminpanel/motivational-videos/${id}/`);
                toast.success("Video deleted successfully.");
                fetchVideos(page);
            } catch (err) {
                console.error(err);
                toast.error("Failed to delete video.");
            }
        }
    };

    const openEditForm = (video) => {
        setForm({ title: video.title, youtube_url: video.youtube_url });
        setEditingId(video.id);
    };

    const getEmbedUrl = (url) => {
        try {
            let videoId = "";

            if (url.includes("youtube.com")) {
                const parsed = new URL(url);
                videoId = parsed.searchParams.get("v");
            } else if (url.includes("youtu.be")) {
                videoId = url.split("youtu.be/")[1].split("?")[0];
            }

            return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
        } catch {
            return "";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 p-6">
            <div className="max-w-7xl mx-auto">
                <Toaster />

                {/* Header Section */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                        Manage Motivational Videos
                    </h1>
                    <p className="text-gray-300 text-lg">Curate and organize your inspirational content</p>
                </div>

                {/* Form Section */}
                <div className="bg-gray-800/80 rounded-2xl shadow-xl p-6 mb-8 backdrop-blur-sm border border-gray-700">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">Video Title</label>
                                <input
                                    required
                                    placeholder="Enter an inspiring title..."
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-700/50 text-white placeholder-gray-400"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">YouTube URL</label>
                                <input
                                    required
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    value={form.youtube_url}
                                    onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-700/50 text-white placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                {editingId ? "✨ Update Video" : "🎬 Add Video"}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setForm({ title: "", youtube_url: "" });
                                    }}
                                    className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Videos Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {videos.map((v) => (
                        <div key={v.id} className="group bg-gray-800/80 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-700 hover:border-purple-500 transform hover:-translate-y-1">
                            <div className="p-4">
                                <h3 className="font-bold text-gray-200 mb-3 text-center line-clamp-2 group-hover:text-purple-400 transition-colors duration-200">
                                    {v.title}
                                </h3>

                                {getEmbedUrl(v.youtube_url) && (
                                    <div className="relative mb-4 rounded-lg overflow-hidden shadow-md">
                                        <iframe
                                            src={getEmbedUrl(v.youtube_url)}
                                            title={v.title}
                                            className="w-full aspect-video"
                                            frameBorder="0"
                                            allowFullScreen
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>
                                )}

                                <div className="flex justify-center gap-2">
                                    <button
                                        onClick={() => openEditForm(v)}
                                        className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-amber-500 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(v.id)}
                                        className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-4 bg-gray-800/80 rounded-2xl shadow-lg p-4 backdrop-blur-sm border border-gray-700">
                    <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                    >
                        ← Previous
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="px-4 py-2 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 text-purple-300 rounded-lg font-medium border border-purple-700">
                            Page {page} of {totalPages}
                        </span>
                    </div>

                    <button
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AdminVideosPage;
