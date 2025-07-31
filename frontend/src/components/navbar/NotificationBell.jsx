import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../axios';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axiosInstance.get("notification/admin-notification/");
        console.log("[API] Fetched notifications:", res.data);

        const data = Array.isArray(res.data.results) ? res.data.results : [];
        setNotifications(data);

        const unread = data.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("[API] Failed to fetch notifications:", err);
        toast.error("Failed to load notifications.");
      }
    };

    fetchNotifications();

    let ws;
    try {
      ws = new WebSocket("ws://localhost:8000/ws/notifications/");

      ws.onopen = () => {
        console.log("[WebSocket] Connected to /ws/notifications/");
      };

      ws.onmessage = (event) => {
        console.log("[WebSocket] Message received:", event.data);
        try {
          const data = JSON.parse(event.data);
          setNotifications((prev) => [...(Array.isArray(prev) ? prev : []), data]);
          setUnreadCount((count) => count + 1);
          toast.success(data.message || "New notification received");
        } catch (err) {
          console.error("[WebSocket] Failed to parse message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
        toast.error("WebSocket connection error.");
      };

      ws.onclose = (event) => {
        console.log(`[WebSocket] Connection closed (code: ${event.code})`);
      };
    } catch (err) {
      console.error("[WebSocket] Failed to initialize:", err);
    }

    return () => {
      console.log("[WebSocket] Closing connection...");
      ws?.close();
    };
  }, []);

  const markAllAsRead = () => setUnreadCount(0);

  return (
    <div className="relative">
      <button
        onClick={() => {
          setDropdownOpen(!dropdownOpen);
          markAllAsRead();
        }}
        className="relative"
      >
        <Bell className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white text-black shadow-lg rounded-md z-50">
          <div className="p-2 font-semibold border-b">Notifications</div>
          <ul className="max-h-60 overflow-y-auto">
            {notifications.map((n, i) => (
              <li key={i} className="p-2 hover:bg-gray-100 border-b text-sm">
                {n.message}
              </li>
            ))}
            {notifications.length === 0 && (
              <li className="p-2 text-center text-sm text-gray-500">No notifications</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;


