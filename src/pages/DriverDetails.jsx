import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "motion/react";

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
        <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-16">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 mb-6 text-gray-500 cursor-pointer"
            >
                <img src={assets.arrow_icon} alt="" className="rotate-180 opacity-65" />
                Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="lg:col-span-2"
                >
                    <div className="flex items-center gap-4">
                        {driver.avatar?.url ? (
                            <img
                                src={driver.avatar.url}
                                alt={driver.name}
                                className="w-24 h-24 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-semibold">
                                {(driver.name || "D")[0]}
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold">{driver.name}</h1>
                            <p className="text-gray-500">{driver.city}</p>
                        </div>
                    </div>

                    <hr className="border-borderColor my-6" />

                    <div>
                        <h2 className="text-xl font-medium mb-2">About</h2>
                        <p className="text-gray-600">{driver.bio || "No bio provided."}</p>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-xl font-medium mb-4">Reviews</h2>
                        {reviews.length === 0 ? (
                            <p className="text-gray-500 text-sm">No reviews yet.</p>
                        ) : (
                            reviews.map((r) => (
                                <div
                                    key={r._id}
                                    className="border-t border-borderColor py-3"
                                >
                                    <div className="flex items-center justify-between text-sm">
                                        <p className="font-medium">
                                            {r.user?.name || "Anonymous"}
                                        </p>
                                        <p className="text-amber-500">★ {r.rating}</p>
                                    </div>
                                    {r.comment && (
                                        <p className="text-gray-600 mt-1 text-sm">{r.comment}</p>
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
                    className="shadow-lg h-max sticky top-18 rounded-xl p-6 space-y-5 text-gray-500"
                >
                    <p className="flex items-center justify-between text-2xl text-gray-800 font-semibold">
                        {currency}
                        {driver.pricePerDay}
                        <span className="text-base text-gray-400 font-normal">per day</span>
                    </p>
                    <hr className="border-borderColor my-4" />

                    <div className="flex flex-col gap-2">
                        <label>Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            required
                            className="border border-borderColor px-3 py-2 rounded-lg"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate || new Date().toISOString().split("T")[0]}
                            required
                            className="border border-borderColor px-3 py-2 rounded-lg"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-gray-700 text-sm font-medium">
                            Payment Method
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("cash")}
                                className={`px-3 py-2 rounded-md border text-sm ${
                                    paymentMethod === "cash"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-borderColor"
                                }`}
                            >
                                Cash
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("prepaid")}
                                className={`px-3 py-2 rounded-md border text-sm ${
                                    paymentMethod === "prepaid"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-borderColor"
                                }`}
                            >
                                Prepaid
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label>Notes (optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="border border-borderColor px-3 py-2 rounded-lg outline-none"
                        />
                    </div>

                    {numDays > 0 && (
                        <div className="flex justify-between text-sm pt-2">
                            <span>
                                {currency}
                                {driver.pricePerDay} × {numDays} day(s)
                            </span>
                            <span className="font-semibold text-gray-700">
                                {currency}
                                {totalPrice}
                            </span>
                        </div>
                    )}

                    <button
                        disabled={submitting}
                        className="w-full bg-primary hover:bg-primary-dull transition-all py-3 font-medium text-white rounded-xl cursor-pointer disabled:opacity-60"
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
    );
};

export default DriverDetails;
