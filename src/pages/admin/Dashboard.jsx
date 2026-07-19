import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const Dashboard = () => {
    const { axios, currency, isAdmin } = useAppContext();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAdmin) return;
        (async () => {
            setLoading(true);
            try {
                const { data } = await axios.get("/api/admin/dashboard");
                if (data?.success) setDashboard(data.dashboard);
                else toast.error(data?.message || "Failed to load dashboard");
            } catch (error) {
                toast.error(error.response?.data?.message || error.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [axios, isAdmin]);

    if (loading) {
        return (
            <div className="px-4 pt-10 md:px-10 flex-1">
                <Title title="Admin Dashboard" subTitle="Loading platform analytics…" />
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="px-4 pt-10 md:px-10 flex-1">
                <Title title="Admin Dashboard" subTitle="Failed to load dashboard." />
            </div>
        );
    }

    const { overview, pendingApprovals, revenue, platformFees, bookings, recent } = dashboard;

    return (
        <div className="px-4 pt-10 md:px-10 flex-1 max-w-7xl">
            <Title
                title="Admin Dashboard"
                subTitle="Live overview of platform activity, revenue, and pending approvals."
            />

            {/* Overview cards */}
            <h2 className="mt-8 mb-3 font-medium">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card label="Total users" value={overview?.totalUsers ?? 0} />
                <Card
                    label="Businesses"
                    value={overview?.totalBusinesses ?? 0}
                    sub={`${overview?.activeBusinesses ?? 0} active`}
                />
                <Card
                    label="Independent drivers"
                    value={overview?.totalIndependentDrivers ?? 0}
                    sub={`${overview?.activeDrivers ?? 0} active`}
                />
                <Card
                    label="Cars"
                    value={overview?.totalCars ?? 0}
                    sub={`${overview?.approvedCars ?? 0} approved`}
                />
                <Card
                    label="Total bookings"
                    value={overview?.totalBookings ?? 0}
                    sub={`${overview?.completedBookings ?? 0} completed`}
                />
                <Card
                    label="Platform revenue"
                    value={`${currency}${revenue?.totalPlatformRevenue ?? 0}`}
                    sub={`This month: ${currency}${revenue?.thisMonth ?? 0}`}
                />
                <Card
                    label="Revenue growth"
                    value={revenue?.growth ?? "—"}
                    sub={`Last month: ${currency}${revenue?.lastMonth ?? 0}`}
                />
                <Card
                    label="Outstanding fees"
                    value={`${currency}${platformFees?.totalOutstanding ?? 0}`}
                    sub={`Collected: ${currency}${platformFees?.totalCollected ?? 0}`}
                />
            </div>

            {/* Pending approvals */}
            <h2 className="mt-10 mb-3 font-medium">Pending approvals</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <PendingCard
                    label="Business drivers"
                    value={pendingApprovals?.businessDrivers ?? 0}
                    to="/admin/verifications/business-drivers"
                />
                <PendingCard
                    label="Drivers"
                    value={pendingApprovals?.drivers ?? 0}
                    to="/admin/drivers?verification_status=pending"
                />
                <PendingCard
                    label="Cars"
                    value={pendingApprovals?.cars ?? 0}
                    to="/admin/cars?verification_status=pending"
                />
                <PendingCard
                    label="Licenses"
                    value={pendingApprovals?.licenses ?? 0}
                    to="/admin/verifications/renter-licenses"
                />
                <PendingCard
                    label="Booking payments"
                    value={pendingApprovals?.bookingPayments ?? 0}
                    to="/admin/verifications/booking-payments"
                />
                <PendingCard
                    label="Fee payments"
                    value={pendingApprovals?.feePayments ?? 0}
                    to="/admin/fees?payment_status=pending_verification"
                />
            </div>

            {/* Platform fee breakdown */}
            <h2 className="mt-10 mb-3 font-medium">Platform fees</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card label="Paid" value={`${currency}${platformFees?.paid ?? 0}`} />
                <Card
                    label="Pending verification"
                    value={`${currency}${platformFees?.pending_verification ?? 0}`}
                />
                <Card label="Unpaid" value={`${currency}${platformFees?.unpaid ?? 0}`} />
                <Card label="Overdue" value={`${currency}${platformFees?.overdue ?? 0}`} />
            </div>

            {/* Bookings breakdown */}
            <h2 className="mt-10 mb-3 font-medium">Bookings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BookingBreakdown title="Car bookings" data={bookings?.car} currency={currency} />
                <BookingBreakdown
                    title="Driver bookings"
                    data={bookings?.driver}
                    currency={currency}
                />
            </div>

            {/* Recent */}
            <h2 className="mt-10 mb-3 font-medium">Recent activity</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentList
                    title="New users"
                    items={recent?.users}
                    render={(u) => (
                        <>
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                            <div className="text-xs text-gray-400">
                                {u.currentRole || u.activeRole} · {fmtDate(u.createdAt)}
                            </div>
                        </>
                    )}
                />
                <RecentList
                    title="New businesses"
                    items={recent?.businesses}
                    render={(b) => (
                        <>
                            <div className="font-medium">{b.name}</div>
                            <div className="text-xs text-gray-500">
                                {b.owner?.name} · {b.owner?.email}
                            </div>
                            <div className="text-xs text-gray-400">
                                {b.status} · {fmtDate(b.createdAt)}
                            </div>
                        </>
                    )}
                />
                <RecentList
                    title="New drivers"
                    items={recent?.drivers}
                    render={(d) => (
                        <>
                            <div className="font-medium">{d.name}</div>
                            <div className="text-xs text-gray-500">{d.user?.email}</div>
                            <div className="text-xs text-gray-400">
                                {d.city} · {fmtDate(d.createdAt)}
                            </div>
                        </>
                    )}
                />
                <RecentList
                    title="Recent bookings"
                    items={recent?.bookings}
                    render={(b) => (
                        <>
                            <div className="font-medium">
                                {b.car?.brand} {b.car?.model} {b.car?.year ? `(${b.car.year})` : ""}
                            </div>
                            <div className="text-xs text-gray-500">
                                {b.user?.name} · {b.business?.name}
                            </div>
                            <div className="text-xs text-gray-400">
                                {b.status} · {currency}
                                {b.price} · {fmtDate(b.createdAt)}
                            </div>
                        </>
                    )}
                />
            </div>
        </div>
    );
};

const Card = ({ label, value, sub }) => (
    <div className="p-4 border border-borderColor rounded-md bg-white">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-semibold mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
);

const PendingCard = ({ label, value, to }) => (
    <Link
        to={to}
        className={`p-4 border rounded-md transition ${
            value > 0
                ? "bg-amber-50 border-amber-200 hover:border-amber-400"
                : "bg-white border-borderColor"
        }`}
    >
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-semibold mt-1">{value}</p>
        {value > 0 && <p className="text-xs text-amber-700 mt-1">Review →</p>}
    </Link>
);

const BookingBreakdown = ({ title, data, currency }) => {
    if (!data) return null;
    const statuses = data.byStatus || {};
    return (
        <div className="p-4 border border-borderColor rounded-md bg-white">
            <div className="flex justify-between mb-3">
                <h3 className="font-medium">{title}</h3>
                <div className="text-xs text-gray-500">
                    {data.total} total · {data.thisMonth} this month
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(statuses).map(([k, v]) => (
                    <div
                        key={k}
                        className="flex justify-between border-b border-borderColor py-1.5"
                    >
                        <span className="text-gray-500 capitalize">{k.replace(/_/g, " ")}</span>
                        <span className="font-medium">{v}</span>
                    </div>
                ))}
            </div>
            {!Object.keys(statuses).length && (
                <p className="text-xs text-gray-500">No bookings yet.</p>
            )}
            <span className="hidden">{currency}</span>
        </div>
    );
};

const RecentList = ({ title, items, render }) => (
    <div className="p-4 border border-borderColor rounded-md bg-white">
        <h3 className="font-medium mb-3">{title}</h3>
        <div className="flex flex-col gap-3">
            {(!items || items.length === 0) && (
                <p className="text-xs text-gray-500">Nothing here yet.</p>
            )}
            {items?.map((item) => (
                <div
                    key={item._id}
                    className="text-sm border-b border-borderColor pb-2 last:border-b-0"
                >
                    {render(item)}
                </div>
            ))}
        </div>
    </div>
);

export default Dashboard;
