import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "motion/react";
import BookingAvailability from "../components/BookingAvailability";
import {
    nextDate,
    useBookingAvailability
} from "../hooks/useBookingAvailability";

const DriverDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { axios, user, openLogin, currency } = useAppContext();

    const [driver, setDriver] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [description, setDescription] = useState("");

    const [createdBooking, setCreatedBooking] = useState(null);
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [proofFile, setProofFile] = useState(null);
    const [uploadingProof, setUploadingProof] = useState(false);
    const availability = useBookingAvailability({
        endpoint: `/api/bookings/driver/${id}/availability`,
        startDate,
        endDate
    });

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [driverRes, reviewsRes] = await Promise.all([
                    // Single-driver fetch endpoint isn't documented; reuse listings filter or
                    // ask backend later. For now we use listings with a generous limit and
                    // find by id.
                    axios.get("/api/driver/listings", { params: { limit: 100 } }),
                    axios.get(`/api/reviews/driver/${id}`).catch(() => null),
                ]);
                if (driverRes.data?.success) {
                    const found = driverRes.data.drivers.find((d) => d._id === id);
                    setDriver(found || null);
                }
                if (reviewsRes && reviewsRes.data?.success) {
                    setReviews(reviewsRes.data.reviews || []);
                }
            } catch (error) {
                toast.error(error.response?.data?.message || error.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, axios]);

    const numDays = useMemo(() => {
        if (!startDate || !endDate) return 0;
        const diff = Math.ceil(
            (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
        );
        return diff > 0 ? diff : 1;
    }, [startDate, endDate]);

    const totalPrice = numDays && driver ? numDays * driver.pricePerDay : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            openLogin("login", "customer");
            return;
        }
        if (user.currentRole !== "customer") {
            toast.error("Switch to your customer role to book a driver");
            return;
        }
        if (!startDate || !endDate) {
            toast.error("Pick start and end dates");
            return;
        }
        if (availability.invalidRange || availability.conflict) {
            toast.error("Please choose an available date range");
            return;
        }
        setSubmitting(true);
        try {
            const { data } = await axios.post("/api/bookings/driver/create", {
                driverId: id,
                startDate,
                endDate,
                paymentMethod,
                description,
            });
            if (data.success) {
                toast.success(data.message || "Hire request sent");
                if (paymentMethod === "prepaid" && data.paymentDetails) {
                    setCreatedBooking(data.booking);
                    setPaymentDetails(data.paymentDetails);
                } else {
                    navigate("/my-bookings");
                }
            } else {
                toast.error(data.message);
                if (/already booked/i.test(data.message || "")) {
                    availability.refresh();
                }
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            toast.error(msg);
            if (/bank/i.test(msg) && paymentMethod === "prepaid") {
                setPaymentMethod("cash");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleUploadProof = async () => {
        if (!proofFile || !createdBooking) return;
        setUploadingProof(true);
        try {
            const formData = new FormData();
            formData.append("bookingId", createdBooking._id);
            formData.append("proof", proofFile);
            const { data } = await axios.post(
                "/api/bookings/driver/upload-payment-proof",
                formData
            );
            if (data.success) {
                toast.success(data.message);
                navigate("/my-bookings");
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setUploadingProof(false);
        }
    };

    if (loading) return <Loader />;
    if (!driver) return <div className="text-center py-20">Driver not found</div>;

    return (
        <main className="min-h-screen bg-light px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
            <div className="mx-auto max-w-7xl">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="ui-button ui-button-secondary mb-7"
            >
                <img src={assets.arrow_icon} alt="" className="rotate-180 opacity-65" />
                Back to all drivers
            </button>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="ui-card min-w-0 p-6 sm:p-8"
                >
                    <div className="flex items-center gap-4">
                        {driver.avatar?.url ? (
                            <img
                                src={driver.avatar.url}
                                alt={driver.name}
                                className="h-24 w-24 rounded-2xl object-cover shadow-sm"
                            />
                        ) : (
                            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-primary text-3xl font-semibold text-white shadow-lg shadow-primary/20">
                                {(driver.name || "D")[0]}
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                                Independent driver
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                                {driver.name}
                            </h1>
                            <p className="mt-2 flex items-center gap-2 text-muted">
                                <img src={assets.location_icon} alt="" className="h-4 w-4" />
                                {driver.city}
                            </p>
                        </div>
                    </div>

                    <hr className="my-7 border-borderColor" />

                    <div>
                        <h2 className="mb-3 text-xl font-semibold text-ink">About</h2>
                        <p className="leading-7 text-muted">
                            {driver.bio || "No bio provided."}
                        </p>
                    </div>

                    <div className="mt-8 border-t border-borderColor pt-7">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-ink">Reviews</h2>
                            <span className="text-sm text-muted">
                                {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                            </span>
                        </div>
                        {reviews.length === 0 ? (
                            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-muted">
                                No reviews yet.
                            </div>
                        ) : (
                            reviews.map((r) => (
                                <div
                                    key={r._id}
                                    className="border-t border-borderColor py-4 first:border-t-0"
                                >
                                    <div className="flex items-center justify-between text-sm">
                                        <p className="font-semibold text-ink">
                                            {r.user?.name || "Anonymous"}
                                        </p>
                                        <p className="font-semibold text-amber-500">
                                            ★ {r.rating}
                                        </p>
                                    </div>
                                    {r.comment && (
                                        <p className="mt-2 text-sm leading-6 text-muted">
                                            {r.comment}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    onSubmit={handleSubmit}
                    className="ui-card h-max space-y-5 p-6 text-muted lg:sticky lg:top-24"
                >
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                            Hire this driver
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-ink">
                            {currency}
                            {driver.pricePerDay}
                            <span className="ml-2 text-sm font-normal text-muted">per day</span>
                        </p>
                    </div>
                    <hr className="border-borderColor my-4" />

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Start date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            required
                            className="ui-field"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">End date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate ? nextDate(startDate) : nextDate()}
                            required
                            className="ui-field"
                        />
                    </div>

                    <BookingAvailability
                        {...availability}
                        hasSelection={Boolean(startDate && endDate)}
                    />

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">
                            Payment method
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("cash")}
                                className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${
                                    paymentMethod === "cash"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-borderColor bg-white text-slate-600"
                                }`}
                            >
                                Cash
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("prepaid")}
                                className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${
                                    paymentMethod === "prepaid"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-borderColor bg-white text-slate-600"
                                }`}
                            >
                                Prepaid
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Notes (optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="ui-field min-h-20 resize-y"
                        />
                    </div>

                    {numDays > 0 && (
                        <div className="flex justify-between rounded-xl bg-slate-50 p-4 text-sm">
                            <span>
                                {currency}
                                {driver.pricePerDay} × {numDays} day(s)
                            </span>
                            <span className="font-semibold text-ink">
                                {currency}
                                {totalPrice}
                            </span>
                        </div>
                    )}

                    <button
                        disabled={
                            submitting ||
                            availability.invalidRange ||
                            Boolean(availability.conflict)
                        }
                        className="ui-button min-h-12 w-full text-base disabled:opacity-60"
                    >
                        {submitting ? "Submitting…" : "Hire Driver"}
                    </button>
                </motion.form>
            </div>

            {paymentDetails && createdBooking && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setPaymentDetails(null)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-semibold mb-2">Complete your payment</h2>
                        <p className="text-sm text-gray-500 mb-3">
                            Transfer the exact amount, then upload the screenshot for admin
                            verification.
                        </p>
                        {createdBooking.paymentProofExpiresAt && (
                            <p className="text-sm text-amber-700 mb-4">
                                Upload by{" "}
                                {new Date(
                                    createdBooking.paymentProofExpiresAt
                                ).toLocaleString()}
                                . After that, this reservation expires.
                            </p>
                        )}
                        <div className="bg-light rounded-md p-4 space-y-1 mb-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Amount</span>
                                <span className="font-semibold">
                                    {currency}
                                    {paymentDetails.amount}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Bank name</span>
                                <span className="font-medium">{paymentDetails.bank_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Account number</span>
                                <span className="font-medium">
                                    {paymentDetails.account_number}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Account name</span>
                                <span className="font-medium">{paymentDetails.account_name}</span>
                            </div>
                        </div>
                        <label className="block mb-2 text-sm">Upload screenshot</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setProofFile(e.target.files[0])}
                            className="w-full border border-borderColor rounded-md p-2 text-sm mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setPaymentDetails(null);
                                    navigate("/my-bookings");
                                }}
                                className="flex-1 border border-borderColor rounded-md py-2 text-sm"
                            >
                                I'll upload later
                            </button>
                            <button
                                onClick={handleUploadProof}
                                disabled={!proofFile || uploadingProof}
                                className="flex-1 bg-primary text-white rounded-md py-2 text-sm disabled:opacity-60"
                            >
                                {uploadingProof ? "Uploading…" : "Upload"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </main>
    );
};

export default DriverDetails;
