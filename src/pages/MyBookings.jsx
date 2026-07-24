import React, { useCallback, useEffect, useRef, useState } from "react";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "motion/react";
import PageState from "../components/PageState";

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
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${map[status] || "bg-gray-100 text-gray-600"}`}>
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
    const [submittingReview, setSubmittingReview] = useState(false);

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
        setSubmittingReview(true);
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
        } finally {
            setSubmittingReview(false);
        }
    };

    if (!user) {
        return (
            <main className="min-h-[65vh] bg-light px-6 py-14 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-7xl">
                    <Title
                        title="My Bookings"
                        subTitle="Please log in to see your bookings"
                        align="left"
                    />
                </div>
            </main>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen bg-light px-6 py-14 text-sm sm:px-8 lg:px-12"
        >
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <Title
                        eyebrow="Your trips"
                        title="My Bookings"
                        subTitle="View and manage all your car and driver bookings"
                        align="left"
                    />
                    <p className="text-sm text-muted">
                        {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
                    </p>
                </div>

            {/* Tabs */}
            <div className="mt-8 inline-flex rounded-xl bg-slate-200/70 p-1">
                <button
                    type="button"
                    onClick={() => setTab("car")}
                    className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition ${
                        tab === "car"
                            ? "bg-white text-primary shadow-sm"
                            : "text-slate-500 hover:text-ink"
                    }`}
                >
                    Car Bookings
                </button>
                <button
                    type="button"
                    onClick={() => setTab("driver")}
                    className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition ${
                        tab === "driver"
                            ? "bg-white text-primary shadow-sm"
                            : "text-slate-500 hover:text-ink"
                    }`}
                >
                    Driver Bookings
                </button>
            </div>

            <div>
                {loading && (
                    <div className="ui-card mt-6">
                        <PageState
                            compact
                            loading
                            title="Loading your bookings"
                            description="Getting the latest booking and payment status…"
                        />
                    </div>
                )}
                {!loading && bookings.length === 0 && (
                    <div className="ui-card mt-6 p-12 text-center">
                        <p className="text-lg font-semibold text-ink">No bookings yet</p>
                        <p className="mt-2 text-sm text-muted">
                            Your car and driver bookings will appear here.
                        </p>
                    </div>
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
                    const canReview = booking.status === "completed" && !booking.reviewed;
                    const rejectionReason =
                        booking.rejectionReason ||
                        (booking.status === "rejected" ? booking.description : "");

                    return (
                        <motion.div
                            key={booking._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.4 }}
                            className="ui-card mt-5 grid grid-cols-1 gap-6 overflow-hidden p-5 first:mt-8 md:grid-cols-[220px_minmax(0,1fr)_150px] md:p-6"
                        >
                            {/* Subject (car or driver) */}
                            <div>
                                {isCar ? (
                                    <>
                                        <div className="overflow-hidden rounded-2xl bg-slate-100">
                                            {carImage ? (
                                                <img
                                                    src={carImage}
                                                    alt={`${subject?.brand || ""} ${subject?.model || ""}`}
                                                    className="aspect-[16/10] h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="grid aspect-[16/10] place-items-center text-xs text-muted">
                                                    No image
                                                </div>
                                            )}
                                        </div>
                                        <p className="mt-3 text-lg font-semibold text-ink">
                                            {subject?.brand} {subject?.model}
                                        </p>
                                        <p className="mt-1 text-sm text-muted">
                                            {subject?.year} • {subject?.category} •{" "}
                                            {subject?.location}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 p-5 text-center">
                                            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary text-xl font-semibold text-white shadow-lg shadow-primary/20">
                                                {subject?.name?.[0] || "D"}
                                            </div>
                                            <p className="mt-3 text-lg font-semibold text-ink">
                                                {subject?.name}
                                            </p>
                                            <p className="mt-1 text-sm text-muted">
                                                {subject?.city}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Booking Info */}
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                        Booking #{index + 1}
                                    </p>
                                    <StatusBadge status={booking.status} />
                                    <StatusBadge status={booking.paymentStatus} type="payment" />
                                    <span className="text-xs capitalize text-muted">
                                        {booking.paymentMethod}
                                    </span>
                                </div>

                                <div className="mt-5 flex items-start gap-3">
                                    <img
                                        src={assets.calendar_icon_colored}
                                        alt=""
                                        className="mt-1 h-4 w-4"
                                    />
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                            {isCar ? "Rental Period" : "Hire Period"}
                                        </p>
                                        <p className="mt-1 font-medium text-ink">
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
                                {booking.status === "rejected" && rejectionReason && (
                                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                                        <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                                            Rejection reason
                                        </p>
                                        <p className="mt-1 text-sm leading-6 text-red-700">
                                            {rejectionReason}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {canUploadProof && (
                                        <button
                                            type="button"
                                            onClick={() => setProofTarget(booking)}
                                            className="ui-button min-h-9 px-3 py-1 text-xs"
                                        >
                                            Upload payment proof
                                        </button>
                                    )}
                                    {canCancel && (
                                        <button
                                            type="button"
                                            onClick={() => handleCancel(booking)}
                                            className="ui-button ui-button-secondary min-h-9 px-3 py-1 text-xs"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    {canReview && (
                                        <button
                                            type="button"
                                            onClick={() => setReviewTarget(booking)}
                                            className="inline-flex min-h-9 items-center rounded-xl bg-amber-500 px-3 text-xs font-semibold text-white hover:bg-amber-600"
                                        >
                                            Leave review
                                        </button>
                                    )}
                                    {booking.status === "completed" && booking.reviewed && (
                                        <span className="inline-flex min-h-9 items-center rounded-xl bg-emerald-100 px-3 text-xs font-semibold text-emerald-700">
                                            Review submitted
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="border-t border-borderColor pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                                <div className="text-sm text-muted md:text-right">
                                    <p className="text-xs font-semibold uppercase tracking-wide">
                                        Total price
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold text-ink">
                                        {currency}
                                        {booking.price}
                                    </p>
                                    <p className="mt-2 text-xs">
                                        Booked {fmtDate(booking.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Upload proof modal */}
            {proofTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
                    onClick={() => setProofTarget(null)}
                >
                    <div
                        className="ui-card w-full max-w-md p-6 sm:p-7"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                            Bank transfer
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-ink">
                            Upload payment proof
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-muted">
                            Upload a screenshot of your bank transfer. The super admin will review
                            and verify it.
                        </p>
                        {proofTarget.paymentProofExpiresAt && (
                            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                                Upload by{" "}
                                {new Date(proofTarget.paymentProofExpiresAt).toLocaleString()}.
                            </p>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setProofFile(e.target.files[0])}
                            className="ui-field mt-5 text-sm"
                        />
                        <div className="mt-5 flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setProofTarget(null);
                                    setProofFile(null);
                                }}
                                className="ui-button ui-button-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!proofFile}
                                onClick={handleUploadProof}
                                className="ui-button flex-1 disabled:opacity-60"
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
                    onClick={() => setReviewTarget(null)}
                >
                    <div
                        className="ui-card w-full max-w-md p-6 sm:p-7"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                            Share your experience
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-ink">Leave a review</h2>
                        <label className="mt-5 block text-sm font-semibold text-slate-700">
                            Rating
                        </label>
                        <div className="mt-2 flex gap-2">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setRating(n)}
                                    className={`h-9 w-9 rounded-xl font-semibold ${
                                        rating >= n
                                            ? "bg-amber-400 text-white"
                                            : "bg-slate-100 text-muted"
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                        <label className="mt-5 block text-sm font-semibold text-slate-700">
                            Comment
                        </label>
                        <textarea
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="ui-field mt-1.5 min-h-24 resize-y"
                        />
                        {tab === "car" &&
                            reviewTarget.withDriver &&
                            reviewTarget.businessDriver && (
                                <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={rateDriver}
                                        onChange={(e) => setRateDriver(e.target.checked)}
                                    />
                                    Also rate the assigned driver (
                                    {reviewTarget.businessDriver.name})
                                </label>
                            )}
                        <div className="mt-5 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setReviewTarget(null)}
                                className="ui-button ui-button-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitReview}
                                disabled={submittingReview}
                                className="ui-button flex-1 disabled:opacity-60"
                            >
                                {submittingReview ? "Submitting…" : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </motion.div>
    );
};

export default MyBookings;
