import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";

// NOTE: Backend doesn't document /api/notifications endpoints yet
// (see plan Phase 6 open questions). This component attempts polling
// and silently no-ops on 404, but the UI is in place.

const NotificationsBell = () => {
    const { axios, user } = useAppContext();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [supported, setSupported] = useState(true);
    const ref = useRef(null);

    useEffect(() => {
        const close = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    useEffect(() => {
        if (!user || !supported) return;
        let cancelled = false;

        const tick = async () => {
            try {
                const { data } = await axios.get("/api/notifications", {
                    params: { limit: 10 },
                });
                if (cancelled) return;
                if (data?.success) {
                    setItems(data.notifications || []);
                    setUnread(data.unreadCount || 0);
                } else {
                    setSupported(false);
                }
            } catch (e) {
                if (e?.response?.status === 404) setSupported(false);
            }
        };

        tick();
        const id = setInterval(tick, 30000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [axios, user, supported]);

    const markRead = async (id) => {
        try {
            await axios.post(`/api/notifications/${id}/read`);
            setItems((prev) =>
                prev.map((n) => (n._id === id ? { ...n, read: true } : n))
            );
            setUnread((u) => Math.max(0, u - 1));
        } catch {
            // silent
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative p-1.5 rounded-full hover:bg-gray-100"
                title="Notifications"
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-borderColor rounded-md shadow-lg z-50">
                    <div className="px-4 py-2 border-b border-borderColor text-sm font-medium">
                        Notifications
                    </div>
                    {!supported ? (
                        <div className="p-4 text-xs text-gray-500">
                            Notifications coming soon. Backend endpoint{" "}
                            <code>/api/notifications</code> is pending.
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-4 text-xs text-gray-500">No notifications.</div>
                    ) : (
                        <div className="max-h-80 overflow-auto">
                            {items.map((n) => (
                                <div
                                    key={n._id}
                                    onClick={() => !n.read && markRead(n._id)}
                                    className={`px-4 py-3 text-sm border-b border-borderColor last:border-b-0 cursor-pointer ${
                                        n.read ? "text-gray-500" : "font-medium"
                                    }`}
                                >
                                    {n.title || n.message || "Notification"}
                                    {n.createdAt && (
                                        <div className="text-[10px] text-gray-400 mt-1">
                                            {new Date(n.createdAt).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsBell;
