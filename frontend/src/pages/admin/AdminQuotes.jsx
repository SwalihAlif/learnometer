import { useEffect, useState } from "react";
import axiosInstance from "../../axios";
import toast, { Toaster } from "react-hot-toast";

function AdminQuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [form, setForm] = useState({ quote: "", author: "" });
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchQuotes(page);
  }, [page]);

  const fetchQuotes = async (pageNumber = 1) => {
    try {
      const res = await axiosInstance.get(`adminpanel/motivational-quotes/?page=${pageNumber}`);
      setQuotes(res.data.results);
      setTotalPages(Math.ceil(res.data.count / 10));
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch quotes.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosInstance.patch(`adminpanel/motivational-quotes/${editingId}/`, form);
        toast.success("Quote updated successfully.");
      } else {
        await axiosInstance.post("adminpanel/motivational-quotes/", form);
        toast.success("Quote added successfully.");
      }
      fetchQuotes(page);
      setForm({ quote: "", author: "" });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      toast.error("Operation failed.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this quote?")) {
      try {
        await axiosInstance.delete(`adminpanel/motivational-quotes/${id}/`);
        toast.success("Quote deleted successfully.");
        fetchQuotes(page);
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete quote.");
      }
    }
  };

  const openEditForm = (quote) => {
    setForm({ quote: quote.quote, author: quote.author || "" });
    setEditingId(quote.id);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Manage Motivational Quotes</h1>

      <form onSubmit={handleSubmit} className="space-y-3 mb-6">
        <textarea
          required
          placeholder="Enter motivational quote..."
          value={form.quote}
          onChange={(e) => setForm({ ...form, quote: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          placeholder="Author (optional)"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {editingId ? "Update" : "Add"} Quote
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ quote: "", author: "" });
            }}
            className="ml-2 px-4 py-2 bg-gray-400 text-white rounded"
          >
            Cancel Edit
          </button>
        )}
      </form>

      <div className="grid gap-4">
        {quotes.map((q) => (
          <div key={q.id} className="flex justify-between items-start p-4 border rounded shadow">
            <div>
              <p className="italic">{q.quote}</p>
              {q.author && <p className="text-sm mt-1">— {q.author}</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEditForm(q)}
                className="px-3 py-1 bg-yellow-500 text-white rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(q.id)}
                className="px-3 py-1 bg-red-600 text-white rounded"
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
          className="px-3 py-1 bg-gray-300 rounded"
        >
          Prev
        </button>
        <span className="px-3 py-1">Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className="px-3 py-1 bg-gray-300 rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AdminQuotesPage;
