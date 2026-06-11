import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const STATUS_COLORS = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const Drivers = () => {
    const { axios, currency } = useAppContext();
    const [searchParams, setSearchParams] = useSearchParams();

    const status = searchParams.get("status") || "";
    const isApprovedParam = searchParams.get("isApproved");
    const page = Number(searchParams.get("page") || 1);

    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);

    const [actionModal, setActionModal] = useState(null); // {type, driver}
    const [reason, setReason] = useState("");

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (status) params.status = status;
            if (isApprovedParam !== null && isApprovedParam !== "")
                params.isApproved = isApprovedParam;
            const { data } = await axios.get("/api/admin/drivers", { params });
            if (data.success) {
                setItems(data.drivers || []);
                setPagination(data.pagination || { totalPages: 1, total: 0 });
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [axios, page, status, isApprovedParam]);

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

    const approve = async (d) => {
        if (!window.confirm(`Approve ${d.name}?`)) return;
        try {
            const { data } = await axios.post("/api/admin/driver/approve", {
                driverId: d._id,
            });
            if (data.success) {
                toast.success(data.message);
                fetchList();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const submitAction = async () => {
        if (!actionModal) return;
        if (!reason.trim()) {
            toast.error("Reason is required");
            return;
        }
        try {
            const url =
                actionModal.type === "reject"
                    ? "/api/admin/driver/reject"
                    : "/api/admin/driver/block";
            const { data } = await axios.post(url, {
                driverId: actionModal.driver._id,
                reason,
            });
            if (data.success) {
                toast.success(data.message);
                setActionModal(null);
                setReason("");
                fetchList();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const unblock = async (d) => {
        try {
            const { data } = await axios.post("/api/admin/driver/unblock", {
                driverId: d._id,
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
                title="Independent Drivers"
                subTitle="Approve registrations, block/unblock active drivers, and view directory."
            />

            <div className="flex flex-wrap gap-3 items-end mt-6">
                <label className="text-xs text-gray-500">
                    Status
                    <select
                        value={status}
                        onChange={(e) => updateParam("status", e.target.value)}
                        className="block mt-1 border border-borderColor rounded-md text-sm p-2"
                    >
                        <option value="">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </label>
                <label className="text-xs text-gray-500">
                    Approval
                    <select
                        value={isApprovedParam ?? ""}
                        onChange={(e) => updateParam("isApproved", e.target.value)}
                        className="block mt-1 border border-borderColor rounded-md text-sm p-2"
                    >
                        <option value="">Any</option>
                        <option value="true">Approved</option>
                        <option value="false">Pending</option>
                    </select>
                </label>
                <div className="ml-auto text-xs text-gray-500">
                    {pagination.total} total
                </div>
            </div>

            <div className="max-w-7xl rounded-md overflow-hidden border border-borderColor mt-4">
                <table className="w-full text-sm">
                    <thead className="bg-light text-gray-500">
                        <tr>
                            <th className="p-3 text-left font-medium">Driver</th>
                            <th className="p-3 text-left font-medium">User</th>
                            <th className="p-3 text-left font-medium">City</th>
                            <th className="p-3 text-left font-medium">Price/day</th>
                            <th className="p-3 text-left font-medium">Approved</th>
                            <th className="p-3 text-left font-medium">Status</th>
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
                                    No drivers match these filters.
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            items.map((d) => (
                                <tr key={d._id} className="border-t border-borderColor">
                                    <td className="p-3 font-medium">{d.name}</td>
                                    <td className="p-3">
                                        <div>{d.user?.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {d.user?.email}
                                        </div>
                                    </td>
                                    <td className="p-3">{d.city || "—"}</td>
                                    <td className="p-3">
                                        {currency}
                                        {d.pricePerDay}
                                    </td>
                                    <td className="p-3">
                                        {d.isApproved ? (
                                            <span className="text-green-700 text-xs">Yes</span>
                                        ) : (
                                            <span className="text-yellow-700 text-xs">Pending</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs ${
                                                STATUS_COLORS[d.status] ||
                                                "bg-gray-100 text-gray-600"
                                            }`}
                                        >
                                            {d.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-xs">{fmtDate(d.createdAt)}</td>
                                    <td className="p-3 text-xs">
                                        <div className="flex gap-1 flex-wrap">
                                            {!d.isApproved && (
                                                <>
                                                    <button
                                                        onClick={() => approve(d)}
                                                        className="px-2 py-1 bg-green-600 text-white rounded"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setActionModal({
                                                                type: "reject",
                                                                driver: d,
                                                            })
                                                        }
                                                        className="px-2 py-1 bg-red-500 text-white rounded"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {d.isApproved && d.status === "inactive" && (
                                                <button
                                                    onClick={() => unblock(d)}
                                                    className="px-2 py-1 bg-green-600 text-white rounded"
                                                >
                                                    Unblock
                                                </button>
                                            )}
                                            {d.isApproved && d.status === "active" && (
                                                <button
                                                    onClick={() =>
                                                        setActionModal({
                                                            type: "block",
                                                            driver: d,
                                                        })
                                                    }
                                                    className="px-2 py-1 bg-red-500 text-white rounded"
                                                >
                                                    Block
                                                </button>
                                            )}
                                        </div>
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

            {actionModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setActionModal(null)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold mb-2">
                            {actionModal.type === "block" ? "Block" : "Reject"} {" "}
                            {actionModal.driver.name}
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
                                onClick={() => setActionModal(null)}
                                className="flex-1 border border-borderColor rounded-md py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitAction}
                                className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm"
                            >
                                {actionModal.type === "block" ? "Block" : "Reject"}
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

export default Drivers;
