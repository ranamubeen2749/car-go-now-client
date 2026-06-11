import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const STATUS_COLORS = {
    awaiting_payment_proof: "bg-orange-100 text-orange-700",
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
};

const PAY_COLORS = {
    unpaid: "bg-gray-100 text-gray-600",
    awaiting_proof: "bg-orange-100 text-orange-700",
    pending_verification: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const STATUSES = [
    "",
    "awaiting_payment_proof",
    "pending",
    "confirmed",
    "completed",
    "rejected",
    "cancelled",
];

const Bookings = () => {
    const { axios, currency } = useAppContext();
    const [searchParams, setSearchParams] = useSearchParams();

    const bookingType = searchParams.get("bookingType") || "car";
    const status = searchParams.get("status") || "";
    const page = Number(searchParams.get("page") || 1);

    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20, bookingType };
            if (status) params.status = status;
            const { data } = await axios.get("/api/admin/bookings", { params });
            if (data.success) {
                setItems(data.bookings || []);
                setPagination(data.pagination || { totalPages: 1, total: 0 });
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [axios, page, bookingType, status]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const updateParam = (key, value) => {
        const next = new URLSearchParams(searchParams);
        if (value === "" || value === null || value === undefined) next.delete(key);
        else next.set(key, String(value));
        next.delete("page");
        setSearchParams(next);
    };

    const verifyPayment = async (b) => {
        if (!window.confirm("Mark this booking's payment as verified?")) return;
        try {
            const { data } = await axios.post("/api/admin/booking/verify-payment", {
                bookingId: b._id,
                bookingType,
            });
            if (data.success) {
                toast.success(data.message);
                fetchList();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    return (
        <div className="px-4 pt-10 md:px-10 w-full max-w-7xl">
            <Title
                title="Bookings"
                subTitle="View all car and driver bookings across the platform."
            />

            <div className="flex flex-wrap gap-3 items-end mt-6">
                <div className="flex border border-borderColor rounded-md overflow-hidden">
                    {["car", "driver"].map((t) => (
                        <button
                            key={t}
                            onClick={() => updateParam("bookingType", t)}
                            className={`px-3 py-1.5 text-sm capitalize ${
                                bookingType === t
                                    ? "bg-primary text-white"
                                    : "bg-white text-gray-600"
                            }`}
                        >
                            {t} bookings
                        </button>
                    ))}
                </div>
                <label className="text-xs text-gray-500">
                    Status
                    <select
                        value={status}
                        onChange={(e) => updateParam("status", e.target.value)}
                        className="block mt-1 border border-borderColor rounded-md text-sm p-2"
                    >
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s ? s.replace(/_/g, " ") : "All"}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="ml-auto text-xs text-gray-500">{pagination.total} total</div>
            </div>

            <div className="max-w-7xl rounded-md overflow-hidden border border-borderColor mt-4">
                <table className="w-full text-sm">
                    <thead className="bg-light text-gray-500">
                        <tr>
                            <th className="p-3 text-left font-medium">Customer</th>
                            {bookingType === "car" ? (
                                <>
                                    <th className="p-3 text-left font-medium">Car</th>
                                    <th className="p-3 text-left font-medium">Business</th>
                                </>
                            ) : (
                                <th className="p-3 text-left font-medium">Driver</th>
                            )}
                            <th className="p-3 text-left font-medium">Price</th>
                            <th className="p-3 text-left font-medium">Status</th>
                            <th className="p-3 text-left font-medium">Payment</th>
                            <th className="p-3 text-left font-medium">Created</th>
                            <th className="p-3 text-left font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={8} className="p-6 text-center text-gray-500">
                                    Loading…
                                </td>
                            </tr>
                        )}
                        {!loading && items.length === 0 && (
                            <tr>
                                <td colSpan={8} className="p-6 text-center text-gray-500">
                                    No bookings match these filters.
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            items.map((b) => (
                                <tr key={b._id} className="border-t border-borderColor">
                                    <td className="p-3">
                                        <div>{b.user?.name || "—"}</div>
                                        <div className="text-xs text-gray-500">
                                            {b.user?.email}
                                        </div>
                                    </td>
                                    {bookingType === "car" ? (
                                        <>
                                            <td className="p-3">
                                                {b.car?.brand} {b.car?.model}
                                            </td>
                                            <td className="p-3 text-xs">
                                                {b.business?.name || "—"}
                                            </td>
                                        </>
                                    ) : (
                                        <td className="p-3">
                                            {b.independentDriver?.name ||
                                                b.driver?.name ||
                                                "—"}
                                        </td>
                                    )}
                                    <td className="p-3">
                                        {currency}
                                        {b.price}
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs ${
                                                STATUS_COLORS[b.status] ||
                                                "bg-gray-100 text-gray-600"
                                            }`}
                                        >
                                            {(b.status || "").replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div
                                            className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                                                PAY_COLORS[b.paymentStatus] ||
                                                "bg-gray-100 text-gray-600"
                                            }`}
                                        >
                                            {(b.paymentStatus || "").replace(/_/g, " ") || "—"}
                                        </div>
                                        {b.payment_proof?.url && (
                                            <div className="mt-1">
                                                <a
                                                    href={b.payment_proof.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs text-primary underline"
                                                >
                                                    View proof
                                                </a>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3 text-xs">{fmtDate(b.createdAt)}</td>
                                    <td className="p-3 text-xs">
                                        {b.paymentStatus === "pending_verification" && (
                                            <button
                                                onClick={() => verifyPayment(b)}
                                                className="px-2 py-1 bg-green-600 text-white rounded"
                                            >
                                                Verify
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                page={page}
                totalPages={pagination.totalPages}
                onChange={(p) => updateParam("page", p)}
            />
        </div>
    );
};

const Pagination = ({ page, totalPages, onChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-end items-center gap-2 mt-4 text-xs">
            <button
                disabled={page <= 1}
                onClick={() => onChange(page - 1)}
                className="px-3 py-1 border border-borderColor rounded disabled:opacity-40"
            >
                Prev
            </button>
            <span>
                Page {page} of {totalPages}
            </span>
            <button
                disabled={page >= totalPages}
                onClick={() => onChange(page + 1)}
                className="px-3 py-1 border border-borderColor rounded disabled:opacity-40"
            >
                Next
            </button>
        </div>
    );
};

export default Bookings;
