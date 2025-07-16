import { useEffect, useState } from "react";
import axiosInstance from "../../axios";
import toast, { Toaster } from "react-hot-toast";

function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("adminpanel/notifications/");
      setNotifications(res.data);
    } catch (err) {
      console.error("Error fetching notifications", err);
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axiosInstance.post("adminpanel/notifications/mark-read/", { id });
      toast.success("Notification marked as read!");

      // Optimistic local update instead of re-fetching
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error("Error marking notification as read", err);
      toast.error("Failed to mark as read.");
    }
  };

  return (
    <div className="p-4 bg-[#0D1117] min-h-screen text-[#F9FAFB]">
      <Toaster position="top-right" />

      <h2 className="text-2xl font-bold mb-6 text-[#FACC15]">Admin Notifications</h2>

      {loading ? (
        <p className="text-gray-300">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-300">No notifications available.</p>
      ) : (
        <ul className="space-y-4">
          {notifications.map((notif) => (
            <li
              key={notif.id}
              className={`p-4 rounded-lg shadow transition-all ${
                notif.is_read ? "bg-gray-800" : "bg-[#4F46E5]"
              }`}
            >
              <p className="font-medium">{notif.message}</p>
              <small className="block mt-1 text-sm text-gray-300">
                {new Date(notif.created_at).toLocaleString()}
              </small>

              <button
                disabled={notif.is_read}
                onClick={() => markAsRead(notif.id)}
                className={`mt-3 px-4 py-2 rounded font-semibold transition-all
                  ${
                    notif.is_read
                      ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                      : "bg-[#FACC15] text-black hover:opacity-90"
                  }`}
              >
                {notif.is_read ? "Marked as Read" : "Mark as Read"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminNotifications;
