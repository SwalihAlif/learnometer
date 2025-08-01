import { useEffect, useState } from "react";
import { Bell, CheckCircle, Clock, ChevronLeft, ChevronRight, Mail, MailOpen, Loader2, AlertCircle } from "lucide-react";
import axiosInstance from "../../axios";
import toast from "react-hot-toast";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const pageSize = 10;

  const fetchAdminNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('notification/admin-notification-page/', {
        params: { page, page_size: pageSize }
      });
      setNotifications(response.data.results);
      setTotalPages(Math.ceil(response.data.count / pageSize));
      setTotalCount(response.data.count);
      
      // Count unread notifications
      const unread = response.data.results.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      setMarkingAsRead(prev => ({ ...prev, [id]: true }));
      await axiosInstance.patch(`notification/admin-notification-read/${id}/mark-read/`);
      
      // Update the notification in state immediately
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(prev - 1, 0));
      
      toast.success("Marked as read");
    } catch (error) {
      toast.error("Failed to mark as read");
    } finally {
      setMarkingAsRead(prev => ({ ...prev, [id]: false }));
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      if (unreadNotifications.length === 0) {
        toast.info("All notifications are already read");
        return;
      }

      setLoading(true);
      
      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map(n => 
          axiosInstance.patch(`notification/admin-notification-page/${n.id}/mark-read/`)
        )
      );
      
      // Update all notifications in state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      
      toast.success(`Marked ${unreadNotifications.length} notifications as read`);
    } catch (error) {
      toast.error("Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getNotificationIcon = (notification) => {
    if (notification.is_read) {
      return <MailOpen className="w-5 h-5" style={{ color: '#4F46E5' }} />;
    }
    return <Mail className="w-5 h-5" style={{ color: '#FACC15' }} />;
  };

  useEffect(() => {
    fetchAdminNotifications();
  }, [page]);

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0D1117' }}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#FACC15' }} />
          <span className="ml-2 text-lg" style={{ color: '#F9FAFB' }}>Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: '#0D1117' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#1F2937' }}>
                <Bell className="w-6 h-6" style={{ color: '#FACC15' }} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#4F46E5' }}>
                  Admin Notifications
                </h1>
                <p className="text-sm md:text-base opacity-80 mt-1" style={{ color: '#F9FAFB' }}>
                  Stay updated with system activities and user actions
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: '#4F46E5', color: '#F9FAFB' }}
              >
                <CheckCircle className="w-4 h-4" />
                Mark All Read
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div
              className="rounded-lg p-4 border"
              style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" style={{ color: '#FACC15' }} />
                <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Total</span>
              </div>
              <p className="text-xl font-bold mt-1" style={{ color: '#F9FAFB' }}>
                {totalCount}
              </p>
            </div>

            <div
              className="rounded-lg p-4 border"
              style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
            >
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" style={{ color: '#FACC15' }} />
                <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Unread</span>
              </div>
              <p className="text-xl font-bold mt-1" style={{ color: '#FACC15' }}>
                {unreadCount}
              </p>
            </div>

            <div
              className="rounded-lg p-4 border"
              style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
            >
              <div className="flex items-center gap-2">
                <MailOpen className="w-4 h-4" style={{ color: '#4F46E5' }} />
                <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Read</span>
              </div>
              <p className="text-xl font-bold mt-1" style={{ color: '#4F46E5' }}>
                {totalCount - unreadCount}
              </p>
            </div>

            <div
              className="rounded-lg p-4 border"
              style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: '#F9FAFB' }} />
                <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Page</span>
              </div>
              <p className="text-xl font-bold mt-1" style={{ color: '#F9FAFB' }}>
                {page} of {totalPages}
              </p>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading && notifications.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#FACC15' }} />
              <span className="ml-2" style={{ color: '#F9FAFB' }}>Updating notifications...</span>
            </div>
          )}

          {notifications.length === 0 && !loading ? (
            <div
              className="rounded-lg p-12 text-center border"
              style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
            >
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: '#F9FAFB' }} />
              <h3 className="text-lg font-medium mb-2" style={{ color: '#F9FAFB' }}>
                No notifications yet
              </h3>
              <p className="opacity-60" style={{ color: '#F9FAFB' }}>
                New notifications will appear here as they arrive
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg p-4 md:p-6 border transition-all duration-200 hover:shadow-lg ${
                  !notification.is_read ? 'ring-1' : ''
                }`}
                style={{
                  backgroundColor: notification.is_read ? '#1F2937' : '#0F172A',
                  borderColor: notification.is_read ? '#374151' : '#FACC15',
                  ringColor: !notification.is_read ? '#FACC15' : 'transparent'
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Notification Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification)}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      {/* Recipient */}
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm md:text-base truncate" style={{ color: '#F9FAFB' }}>
                          {notification.recipient_email}
                        </h3>
                        {!notification.is_read && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: '#FACC15', color: '#0D1117' }}
                          >
                            New
                          </span>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-2 text-xs md:text-sm opacity-75" style={{ color: '#F9FAFB' }}>
                        <Clock className="w-3 h-3" />
                        {formatDate(notification.timestamp)}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="mt-3">
                      <p className="text-sm md:text-base leading-relaxed" style={{ color: '#F9FAFB' }}>
                        {notification.message}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            notification.is_read 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {notification.is_read ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Read
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Unread
                            </>
                          )}
                        </span>
                      </div>

                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          disabled={markingAsRead[notification.id]}
                          className="flex items-center gap-1 text-xs md:text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 hover:opacity-80 disabled:opacity-50"
                          style={{ backgroundColor: '#4F46E5', color: '#F9FAFB' }}
                        >
                          {markingAsRead[notification.id] ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Marking...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Mark as Read
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="mt-8 rounded-lg p-4 border"
            style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Mobile pagination */}
              <div className="flex items-center justify-between w-full sm:hidden">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: page === 1 ? '#374151' : '#4F46E5',
                    color: '#F9FAFB'
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>
                  {page} of {totalPages}
                </span>

                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: page === totalPages ? '#374151' : '#4F46E5',
                    color: '#F9FAFB'
                  }}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Desktop pagination */}
              <div className="hidden sm:flex items-center justify-between w-full">
                <div>
                  <p className="text-sm" style={{ color: '#F9FAFB' }}>
                    Showing <span className="font-medium">{((page - 1) * pageSize) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> notifications
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                    style={{
                      backgroundColor: '#374151',
                      color: '#F9FAFB'
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className="px-3 py-2 rounded-lg font-medium transition-all duration-200"
                          style={{
                            backgroundColor: page === pageNum ? '#4F46E5' : '#374151',
                            color: '#F9FAFB'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                    style={{
                      backgroundColor: '#374151',
                      color: '#F9FAFB'
                    }}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;