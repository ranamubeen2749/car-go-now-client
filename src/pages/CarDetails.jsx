import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "motion/react";

const CarDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        axios,
        user,
        openLogin,
        currency,
        pickupDate,
        setPickupDate,
        returnDate,
        setReturnDate,
    } = useAppContext();

    const [car, setCar] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [activeImage, setActiveImage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Booking form state
    const [withDriver, setWithDriver] = useState(true);
    const [pickupTime, setPickupTime] = useState("09:00 AM");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [description, setDescription] = useState("");

    // After-create state (prepaid screenshot upload)
    const [createdBooking, setCreatedBooking] = useState(null);
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [proofFile, setProofFile] = useState(null);
    const [uploadingProof, setUploadingProof] = useState(false);

    useEffect(() => {
        const fetchCar = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`/api/car/${id}`);
                if (data.success) {
                    setCar(data.car);
                    setAttachments(data.attachments || []);
                } else {
                    toast.error(data.message || "Car not found");
                }
            } catch (error) {
                toast.error(error.response?.data?.message || error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCar();
    }, [id, axios]);

    const carImages = useMemo(
        () => attachments.filter((a) => a.category === "car_image"),
        [attachments]
    );

    const numDays = useMemo(() => {
        if (!pickupDate || !returnDate) return 0;
        const start = new Date(pickupDate);
        const end = new Date(returnDate);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
    }, [pickupDate, returnDate]);

    const totalPrice = numDays && car ? numDays * car.pricePerDay : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            openLogin("login", "customer");
            return;
        }
        if (user.currentRole !== "customer") {
            toast.error("Switch to your customer role to book a car");
            return;
        }
        if (!withDriver && !user.isVerified) {
            toast.error("Your driving license must be approved to book self-drive");
            navigate("/account/license");
            return;
        }
        if (!pickupDate || !returnDate) {
            toast.error("Please pick both dates");
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await axios.post("/api/bookings/car/create", {
                carId: id,
                withDriver,
                pickupDate,
                returnDate,
                pickupTime,
                paymentMethod,
                description,
            });

            if (data.success) {
                toast.success(data.message || "Booking created");
                if (paymentMethod === "prepaid" && data.paymentDetails) {
                    setCreatedBooking(data.booking);
                    setPaymentDetails(data.paymentDetails);
                } else {
                    navigate("/my-bookings");
                }
            } else {
                toast.error(data.message || "Failed to create booking");
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            toast.error(msg);
            // Backend blocks prepaid if business has no bank details. Fall back to cash.
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
                "/api/bookings/car/upload-payment-proof",
                formData
            );

            if (data.success) {
                toast.success(data.message || "Payment proof uploaded");
                navigate("/my-bookings");
            } else {
                toast.error(data.message || "Upload failed");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setUploadingProof(false);
        }
    };

    if (loading) return <Loader />;
    if (!car) return <div className="text-center py-20">Car not found</div>;

    const mainImage = carImages[activeImage]?.url || car?.images?.[0]?.url || null;

    return (
        <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-16">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 mb-6 text-gray-500 cursor-pointer"
            >
                <img src={assets.arrow_icon} alt="" className="rotate-180 opacity-65" />
                Back to all cars
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                {/* Left: Car Image & Details */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="lg:col-span-2"
                >
                    {mainImage ? (
                        <motion.img
                            initial={{ scale: 0.98, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            src={mainImage}
                            alt={`${car.brand} ${car.model}`}
                            className="w-full h-auto md:max-h-100 object-cover rounded-xl mb-6 shadow-md"
                        />
                    ) : (
                        <div className="w-full h-72 bg-gray-100 rounded-xl mb-6 flex items-center justify-center text-gray-400">
                            No image
                        </div>
                    )}

                    {/* Thumbnails */}
                    {carImages.length > 1 && (
                        <div className="flex gap-2 mb-6 overflow-x-auto">
                            {carImages.map((img, idx) => (
                                <img
                                    key={img._id || idx}
                                    src={img.thumbnailUrl || img.url}
                                    alt=""
                                    onClick={() => setActiveImage(idx)}
                                    className={`h-20 w-28 object-cover rounded-md cursor-pointer border-2 ${
                                        idx === activeImage ? "border-primary" : "border-transparent"
                                    }`}
                                />
                            ))}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold">
                                {car.brand} {car.model}
                            </h1>
                            <p className="text-gray-500 text-lg">
                                {car.category} • {car.year}
                            </p>
                            {car.business?.name && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Listed by{" "}
                                    <span className="font-medium">{car.business.name}</span>
                                    {car.business.city && <> · {car.business.city}</>}
                                </p>
                            )}
                        </div>

                        <hr className="border-borderColor my-6" />

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                {
                                    icon: assets.users_icon,
                                    text: `${car.seating_capacity} Seats`,
                                },
                                { icon: assets.fuel_icon, text: car.fuel_type },
                                { icon: assets.car_icon, text: car.transmission },
                                { icon: assets.location_icon, text: car.location },
                            ].map(({ icon, text }) => (
                                <div
                                    key={text}
                                    className="flex flex-col items-center bg-light p-4 rounded-lg"
                                >
                                    <img src={icon} alt="" className="h-5 mb-2" />
                                    {text}
                                </div>
                            ))}
                        </div>

                        <div>
                            <h1 className="text-xl font-medium mb-3">Description</h1>
                            <p className="text-gray-500">{car.description}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Right: Booking Form */}
                <motion.form
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    onSubmit={handleSubmit}
                    className="shadow-lg h-max sticky top-18 rounded-xl p-6 space-y-5 text-gray-500"
                >
                    <p className="flex items-center justify-between text-2xl text-gray-800 font-semibold">
                        {currency}
                        {car.pricePerDay}
                        <span className="text-base text-gray-400 font-normal">per day</span>
                    </p>

                    <hr className="border-borderColor my-4" />

                    {/* Driver option */}
                    <div className="flex flex-col gap-2">
                        <label className="text-gray-700 text-sm font-medium">Driver</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setWithDriver(true)}
                                className={`px-3 py-2 rounded-md border text-sm ${
                                    withDriver
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-borderColor"
                                }`}
                            >
                                With driver
                            </button>
                            <button
                                type="button"
                                onClick={() => setWithDriver(false)}
                                className={`px-3 py-2 rounded-md border text-sm ${
                                    !withDriver
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-borderColor"
                                }`}
                            >
                                Self-drive
                            </button>
                        </div>
                        {!withDriver && user && !user.isVerified && (
                            <p className="text-xs text-amber-600">
                                Self-drive requires an approved license.{" "}
                                <span
                                    onClick={() => navigate("/account/license")}
                                    className="underline cursor-pointer"
                                >
                                    Upload now
                                </span>
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="pickup-date">Pickup Date</label>
                        <input
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            type="date"
                            className="border border-borderColor px-3 py-2 rounded-lg"
                            required
                            id="pickup-date"
                            min={new Date().toISOString().split("T")[0]}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="return-date">Return Date</label>
                        <input
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            type="date"
                            className="border border-borderColor px-3 py-2 rounded-lg"
                            required
                            id="return-date"
                            min={pickupDate || new Date().toISOString().split("T")[0]}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label>Pickup Time</label>
                        <input
                            type="text"
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            placeholder="e.g. 09:00 AM"
                            className="border border-borderColor px-3 py-2 rounded-lg"
                            required
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
                                Cash on pickup
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
                                Prepaid (bank transfer)
                            </button>
                        </div>
                        {paymentMethod === "prepaid" && (
                            <p className="text-xs text-gray-500">
                                You'll see the owner's bank details after submitting, then upload
                                a transfer screenshot for admin verification.
                            </p>
                        )}
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
                                {car.pricePerDay} × {numDays} day(s)
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
                        {submitting ? "Submitting…" : "Book Now"}
                    </button>
                </motion.form>
            </div>

            {/* Prepaid payment-details modal */}
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
                        <p className="text-sm text-gray-500 mb-4">
                            Transfer the exact amount to the owner's bank account, then upload
                            the screenshot. The admin will verify it.
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
                                type="button"
                                onClick={() => {
                                    setPaymentDetails(null);
                                    navigate("/my-bookings");
                                }}
                                className="flex-1 border border-borderColor rounded-md py-2 text-sm"
                            >
                                I'll upload later
                            </button>
                            <button
                                type="button"
                                disabled={!proofFile || uploadingProof}
                                onClick={handleUploadProof}
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

export default CarDetails;
