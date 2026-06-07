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

const ManageBookings = () => {
    const { currency, axios } = useAppContext();
    const [bookings, setBookings] = useState([]);
    const [statusFilter, setStatusFilter] = useState("");
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [confirmTarget, setConfirmTarget] = useState(null);
    const [selectedDriverId, setSelectedDriverId] = useState("");
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [proofLightbox, setProofLightbox] = useState(null);

    const fetchOwnerBookings = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const { data } = await axios.get("/api/bookings/owner", { params });
            if (data.success) setBookings(data.bookings);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchDrivers = async () => {
        try {
            const { data } = await axios.get("/api/business-driver/list");
            if (data.success) setDrivers(data.drivers);
        } catch (error) {
            // Don't toast every load; will toast when actually needed
            console.error("fetchDrivers error", error);
        }
    };

    useEffect(() => {
        fetchOwnerBookings();
    }, [statusFilter]);

    useEffect(() => {
        fetchDrivers();
    }, []);

    const handleOpenConfirm = (booking) => {
        if (booking.paymentMethod === "prepaid" && booking.paymentStatus !== "paid") {
            toast.error("Cannot confirm — payment is not yet verified by admin");
            return;
        }
        setConfirmTarget(booking);
        setSelectedDriverId("");
    };

    const handleConfirm = async () => {
        if (!confirmTarget) return;
        const payload = { bookingId: confirmTarget._id };
        if (confirmTarget.withDriver) {
            if (!selectedDriverId) {
                toast.error("Select a driver");
                return;
            }
            payload.driverId = selectedDriverId;
        }
        try {
            const { data } = await axios.post("/api/bookings/owner/confirm", payload);
            if (data.success) {
                toast.success(data.message);
                setConfirmTarget(null);
                fetchOwnerBookings();
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
            const { data } = await axios.post("/api/bookings/owner/reject", {
                bookingId: rejectTarget._id,
                reason: rejectReason.trim(),
            });
            if (data.success) {
                toast.success(data.message);
                setRejectTarget(null);
                setRejectReason("");
                fetchOwnerBookings();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const markPickedUp = async (booking) => {
        try {
            const { data } = await axios.post("/api/bookings/owner/picked-up", {
                bookingId: booking._id,
            });
            if (data.success) {
                toast.success(data.message);
                fetchOwnerBookings();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const markCompleted = async (booking) => {
        try {
            const { data } = await axios.post("/api/bookings/owner/complete", {
                bookingId: booking._id,
            });
            if (data.success) {
                toast.success(data.message);
                fetchOwnerBookings();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const approvedDrivers = drivers.filter(
        (d) => d.status === "active" && d.verification_status === "approved"
    );

    return (
        <div className="px-4 pt-10 md:px-10 w-full">
            <Title
                title="Manage Bookings"
                subTitle="Confirm or reject requests, assign drivers, and track booking lifecycle."
            />

            <div className="flex items-center gap-3 mt-6">
                <label className="text-sm text-gray-500">Filter by status</label>
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

            <div className="max-w-6xl w-full rounded-md overflow-hidden border border-borderColor mt-4">
                <table className="w-full border-collapse text-left text-sm text-gray-600">
                    <thead className="text-gray-500 bg-light">
                        <tr>
                            <th className="p-3 font-medium">Car</th>
                            <th className="p-3 font-medium max-md:hidden">Customer</th>
                            <th className="p-3 font-medium max-md:hidden">Dates</th>
                            <th className="p-3 font-medium">Total</th>
                            <th className="p-3 font-medium max-md:hidden">Payment</th>
                            <th className="p-3 font-medium">Status</th>
                            <th className="p-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-6 text-center text-gray-500">
                                    No bookings.
                                </td>
                            </tr>
                        )}
                        {bookings.map((booking) => {
                            const carImage =
                                booking.car?.images?.[0]?.url ||
                                booking.car?.attachments?.find?.(
                                    (a) => a.category === "car_image"
                                )?.url;
                            return (
                                <tr key={booking._id} className="border-t border-borderColor">
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            {carImage ? (
                                                <img
                                                    src={carImage}
                                                    alt=""
                                                    className="h-12 w-12 aspect-square rounded-md object-cover"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-md bg-gray-100" />
                                            )}
                                            <div className="max-md:hidden text-xs">
                                                <p className="font-medium">
                                                    {booking.car?.brand} {booking.car?.model}
                                                </p>
                                                <p className="text-gray-500">
                                                    {booking.withDriver
                                                        ? "with driver"
                                                        : "self-drive"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 max-md:hidden text-xs">
                                        <p className="font-medium">{booking.user?.name}</p>
                                        <p className="text-gray-500">{booking.user?.email}</p>
                                    </td>
                                    <td className="p-3 max-md:hidden text-xs">
                                        {fmtDate(booking.pickupDate)} →{" "}
                                        {fmtDate(booking.returnDate)}
                                        <br />
                                        <span className="text-gray-500">
                                            at {booking.pickupTime}
                                        </span>
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
                                                        onClick={() => handleOpenConfirm(booking)}
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
                                            {booking.status === "confirmed" &&
                                                !booking.pickedUpAt && (
                                                    <button
                                                        onClick={() => markPickedUp(booking)}
                                                        className="px-2 py-1 bg-amber-500 text-white rounded text-xs"
                                                    >
                                                        Picked up
                                                    </button>
                                                )}
                                            {booking.status === "confirmed" && (
                                                <button
                                                    onClick={() => markCompleted(booking)}
                                                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                                                >
                                                    Complete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Confirm modal */}
            {confirmTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setConfirmTarget(null)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold mb-2">Confirm Booking</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {confirmTarget.car?.brand} {confirmTarget.car?.model} for{" "}
                            {confirmTarget.user?.name}.
                        </p>
                        {confirmTarget.withDriver ? (
                            <>
                                <label className="block text-sm mb-1">Assign a driver</label>
                                <select
                                    value={selectedDriverId}
                                    onChange={(e) => setSelectedDriverId(e.target.value)}
                                    className="w-full border border-borderColor rounded-md p-2 text-sm mb-4"
                                >
                                    <option value="">Select a driver…</option>
                                    {approvedDrivers.map((d) => (
                                        <option key={d._id} value={d._id}>
                                            {d.name}
                                            {d.isOwnerSelf ? " (you)" : ""} — {d.phone}
                                        </option>
                                    ))}
                                </select>
                                {approvedDrivers.length === 0 && (
                                    <p className="text-xs text-amber-600 mb-4">
                                        No approved drivers. Add one in Business Drivers first.
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-xs text-gray-500 mb-4">
                                Self-drive booking — no driver assignment required.
                            </p>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmTarget(null)}
                                className="flex-1 border border-borderColor rounded-md py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 bg-primary text-white rounded-md py-2 text-sm"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject modal */}
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
                        <p className="text-sm text-gray-500 mb-4">
                            Provide a reason. The customer will see this in their booking.
                        </p>
                        <textarea
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full border border-borderColor rounded-md p-2 text-sm mb-4"
                            placeholder="Reason for rejection"
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

            {/* Proof lightbox */}
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

export default ManageBookings;
