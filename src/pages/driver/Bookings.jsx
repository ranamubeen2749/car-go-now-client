import React, { useEffect, useState } from "react";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const STATUSES = [
    "",
    "awaiting_payment_proof",
    "pending",
    "confirmed",
    "rejected",
    "completed",
    "cancelled",
];

const STATUS_COLORS = {
    awaiting_payment_proof: "bg-amber-100 text-amber-700",
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-gray-200 text-gray-600",
};

const PAYMENT_COLORS = {
    unpaid: "bg-gray-200 text-gray-600",
    awaiting_proof: "bg-amber-100 text-amber-700",
    pending_verification: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
};

const fmtDate = (d) => (d ? String(d).split("T")[0] : "—");

const Bookings = () => {
    const { axios, currency } = useAppContext();
    const [bookings, setBookings] = useState([]);
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(false);

    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [proofLightbox, setProofLightbox] = useState(null);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const { data } = await axios.get("/api/bookings/driver-manage", { params });
            if (data.success) setBookings(data.bookings);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [statusFilter]);

    const handleConfirm = async (booking) => {
        if (booking.paymentMethod === "prepaid" && booking.paymentStatus !== "paid") {
            toast.error("Payment not yet verified by admin");
            return;
        }
        try {
            const { data } = await axios.post("/api/bookings/driver-manage/confirm", {
                bookingId: booking._id,
            });
            if (data.success) {
                toast.success(data.message);
                fetchBookings();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        if (!rejectReason.trim()) {
            toast.error("Reason is required");
            return;
        }
        try {
            const { data } = await axios.post("/api/bookings/driver-manage/reject", {
                bookingId: rejectTarget._id,
                reason: rejectReason.trim(),
            });
            if (data.success) {
                toast.success(data.message);
                setRejectTarget(null);
                setRejectReason("");
                fetchBookings();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const handleComplete = async (booking) => {
        try {
            const { data } = await axios.post("/api/bookings/driver-manage/complete", {
                bookingId: booking._id,
            });
            if (data.success) {
                toast.success(data.message);
                fetchBookings();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    return (
        <div className="px-4 pt-10 md:px-10 w-full">
            <Title
                title="My Bookings"
                subTitle="Incoming hire requests. Confirm or reject; complete after the engagement."
            />

            <div className="flex items-center gap-3 mt-6">
                <label className="text-sm text-gray-500">Filter</label>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-borderColor rounded-md px-2 py-1.5 text-sm"
                >
                    {STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {s ? s.replace(/_/g, " ") : "All"}
                        </option>
                    ))}
                </select>
                {loading && <span className="text-xs text-gray-500">Loading…</span>}
            </div>

            <div className="max-w-5xl w-full rounded-md overflow-hidden border border-borderColor mt-4">
                <table className="w-full border-collapse text-left text-sm text-gray-600">
                    <thead className="text-gray-500 bg-light">
                        <tr>
                            <th className="p-3 font-medium">Customer</th>
                            <th className="p-3 font-medium">Dates</th>
                            <th className="p-3 font-medium">Total</th>
                            <th className="p-3 font-medium max-md:hidden">Payment</th>
                            <th className="p-3 font-medium">Status</th>
                            <th className="p-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-6 text-center text-gray-500">
                                    No bookings.
                                </td>
                            </tr>
                        )}
                        {bookings.map((booking) => (
                            <tr key={booking._id} className="border-t border-borderColor">
                                <td className="p-3 text-xs">
                                    <p className="font-medium">{booking.user?.name}</p>
                                    <p className="text-gray-500">{booking.user?.email}</p>
                                </td>
                                <td className="p-3 text-xs">
                                    {fmtDate(booking.startDate)} → {fmtDate(booking.endDate)}
                                </td>
                                <td className="p-3">
                                    {currency}
                                    {booking.price}
                                </td>
                                <td className="p-3 max-md:hidden text-xs">
                                    <span
                                        className={`px-2 py-0.5 rounded-full ${
                                            PAYMENT_COLORS[booking.paymentStatus] ||
                                            "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                        {booking.paymentMethod} ·{" "}
                                        {booking.paymentStatus?.replace(/_/g, " ")}
                                    </span>
                                    {booking.payment_proof?.url && (
                                        <button
                                            onClick={() =>
                                                setProofLightbox(booking.payment_proof.url)
                                            }
                                            className="block text-primary text-xs underline mt-1"
                                        >
                                            View proof
                                        </button>
                                    )}
                                </td>
                                <td className="p-3 text-xs">
                                    <span
                                        className={`px-2 py-0.5 rounded-full ${
                                            STATUS_COLORS[booking.status] ||
                                            "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                        {booking.status?.replace(/_/g, " ")}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {booking.status === "pending" && (
                                            <>
                                                <button
                                                    onClick={() => handleConfirm(booking)}
                                                    className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setRejectTarget(booking);
                                                        setRejectReason("");
                                                    }}
                                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {booking.status === "confirmed" && (
                                            <button
                                                onClick={() => handleComplete(booking)}
                                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                                            >
                                                Complete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {rejectTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setRejectTarget(null)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold mb-2">Reject Booking</h2>
                        <textarea
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason"
                            className="w-full border border-borderColor rounded-md p-2 text-sm mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRejectTarget(null)}
                                className="flex-1 border border-borderColor rounded-md py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {proofLightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setProofLightbox(null)}
                >
                    <img
                        src={proofLightbox}
                        alt="payment proof"
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded"
                    />
                </div>
            )}
        </div>
    );
};

export default Bookings;
