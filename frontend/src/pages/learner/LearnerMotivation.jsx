import { useEffect, useState } from "react";
import axiosInstance from "../../axios";

function LearnerMotivationPage() {
    const [quote, setQuote] = useState(null);
    const [videos, setVideos] = useState({ results: [] });
    const [books, setBooks] = useState({ results: [] });
    const [videoSearch, setVideoSearch] = useState("");
    const [bookSearch, setBookSearch] = useState("");
    const [videoPage, setVideoPage] = useState(1);
    const [bookPage, setBookPage] = useState(1);

    useEffect(() => {
        axiosInstance.get("adminpanel/learner/motivation/daily-quote/")
            .then(res => setQuote(res.data))
            .catch(() => setQuote(null));
    }, []);

useEffect(() => {
    axiosInstance.get(`adminpanel/public-videos/?search=${videoSearch}&page=${videoPage}`)
        .then(res => {
            console.log("Fetched videos from API:", res.data);
            setVideos(res.data);
        })
        .catch(() => {
            console.log("Error fetching videos");
            setVideos({ results: [] });
        });
}, [videoSearch, videoPage]);

const getEmbedUrl = (youtubeLink) => {
    try {
        console.log("Processing video link:", youtubeLink);

        if (!youtubeLink) return "";
        let videoId = "";

        if (youtubeLink.includes("youtube.com")) {
            const url = new URL(youtubeLink);
            videoId = url.searchParams.get("v");
        } else if (youtubeLink.includes("youtu.be")) {
            videoId = youtubeLink.split("youtu.be/")[1]?.split("?")[0];
        }

        console.log("Extracted videoId:", videoId);
        return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    } catch (error) {
        console.error("Error parsing video link:", youtubeLink, error);
        return "";
    }
};


    useEffect(() => {
        axiosInstance.get(`adminpanel/public-books/?search=${bookSearch}&page=${bookPage}`)
            .then(res => setBooks(res.data))
            .catch(() => setBooks({ results: [] }));
    }, [bookSearch, bookPage]);



return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">

            {/* Daily Quote */}
            <div className="mb-8 p-8 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                            <span className="text-2xl">💡</span>
                        </div>
                        <h2 className="text-3xl font-bold">Daily Quote</h2>
                    </div>
                    <blockquote className="text-xl italic font-medium mb-4 text-center leading-relaxed">
                        "{quote?.quote || "No quote today."}"
                    </blockquote>
                    <p className="text-yellow-300 text-lg font-medium text-center">
                        — {quote?.author || "Unknown"}
                    </p>
                </div>
            </div>

            {/* Motivational Videos */}
            <div className="mb-12 bg-white rounded-2xl shadow-lg p-8 border border-indigo-100">
                <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xl">🎬</span>
                    </div>
                    <h2 className="text-2xl font-bold text-indigo-900">Motivational Videos</h2>
                </div>
                
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search for inspiring videos..."
                        value={videoSearch}
                        onChange={(e) => {
                            setVideoSearch(e.target.value);
                            setVideoPage(1);
                        }}
                        className="w-full p-4 border-2 border-indigo-200 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 bg-gray-50 text-indigo-900 placeholder-indigo-400"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {videos.results.map((video) => {
                        const embedUrl = getEmbedUrl(video.youtube_url);
                        return (
                            <div key={video.id} className="group bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-indigo-100 hover:border-indigo-300 transform hover:-translate-y-1">
                                <div className="p-4">
                                    <h3 className="font-bold text-indigo-900 mb-3 text-center line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200">
                                        {video.title}
                                    </h3>
                                    {embedUrl ? (
                                        <div className="relative rounded-lg overflow-hidden shadow-md">
                                            <iframe
                                                src={embedUrl}
                                                title={video.title}
                                                className="w-full aspect-video"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </div>
                                    ) : (
                                        <div className="w-full aspect-video bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center">
                                            <p className="text-red-600 text-center font-medium">Invalid YouTube link</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center items-center gap-4 mt-8">
                    <button 
                        disabled={!videos.previous} 
                        onClick={() => setVideoPage(videoPage - 1)} 
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                    >
                        ← Previous
                    </button>
                    <div className="px-4 py-2 bg-yellow-400 text-indigo-900 rounded-lg font-bold">
                        Page {videoPage}
                    </div>
                    <button 
                        disabled={!videos.next} 
                        onClick={() => setVideoPage(videoPage + 1)} 
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* Motivational Books */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-indigo-100">
                <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xl">📚</span>
                    </div>
                    <h2 className="text-2xl font-bold text-indigo-900">Motivational Books</h2>
                </div>
                
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search for inspiring books..."
                        value={bookSearch}
                        onChange={(e) => {
                            setBookSearch(e.target.value);
                            setBookPage(1);
                        }}
                        className="w-full p-4 border-2 border-indigo-200 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 bg-gray-50 text-indigo-900 placeholder-indigo-400"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {books.results.map((book) => (
                        <div key={book.id} className="group bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-indigo-100 hover:border-indigo-300 transform hover:-translate-y-1">
                            <div className="p-4 flex flex-col h-full">
                                <h3 className="font-bold text-indigo-900 mb-3 text-center line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200">
                                    {book.title}
                                </h3>
                                {book.pdf_image_url && (
                                    <div className="mb-4 rounded-lg overflow-hidden shadow-md">
                                        <img 
                                            src={book.pdf_image_url} 
                                            alt={book.title} 
                                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
                                        />
                                    </div>
                                )}
                                <div className="mt-auto">
                                    <a
                                        href={book.pdf_file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full text-center px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-indigo-900 font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    >
                                        📖 Read/Download
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center items-center gap-4 mt-8">
                    <button 
                        disabled={!books.previous} 
                        onClick={() => setBookPage(bookPage - 1)} 
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                    >
                        ← Previous
                    </button>
                    <div className="px-4 py-2 bg-yellow-400 text-indigo-900 rounded-lg font-bold">
                        Page {bookPage}
                    </div>
                    <button 
                        disabled={!books.next} 
                        onClick={() => setBookPage(bookPage + 1)} 
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                    >
                        Next →
                    </button>
                </div>
            </div>

        </div>
    </div>
);
}

export default LearnerMotivationPage;
