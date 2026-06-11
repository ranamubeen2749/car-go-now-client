import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const TYPE_LINK = (n) => {
    switch (n.entityType) {
        case "car_booking":
            return "/my-bookings";
        case "driver_booking":
            return "/my-bookings";
        case "platform_fee":
            return null;
        default:
            return null;
    }
};

const fmtRel = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
};

const NotificationsBell = () => {
    const { axios, user } = useAppContext();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const [supported, setSupported] = useState(true);
    const ref = useRef(null);

    useEffect(() => {
        const close = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const fetchUnread = useCallback(async () => {
        if (!user || !supported) return;
        try {
            const { data } = await axios.get("/api/notifications/unread-count");
            if (data?.success) setUnread(data.unreadCount || 0);
        } catch (e) {
            if (e?.response?.status === 404) setSupported(false);
        }
    }, [axios, user, supported]);

    const fetchList = useCallback(async () => {
        if (!user || !supported) return;
        setLoading(true);
        try {
            const { data } = await axios.get("/api/notifications", {
                params: { limit: 15 },
            });
            if (data?.success) {
                setItems(data.notifications || []);
                setUnread(data.unreadCount || 0);
            } else {
                setSupported(false);
            }
        } catch (e) {
            if (e?.response?.status === 404) setSupported(false);
        } finally {
            setLoading(false);
        }
    }, [axios, user, supported]);

    useEffect(() => {
        if (!user || !supported) return;
        fetchUnread();
        const id = setInterval(fetchUnread, 30000);
        return () => clearInterval(id);
    }, [user, supported, fetchUnread]);

    useEffect(() => {
        if (open) fetchList();
    }, [open, fetchList]);

    const markRead = async (id) => {
        try {
            const { data } = await axios.put(`/api/notifications/${id}/read`);
            if (data?.success) {
                setItems((prev) =>
                    prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
                );
                setUnread((u) => Math.max(0, u - 1));
            }
        } catch {
            // silent
        }
    };

    const markAllRead = async () => {
        try {
            const { data } = await axios.put("/api/notifications/mark-all-read");
            if (data?.success) {
                setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
                setUnread(0);
                toast.success("All marked as read");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const removeOne = async (id) => {
        try {
            const { data } = await axios.delete(`/api/notifications/${id}`);
            if (data?.success) {
                setItems((prev) => prev.filter((n) => n._id !== id));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    if (!user) return null;
    if (!supported) return null;

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
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-borderColor rounded-md shadow-lg z-50">
                    <div className="px-4 py-2 border-b border-borderColor flex items-center justify-between">
                        <div className="text-sm font-medium">Notifications</div>
                        {items.some((n) => !n.isRead) && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-primary hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    {loading ? (
                        <div className="p-4 text-xs text-gray-500">Loading…</div>
                    ) : items.length === 0 ? (
                        <div className="p-4 text-xs text-gray-500">No notifications.</div>
                    ) : (
                        <div className="max-h-96 overflow-auto">
                            {items.map((n) => {
                                const link = TYPE_LINK(n);
                                const content = (
                                    <div
                                        className={`px-4 py-3 text-sm border-b border-borderColor last:border-b-0 ${
                                            n.isRead ? "text-gray-500" : "bg-blue-50/40"
                                        }`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1">
                                                <div className={n.isRead ? "" : "font-medium"}>
                                                    {n.title || "Notification"}
                                                </div>
                                                {n.body && (
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        {n.body}
                                                    </div>
                                                )}
                                                <div className="text-[10px] text-gray-400 mt-1">
                                                    {fmtRel(n.createdAt)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    removeOne(n._id);
                                                }}
                                                className="text-gray-300 hover:text-red-500 text-xs"
                                                title="Delete"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                );
                                if (link) {
                                    return (
                                        <Link
                                            key={n._id}
                                            to={link}
                                            onClick={() => {
                                                if (!n.isRead) markRead(n._id);
                                                setOpen(false);
                                            }}
                                            className="block"
                                        >
                                            {content}
                                        </Link>
                                    );
                                }
                                return (
                                    <div
                                        key={n._id}
                                        onClick={() => !n.isRead && markRead(n._id)}
                                        className="cursor-pointer"
                                    >
                                        {content}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsBell;
