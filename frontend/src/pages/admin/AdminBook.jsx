import { useEffect, useState } from "react";
import axiosInstance from "../../axios";
import toast, { Toaster } from "react-hot-toast";

function AdminBooksPage() {
    const [books, setBooks] = useState([]);
    const [form, setForm] = useState({ title: "", pdf_file: null, pdf_image: null });
    const [editingId, setEditingId] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchBooks(page);
    }, [page]);

    const fetchBooks = async (pageNumber = 1) => {
        try {
            const res = await axiosInstance.get(`adminpanel/motivational-books/?page=${pageNumber}`);
            setBooks(res.data.results);
            setTotalPages(Math.ceil(res.data.count / 10));
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch books.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("title", form.title);
            if (form.pdf_file) formData.append("pdf_file", form.pdf_file);
            if (form.pdf_image) formData.append("pdf_image", form.pdf_image);

            if (editingId) {
                await axiosInstance.patch(`adminpanel/motivational-books/${editingId}/`, formData);
                toast.success("Book updated successfully.");
            } else {
                await axiosInstance.post("adminpanel/motivational-books/", formData);
                toast.success("Book added successfully.");
            }
            fetchBooks(page);
            setForm({ title: "", pdf_file: null, pdf_image: null });
            setEditingId(null);
        } catch (err) {
            console.error(err);
            toast.error("Operation failed.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this book?")) {
            try {
                await axiosInstance.delete(`adminpanel/motivational-books/${id}/`);
                toast.success("Book deleted successfully.");
                fetchBooks(page);
            } catch (err) {
                console.error(err);
                toast.error("Failed to delete book.");
            }
        }
    };

    const openEditForm = (book) => {
        setForm({ title: book.title, pdf_file: null, pdf_image: null });
        setEditingId(book.id);
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-green-800">Manage Motivational Books (PDF)</h1>

            <form onSubmit={handleSubmit} className="space-y-3 mb-6">
                <input
                    required
                    placeholder="Book Title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full p-2 border rounded"
                />
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setForm({ ...form, pdf_file: e.target.files[0] })}
                    className="w-full p-2 border rounded"
                />
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm({ ...form, pdf_image: e.target.files[0] })}
                    className="w-full p-2 border rounded"
                />

                <button
                    type="submit"
                    className="px-4 py-2 bg-green-700 text-white rounded"
                >
                    {editingId ? "Update" : "Add"} Book
                </button>
                {editingId && (
                    <button
                        type="button"
                        onClick={() => {
                            setEditingId(null);
                            setForm({ title: "", pdf_file: null, pdf_image: null });
                        }}
                        className="ml-2 px-4 py-2 bg-gray-400 text-white rounded"
                    >
                        Cancel Edit
                    </button>
                )}
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {books.map((b) => (
                    <div key={b.id} className="flex flex-col p-4 border rounded shadow bg-green-50">
                        {b.pdf_image_url && (
                            <img src={b.pdf_image_url} alt={b.title} className="mb-2 w-full h-48 object-cover rounded" />
                        )}
                        <p className="font-semibold mb-2">{b.title}</p>

                        <div className="flex flex-col gap-2">
                            <a
                                href={b.pdf_file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-green-600 text-white rounded text-center"
                            >
                                Download PDF
                            </a>

                            <a
                                href={b.pdf_file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-blue-600 text-white rounded text-center"
                            >
                                Read Online
                            </a>
                        </div>

                        <div className="flex justify-center gap-2 mt-2">
                            <button
                                onClick={() => openEditForm(b)}
                                className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(b.id)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center gap-2 mt-4">
                <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-green-200 rounded"
                >
                    Prev
                </button>
                <span className="px-3 py-1">Page {page} of {totalPages}</span>
                <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-green-200 rounded"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default AdminBooksPage;
