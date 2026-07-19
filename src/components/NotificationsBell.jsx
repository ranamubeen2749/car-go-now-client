import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const TYPE_LINK = (entityType, currentRole) => {
    const isAdmin = currentRole === "super_admin";
    const isOwner = currentRole === "business_owner";
    const isDriver = currentRole === "independent_driver";

    switch (entityType) {
        case "car_booking":
            if (isAdmin) return "/admin/verifications/booking-payments";
            if (isOwner) return "/owner/manage-bookings";
            return "/my-bookings";
        case "driver_booking":
            if (isAdmin) return "/admin/verifications/booking-payments";
            if (isDriver) return "/driver/bookings";
            return "/my-bookings";
        case "platform_fee":
            if (isAdmin) return "/admin/fees";
            if (isOwner) return "/owner/fees";
            if (isDriver) return "/driver/fees";
            return null;
        case "car":
            if (isAdmin) return "/admin/verifications/cars";
            if (isOwner) return "/owner/manage-cars";
            return null;
        case "business_driver":
            if (isAdmin) return "/admin/verifications/business-drivers";
            if (isOwner) return "/owner/business-drivers";
            return null;
        case "independent_driver":
            if (isAdmin) return "/admin/verifications/independent-drivers";
            if (isDriver) return "/driver/profile";
            return null;
        case "user":
            if (isAdmin) return "/admin/verifications/renter-licenses";
            return "/account/license";
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
    const { axios, user, currentRole } = useAppContext();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const close = (event) => {
            if (event.key === "Escape") setOpen(false);
            if (
                event.type === "mousedown" &&
                ref.current &&
                !ref.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", close);
        document.addEventListener("keydown", close);
        return () => {
            document.removeEventListener("mousedown", close);
            document.removeEventListener("keydown", close);
        };
    }, []);

    const fetchUnread = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await axios.get("/api/notifications/unread-count");
            if (data?.success) setUnread(data.unreadCount || 0);
        } catch {
            // Keep the bell mounted so a temporary API failure can recover on the next poll.
        }
    }, [axios, user]);

    const fetchList = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data } = await axios.get("/api/notifications", {
                params: { limit: 15 },
            });
            if (data?.success) {
                setItems(data.notifications || []);
                setUnread(data.unreadCount || 0);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load notifications");
        } finally {
            setLoading(false);
        }
    }, [axios, user]);

    useEffect(() => {
        if (!user) return;
        fetchUnread();
        const id = setInterval(fetchUnread, 30000);
        return () => clearInterval(id);
    }, [user, fetchUnread]);

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

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="ui-icon-button relative"
                title="Notifications"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                aria-expanded={open}
                aria-haspopup="dialog"
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
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>
            {open && (
                <div
                    role="dialog"
                    aria-label="Notifications"
                    className="fixed inset-x-4 top-20 z-50 overflow-hidden rounded-2xl border border-borderColor bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96"
                >
                    <div className="flex min-h-13 items-center justify-between border-b border-borderColor px-4">
                        <div>
                            <div className="text-sm font-semibold text-ink">Notifications</div>
                            <div className="text-[11px] text-muted">
                                {unread ? `${unread} unread` : "You are all caught up"}
                            </div>
                        </div>
                        {items.some((n) => !n.isRead) && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/8"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    {loading ? (
                        <div className="p-6 text-center text-sm text-muted" role="status">
                            Loading…
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-muted">
                                <BellIcon />
                            </div>
                            <p className="mt-3 text-sm font-semibold text-ink">No notifications</p>
                            <p className="mt-1 text-xs text-muted">
                                Booking and account updates will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-[min(60vh,28rem)] overflow-auto">
                            {items.map((n) => {
                                const link = TYPE_LINK(n.entityType, currentRole);
                                const content = (
                                    <div
                                        className={`border-b border-borderColor px-4 py-3 text-sm last:border-b-0 ${
                                            n.isRead
                                                ? "text-muted hover:bg-slate-50"
                                                : "bg-primary/[0.045] text-ink hover:bg-primary/[0.07]"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span
                                                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                                    n.isRead ? "bg-slate-200" : "bg-primary"
                                                }`}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className={n.isRead ? "" : "font-semibold"}>
                                                    {n.title || "Notification"}
                                                </div>
                                                {n.body && (
                                                    <div className="mt-0.5 text-xs leading-5 text-muted">
                                                        {n.body}
                                                    </div>
                                                )}
                                                <div className="mt-1 text-[11px] text-slate-400">
                                                    {fmtRel(n.createdAt)}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    removeOne(n._id);
                                                }}
                                                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"
                                                title="Delete"
                                                aria-label={`Delete ${n.title || "notification"}`}
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

const BellIcon = () => (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);
