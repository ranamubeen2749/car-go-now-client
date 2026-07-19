import React, { useCallback, useEffect, useRef, useState } from "react";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "motion/react";

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

const StatusBadge = ({ status, type = "status" }) => {
    const map = type === "payment" ? PAYMENT_COLORS : STATUS_COLORS;
    return (
        <span className={`px-3 py-1 text-xs rounded-full ${map[status] || "bg-gray-100 text-gray-600"}`}>
            {status?.replace(/_/g, " ") || "—"}
        </span>
    );
};

const fmtDate = (d) => (d ? String(d).split("T")[0] : "—");

const MyBookings = () => {
    const { axios, user, currency } = useAppContext();
    const [tab, setTab] = useState("car"); // "car" | "driver"
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchRequest = useRef(0);

    // Action modals
    const [proofTarget, setProofTarget] = useState(null);
    const [proofFile, setProofFile] = useState(null);
    const [reviewTarget, setReviewTarget] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [rateDriver, setRateDriver] = useState(false);

    const fetchBookings = useCallback(async () => {
        if (!user) return;
        const requestId = ++fetchRequest.current;
        setLoading(true);
        try {
            const endpoint =
                tab === "car"
                    ? "/api/bookings/car/my-bookings"
                    : "/api/bookings/driver/my-bookings";
            const { data } = await axios.get(endpoint);
            if (data.success && requestId === fetchRequest.current) {
                setBookings(data.bookings || []);
            } else if (!data.success) {
                toast.error(data.message || "Failed to load bookings");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            if (requestId === fetchRequest.current) setLoading(false);
        }
    }, [axios, user, tab]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleCancel = async (booking) => {
        if (!window.confirm("Cancel this booking?")) return;
        try {
            const endpoint =
                tab === "car" ? "/api/bookings/car/cancel" : "/api/bookings/driver/cancel";
            const { data } = await axios.post(endpoint, { bookingId: booking._id });
            if (data.success) {
                toast.success(data.message || "Booking cancelled");
                fetchBookings();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const handleUploadProof = async () => {
        if (!proofFile || !proofTarget) return;
        try {
            const formData = new FormData();
            formData.append("bookingId", proofTarget._id);
            formData.append("proof", proofFile);
            const endpoint =
                tab === "car"
                    ? "/api/bookings/car/upload-payment-proof"
                    : "/api/bookings/driver/upload-payment-proof";
            const { data } = await axios.post(endpoint, formData);
            if (data.success) {
                toast.success(data.message);
                setProofTarget(null);
                setProofFile(null);
                fetchBookings();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewTarget) return;
        try {
            const payload = { bookingId: reviewTarget._id, rating, comment };
            let endpoint;
            if (tab === "car") {
                endpoint = "/api/reviews/car";
                payload.rateDriver = rateDriver && reviewTarget.withDriver && !!reviewTarget.businessDriver;
            } else {
                endpoint = "/api/reviews/driver";
            }
            const { data } = await axios.post(endpoint, payload);
            if (data.success) {
                toast.success(data.message);
                setReviewTarget(null);
                setRating(5);
                setComment("");
                setRateDriver(false);
                fetchBookings();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    if (!user) {
        return (
            <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-16 text-sm">
                <Title title="My Bookings" subTitle="Please log in to see your bookings" align="left" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="px-6 md:px-16 lg:px-24 xl:px-32 2xl:px-48 mt-16 text-sm max-w-7xl"
        >
            <Title
                title="My Bookings"
                subTitle="View and manage all your car and driver bookings"
                align="left"
            />

            {/* Tabs */}
            <div className="flex gap-2 mt-6 border-b border-borderColor">
                <button
                    onClick={() => setTab("car")}
                    className={`px-4 py-2 text-sm border-b-2 ${
                        tab === "car"
                            ? "border-primary text-primary font-medium"
                            : "border-transparent text-gray-500"
                    }`}
                >
                    Car Bookings
                </button>
                <button
                    onClick={() => setTab("driver")}
                    className={`px-4 py-2 text-sm border-b-2 ${
                        tab === "driver"
                            ? "border-primary text-primary font-medium"
                            : "border-transparent text-gray-500"
                    }`}
                >
                    Driver Bookings
                </button>
            </div>

            <div>
                {loading && <p className="text-gray-500 mt-6">Loading…</p>}
                {!loading && bookings.length === 0 && (
                    <p className="text-gray-500 mt-6">No bookings yet.</p>
                )}

                {bookings.map((booking, index) => {
                    const isCar = tab === "car";
                    const subject = isCar ? booking.car : booking.independentDriver;
                    const carImage = isCar
                        ? booking.car?.images?.[0]?.url ||
                          booking.car?.attachments?.find?.((a) => a.category === "car_image")?.url
                        : null;
                    const startDate = isCar ? booking.pickupDate : booking.startDate;
                    const endDate = isCar ? booking.returnDate : booking.endDate;
                    const canCancel = ["awaiting_payment_proof", "pending", "confirmed"].includes(
                        booking.status
                    );
                    const proofExpired =
                        booking.paymentProofExpiresAt &&
                        new Date(booking.paymentProofExpiresAt).getTime() <= Date.now();
                    const canUploadProof =
                        !proofExpired &&
                        (booking.status === "awaiting_payment_proof" ||
                            (booking.paymentMethod === "prepaid" &&
                                booking.paymentStatus === "awaiting_proof"));
                    const canReview = booking.status === "completed";

                    return (
                        <motion.div
                            key={booking._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.4 }}
                            className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 border border-borderColor rounded-lg mt-5 first:mt-8"
                        >
                            {/* Subject (car or driver) */}
                            <div className="md:col-span-1">
                                {isCar ? (
                                    <>
                                        <div className="rounded-md overflow-hidden mb-3 bg-gray-100">
                                            {carImage ? (
                                                <img
                                                    src={carImage}
                                                    alt=""
                                                    className="w-full h-auto aspect-video object-cover"
                                                />
                                            ) : (
                                                <div className="aspect-video flex items-center justify-center text-gray-400 text-xs">
                                                    no image
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-lg font-medium mt-2">
                                            {subject?.brand} {subject?.model}
                                        </p>
                                        <p className="text-gray-500">
                                            {subject?.year} • {subject?.category} •{" "}
                                            {subject?.location}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="rounded-md bg-light p-4 text-center">
                                            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                {subject?.name?.[0] || "D"}
                                            </div>
                                            <p className="text-lg font-medium mt-3">
                                                {subject?.name}
                                            </p>
                                            <p className="text-gray-500 text-sm">
                                                {subject?.city}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Booking Info */}
                            <div className="md:col-span-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="px-3 py-1.5 bg-light rounded">
                                        Booking #{index + 1}
                                    </p>
                                    <StatusBadge status={booking.status} />
                                    <StatusBadge status={booking.paymentStatus} type="payment" />
                                    <span className="text-xs text-gray-500">
                                        {booking.paymentMethod}
                                    </span>
                                </div>

                                <div className="flex items-start gap-2 mt-3">
                                    <img
                                        src={assets.calendar_icon_colored}
                                        alt=""
                                        className="w-4 h-4 mt-1"
                                    />
                                    <div>
                                        <p className="text-gray-500">
                                            {isCar ? "Rental Period" : "Hire Period"}
                                        </p>
                                        <p>
                                            {fmtDate(startDate)} → {fmtDate(endDate)}
                                            {isCar && booking.pickupTime && (
                                                <span className="text-gray-500 text-xs ml-2">
                                                    at {booking.pickupTime}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {isCar && (
                                    <>
                                        <div className="flex items-start gap-2 mt-3">
                                            <img
                                                src={assets.location_icon_colored}
                                                alt=""
                                                className="w-4 h-4 mt-1"
                                            />
                                            <div>
                                                <p className="text-gray-500">Pick-up Location</p>
                                                <p>{booking.car?.location || "—"}</p>
                                            </div>
                                        </div>
                                        {booking.withDriver && (
                                            <p className="mt-3 text-gray-600">
                                                Driver:{" "}
                                                <span className="font-medium">
                                                    {booking.businessDriver?.name ||
                                                        "Not assigned yet"}
                                                </span>
                                                {booking.businessDriver?.isOwnerSelf && " (owner)"}
                                            </p>
                                        )}
                                    </>
                                )}

                                {booking.payment_proof?.url && (
                                    <a
                                        href={booking.payment_proof.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-block text-xs text-primary underline mt-3"
                                    >
                                        View uploaded payment proof
                                    </a>
                                )}
                                {canUploadProof && booking.paymentProofExpiresAt && (
                                    <p className="mt-3 text-xs text-amber-700">
                                        Upload payment proof by{" "}
                                        {new Date(
                                            booking.paymentProofExpiresAt
                                        ).toLocaleString()}
                                        .
                                    </p>
                                )}
                                {proofExpired && booking.status === "awaiting_payment_proof" && (
                                    <p className="mt-3 text-xs text-red-600">
                                        The payment-proof upload window has expired.
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {canUploadProof && (
                                        <button
                                            onClick={() => setProofTarget(booking)}
                                            className="px-3 py-1.5 bg-primary text-white text-xs rounded-md"
                                        >
                                            Upload payment proof
                                        </button>
                                    )}
                                    {canCancel && (
                                        <button
                                            onClick={() => handleCancel(booking)}
                                            className="px-3 py-1.5 border border-borderColor text-xs rounded-md"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    {canReview && (
                                        <button
                                            onClick={() => setReviewTarget(booking)}
                                            className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded-md"
                                        >
                                            Leave review
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="md:col-span-1 flex flex-col justify-between gap-6">
                                <div className="text-sm text-gray-500 text-right">
                                    <p>Total Price</p>
                                    <h1 className="text-2xl font-semibold text-primary">
                                        {currency}
                                        {booking.price}
                                    </h1>
                                    <p>Booked on {fmtDate(booking.createdAt)}</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Upload proof modal */}
            {proofTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setProofTarget(null)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-semibold mb-2">Upload payment proof</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Upload a screenshot of your bank transfer. The super admin will review
                            and verify it.
                        </p>
                        {proofTarget.paymentProofExpiresAt && (
                            <p className="text-sm text-amber-700 mb-4">
                                Upload by{" "}
                                {new Date(proofTarget.paymentProofExpiresAt).toLocaleString()}.
                            </p>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setProofFile(e.target.files[0])}
                            className="w-full border border-borderColor rounded-md p-2 text-sm mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setProofTarget(null);
                                    setProofFile(null);
                                }}
                                className="flex-1 border border-borderColor rounded-md py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!proofFile}
                                onClick={handleUploadProof}
                                className="flex-1 bg-primary text-white rounded-md py-2 text-sm disabled:opacity-60"
                            >
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review modal */}
            {reviewTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setReviewTarget(null)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-semibold mb-2">Leave a review</h2>
                        <label className="block text-sm mb-1">Rating</label>
                        <div className="flex gap-1 mb-4">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setRating(n)}
                                    className={`w-8 h-8 rounded-full ${
                                        rating >= n
                                            ? "bg-amber-400 text-white"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                        <label className="block text-sm mb-1">Comment</label>
                        <textarea
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full border border-borderColor rounded-md p-2 text-sm mb-4"
                        />
                        {tab === "car" &&
                            reviewTarget.withDriver &&
                            reviewTarget.businessDriver && (
                                <label className="flex items-center gap-2 text-sm mb-4">
                                    <input
                                        type="checkbox"
                                        checked={rateDriver}
                                        onChange={(e) => setRateDriver(e.target.checked)}
                                    />
                                    Also rate the assigned driver (
                                    {reviewTarget.businessDriver.name})
                                </label>
                            )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setReviewTarget(null)}
                                className="flex-1 border border-borderColor rounded-md py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                className="flex-1 bg-primary text-white rounded-md py-2 text-sm"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default MyBookings;
