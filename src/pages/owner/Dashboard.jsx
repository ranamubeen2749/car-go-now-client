import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const Dashboard = () => {
    const { axios, isOwner, currency } = useAppContext();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get("/api/business/dashboard");
            if (data.success) {
                setDashboard(data.dashboard);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOwner) fetchDashboardData();
    }, [isOwner]);

    if (loading && !dashboard) {
        return (
            <div className="px-4 pt-10 md:px-10 flex-1">
                <Title
                    title="Business Dashboard"
                    subTitle="Loading your business analytics…"
                />
            </div>
        );
    }

    const d = dashboard || {
        business: {},
        cars: {},
        drivers: {},
        bookings: {},
        revenue: {},
        platformFees: {},
        recentBookings: [],
    };

    const cards = [
        { title: "Total Cars", value: d.cars.total || 0, icon: assets.carIconColored },
        { title: "Approved", value: d.cars.approved || 0, icon: assets.listIconColored },
        { title: "Pending Cars", value: d.cars.pending || 0, icon: assets.cautionIconColored },
        { title: "Active Drivers", value: d.drivers.activeAndApproved || 0, icon: assets.listIconColored },
        { title: "Total Bookings", value: d.bookings.total || 0, icon: assets.listIconColored },
        { title: "Pending", value: d.bookings.pending || 0, icon: assets.cautionIconColored },
        { title: "Confirmed", value: d.bookings.confirmed || 0, icon: assets.listIconColored },
        { title: "Completed", value: d.bookings.completed || 0, icon: assets.listIconColored },
    ];

    return (
        <div className="px-4 pt-10 md:px-10 flex-1">
            <Title
                title="Business Dashboard"
                subTitle="Monitor your fleet, bookings, revenue, and platform fees."
            />

            {/* Banners */}
            {d.business?.status === "blocked" && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 my-6">
                    Your account is currently <strong>blocked</strong>. Cars are hidden from
                    customers until outstanding fees are settled and verified by an admin.
                </div>
            )}
            {d.business && d.business.hasBankDetails === false && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 my-6 flex items-center justify-between">
                    <span>
                        Bank details are missing — customers can only choose <strong>cash</strong>
                        for your cars until you add them.
                    </span>
                    <Link
                        to="/owner/bank-details"
                        className="ml-4 px-3 py-1.5 bg-amber-600 text-white rounded text-sm"
                    >
                        Add bank details
                    </Link>
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
                {/* Revenue */}
                <div className="p-4 md:p-6 border border-borderColor rounded-md">
                    <h1 className="text-lg font-medium">Revenue</h1>
                    <p className="text-gray-500 text-sm">Across all completed bookings</p>
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

                {/* Current fee */}
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
                                {d.platformFees.current.fee_percentage}% of{" "}
                                {currency}
                                {d.platformFees.current.gross_earning} · status{" "}
                                <span className="font-medium">
                                    {d.platformFees.current.payment_status}
                                </span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Due {fmtDate(d.platformFees.current.dueAt)}
                            </p>
                            <Link
                                to="/owner/fees"
                                className="inline-block mt-3 text-primary text-sm underline"
                            >
                                Manage fees
                            </Link>
                        </>
                    ) : (
                        <p className="text-gray-500 mt-4 text-sm">
                            No fee record yet for the current cycle.
                        </p>
                    )}
                </div>

                {/* Outstanding */}
                <div className="p-4 md:p-6 border border-borderColor rounded-md">
                    <h1 className="text-lg font-medium">Outstanding Fees</h1>
                    <p className="text-gray-500 text-sm">All unpaid + pending verification</p>
                    <p className="text-3xl mt-4 font-semibold text-red-500">
                        {currency}
                        {d.platformFees.totalOutstanding || 0}
                    </p>
                    <Link
                        to="/owner/fees"
                        className="inline-block mt-3 text-primary text-sm underline"
                    >
                        View fee history
                    </Link>
                </div>
            </div>

            <div className="p-4 md:p-6 border border-borderColor rounded-md mb-12">
                <h1 className="text-lg font-medium">Recent Bookings</h1>
                <p className="text-gray-500 text-sm">Last 5 customer bookings</p>
                {(d.recentBookings || []).length === 0 && (
                    <p className="text-sm text-gray-500 mt-4">No bookings yet.</p>
                )}
                {(d.recentBookings || []).map((booking) => (
                    <div
                        key={booking._id}
                        className="mt-4 flex items-center justify-between border-t border-borderColor pt-3"
                    >
                        <div className="flex items-center gap-2">
                            <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                                <img src={assets.listIconColored} alt="" className="h-5 w-5" />
                            </div>
                            <div>
                                <p>
                                    {booking.car?.brand} {booking.car?.model}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {booking.user?.name} · {fmtDate(booking.createdAt)}
                                </p>
                            </div>
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
