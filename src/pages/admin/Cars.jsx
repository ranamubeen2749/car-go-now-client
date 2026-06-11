import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const STATUS_COLORS = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const Cars = () => {
    const { axios, currency } = useAppContext();
    const [searchParams, setSearchParams] = useSearchParams();

    const isApproved = searchParams.get("isApproved") || "";
    const isAvailable = searchParams.get("isAvailable") ?? "";
    const page = Number(searchParams.get("page") || 1);

    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);

    const [rejectTarget, setRejectTarget] = useState(null);
    const [reason, setReason] = useState("");

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (isApproved) params.isApproved = isApproved;
            if (isAvailable !== "") params.isAvailable = isAvailable;
            const { data } = await axios.get("/api/admin/cars", { params });
            if (data.success) {
                setItems(data.cars || []);
                setPagination(data.pagination || { totalPages: 1, total: 0 });
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [axios, page, isApproved, isAvailable]);

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

    const approve = async (c) => {
        if (!window.confirm(`Approve ${c.brand} ${c.model}?`)) return;
        try {
            const { data } = await axios.post("/api/admin/car/approve", { carId: c._id });
            if (data.success) {
                toast.success(data.message);
                fetchList();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const submitReject = async () => {
        if (!rejectTarget) return;
        if (!reason.trim()) {
            toast.error("Reason is required");
            return;
        }
        try {
            const { data } = await axios.post("/api/admin/car/reject", {
                carId: rejectTarget._id,
                reason,
            });
            if (data.success) {
                toast.success(data.message);
                setRejectTarget(null);
                setReason("");
                fetchList();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    return (
        <div className="px-4 pt-10 md:px-10 w-full max-w-7xl">
            <Title
                title="Cars"
                subTitle="Approve pending cars, view all cars across all businesses."
            />

            <div className="flex flex-wrap gap-3 items-end mt-6">
                <label className="text-xs text-gray-500">
                    Approval
                    <select
                        value={isApproved}
                        onChange={(e) => updateParam("isApproved", e.target.value)}
                        className="block mt-1 border border-borderColor rounded-md text-sm p-2"
                    >
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </label>
                <label className="text-xs text-gray-500">
                    Availability
                    <select
                        value={isAvailable}
                        onChange={(e) => updateParam("isAvailable", e.target.value)}
                        className="block mt-1 border border-borderColor rounded-md text-sm p-2"
                    >
                        <option value="">Any</option>
                        <option value="true">Available</option>
                        <option value="false">Unavailable</option>
                    </select>
                </label>
                <div className="ml-auto text-xs text-gray-500">{pagination.total} total</div>
            </div>

            <div className="max-w-7xl rounded-md overflow-hidden border border-borderColor mt-4">
                <table className="w-full text-sm">
                    <thead className="bg-light text-gray-500">
                        <tr>
                            <th className="p-3 text-left font-medium">Car</th>
                            <th className="p-3 text-left font-medium">Business</th>
                            <th className="p-3 text-left font-medium">Price/day</th>
                            <th className="p-3 text-left font-medium">Approval</th>
                            <th className="p-3 text-left font-medium">Available</th>
                            <th className="p-3 text-left font-medium">Created</th>
                            <th className="p-3 text-left font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={7} className="p-6 text-center text-gray-500">
                                    Loading…
                                </td>
                            </tr>
                        )}
                        {!loading && items.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-6 text-center text-gray-500">
                                    No cars match these filters.
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            items.map((c) => {
                                const approvalKey = c.isApproved || c.verification_status;
                                return (
                                    <tr key={c._id} className="border-t border-borderColor">
                                        <td className="p-3">
                                            <div className="font-medium">
                                                {c.brand} {c.model}
                                            </div>
                                            <div className="text-xs text-gray-500">{c.year}</div>
                                        </td>
                                        <td className="p-3">{c.business?.name || "—"}</td>
                                        <td className="p-3">
                                            {currency}
                                            {c.pricePerDay}
                                        </td>
                                        <td className="p-3">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs ${
                                                    STATUS_COLORS[approvalKey] ||
                                                    "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {approvalKey}
                                            </span>
                                        </td>
                                        <td className="p-3 text-xs">
                                            {c.isAvailable ? "Yes" : "No"}
                                        </td>
                                        <td className="p-3 text-xs">{fmtDate(c.createdAt)}</td>
                                        <td className="p-3 text-xs">
                                            <div className="flex gap-1 flex-wrap">
                                                {approvalKey !== "approved" && (
                                                    <button
                                                        onClick={() => approve(c)}
                                                        className="px-2 py-1 bg-green-600 text-white rounded"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {approvalKey !== "rejected" && (
                                                    <button
                                                        onClick={() => setRejectTarget(c)}
                                                        className="px-2 py-1 bg-red-500 text-white rounded"
                                                    >
                                                        Reject
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

            <Pagination
                page={page}
                totalPages={pagination.totalPages}
                onChange={(p) => updateParam("page", p)}
            />

            {rejectTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setRejectTarget(null)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold mb-2">
                            Reject {rejectTarget.brand} {rejectTarget.model}
                        </h2>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Reason"
                            className="w-full border border-borderColor rounded-md p-2 text-sm mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRejectTarget(null)}
                                className="flex-1 border border-borderColor rounded-md py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReject}
                                className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
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

export default Cars;
