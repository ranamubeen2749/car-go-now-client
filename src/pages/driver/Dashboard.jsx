import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const VERIF_COLORS = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
};

const Dashboard = () => {
    const { axios, isDriver, currency } = useAppContext();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get("/api/driver/dashboard");
            if (data.success) setDashboard(data.dashboard);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isDriver) fetchData();
    }, [isDriver]);

    if (loading && !dashboard) {
        return (
            <div className="px-4 pt-10 md:px-10 flex-1">
                <Title title="Driver Dashboard" subTitle="Loading…" />
            </div>
        );
    }

    const d = dashboard || {
        driver: {},
        bookings: {},
        revenue: {},
        platformFees: {},
        recentBookings: [],
    };

    const cards = [
        { title: "Total Bookings", value: d.bookings.total || 0, icon: assets.listIconColored },
        { title: "Pending", value: d.bookings.pending || 0, icon: assets.cautionIconColored },
        { title: "Confirmed", value: d.bookings.confirmed || 0, icon: assets.listIconColored },
        { title: "Completed", value: d.bookings.completed || 0, icon: assets.listIconColored },
    ];

    return (
        <div className="px-4 pt-10 md:px-10 flex-1">
            <Title
                title="Driver Dashboard"
                subTitle="Manage your bookings, earnings, and platform fees."
            />

            {/* Banners */}
            {d.driver?.verification_status && d.driver.verification_status !== "approved" && (
                <div
                    className={`border rounded-md p-4 my-6 ${
                        d.driver.verification_status === "rejected"
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                    }`}
                >
                    Your account is{" "}
                    <span className="font-semibold">{d.driver.verification_status}</span>. You
                    cannot receive bookings until the super admin approves your documents.
                </div>
            )}
            {d.driver && d.driver.hasBankDetails === false && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 my-6 flex items-center justify-between">
                    <span>
                        Bank details missing — customers can only choose <strong>cash</strong>
                        until you add them.
                    </span>
                    <Link
                        to="/driver/bank-details"
                        className="ml-4 px-3 py-1.5 bg-amber-600 text-white rounded text-sm"
                    >
                        Add bank details
                    </Link>
                </div>
            )}

            {/* Profile summary */}
            {d.driver?.name && (
                <div className="p-4 border border-borderColor rounded-md my-6 max-w-2xl flex flex-wrap items-center gap-4">
                    <div>
                        <p className="text-lg font-medium">{d.driver.name}</p>
                        <p className="text-sm text-gray-500">{d.driver.city}</p>
                    </div>
                    <p className="text-sm">
                        Rate:{" "}
                        <span className="font-medium">
                            {currency}
                            {d.driver.pricePerDay}/day
                        </span>
                    </p>
                    <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                            VERIF_COLORS[d.driver.verification_status] ||
                            "bg-gray-100 text-gray-600"
                        }`}
                    >
                        {d.driver.verification_status}
                    </span>
                </div>
            )}

            {/* Stat cards */}
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 my-8">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="flex gap-2 items-center justify-between p-4 rounded-md border border-borderColor"
                    >
                        <div>
                            <h1 className="text-xs text-gray-500">{card.title}</h1>
                            <p className="text-lg font-semibold">{card.value}</p>
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            <img src={card.icon} alt="" className="h-4 w-4" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="p-4 md:p-6 border border-borderColor rounded-md">
                    <h1 className="text-lg font-medium">Revenue</h1>
                    <p className="text-3xl mt-4 font-semibold text-primary">
                        {currency}
                        {d.revenue.total || 0}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        This month:{" "}
                        <span className="font-medium text-gray-700">
                            {currency}
                            {d.revenue.thisMonth || 0}
                        </span>
                    </p>
                </div>

                <div className="p-4 md:p-6 border border-borderColor rounded-md">
                    <h1 className="text-lg font-medium">Current Platform Fee</h1>
                    {d.platformFees?.current ? (
                        <>
                            <p className="text-gray-500 text-sm">
                                Period {d.platformFees.current.period}
                            </p>
                            <p className="text-3xl mt-4 font-semibold text-amber-600">
                                {currency}
                                {d.platformFees.current.fee_amount}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                {d.platformFees.current.fee_percentage}% · status{" "}
                                <span className="font-medium">
                                    {d.platformFees.current.payment_status}
                                </span>
                            </p>
                            <Link
                                to="/driver/fees"
                                className="inline-block mt-3 text-primary text-sm underline"
                            >
                                Manage fees
                            </Link>
                        </>
                    ) : (
                        <p className="text-gray-500 mt-4 text-sm">No fee record yet.</p>
                    )}
                </div>

                <div className="p-4 md:p-6 border border-borderColor rounded-md">
                    <h1 className="text-lg font-medium">Outstanding Fees</h1>
                    <p className="text-3xl mt-4 font-semibold text-red-500">
                        {currency}
                        {d.platformFees.totalOutstanding || 0}
                    </p>
                </div>
            </div>

            <div className="p-4 md:p-6 border border-borderColor rounded-md mb-12">
                <h1 className="text-lg font-medium">Recent Bookings</h1>
                {(d.recentBookings || []).length === 0 && (
                    <p className="text-sm text-gray-500 mt-4">No bookings yet.</p>
                )}
                {(d.recentBookings || []).map((booking) => (
                    <div
                        key={booking._id}
                        className="mt-4 flex items-center justify-between border-t border-borderColor pt-3"
                    >
                        <div>
                            <p className="font-medium">{booking.user?.name}</p>
                            <p className="text-sm text-gray-500">
                                {fmtDate(booking.createdAt)}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 font-medium">
                            <p className="text-sm text-gray-500">
                                {currency}
                                {booking.price}
                            </p>
                            <p className="px-3 py-0.5 border border-borderColor rounded-full text-sm">
                                {booking.status}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
