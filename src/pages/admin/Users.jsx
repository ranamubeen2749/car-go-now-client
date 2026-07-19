import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const Users = () => {
    const { axios } = useAppContext();
    const [searchParams, setSearchParams] = useSearchParams();

    const isVerified = searchParams.get("isVerified") ?? "";
    const currentRole = searchParams.get("currentRole") || "";
    const page = Number(searchParams.get("page") || 1);

    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (isVerified !== "") params.isVerified = isVerified;
            if (currentRole) params.currentRole = currentRole;
            const { data } = await axios.get("/api/admin/users", { params });
            if (data.success) {
                setItems(data.users || []);
                setPagination(data.pagination || { totalPages: 1, total: 0 });
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [axios, page, isVerified, currentRole]);

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

    return (
        <div className="px-4 pt-10 md:px-10 w-full max-w-7xl">
            <Title
                title="Users"
                subTitle="Browse all platform users by role and verification status."
            />

            <div className="flex flex-wrap gap-3 items-end mt-6">
                <label className="text-xs text-gray-500">
                    Active role
                    <select
                        value={currentRole}
                        onChange={(e) => updateParam("currentRole", e.target.value)}
                        className="block mt-1 border border-borderColor rounded-md text-sm p-2"
                    >
                        <option value="">All</option>
                        <option value="customer">Customer</option>
                        <option value="business_owner">Business owner</option>
                        <option value="independent_driver">Independent driver</option>
                        <option value="super_admin">Super admin</option>
                    </select>
                </label>
                <label className="text-xs text-gray-500">
                    License verified
                    <select
                        value={isVerified}
                        onChange={(e) => updateParam("isVerified", e.target.value)}
                        className="block mt-1 border border-borderColor rounded-md text-sm p-2"
                    >
                        <option value="">Any</option>
                        <option value="true">Verified</option>
                        <option value="false">Not verified</option>
                    </select>
                </label>
                <div className="ml-auto text-xs text-gray-500">{pagination.total} total</div>
            </div>

            <div className="max-w-7xl rounded-md overflow-hidden border border-borderColor mt-4">
                <table className="w-full text-sm">
                    <thead className="bg-light text-gray-500">
                        <tr>
                            <th className="p-3 text-left font-medium">Name</th>
                            <th className="p-3 text-left font-medium">Email</th>
                            <th className="p-3 text-left font-medium">Phone</th>
                            <th className="p-3 text-left font-medium">Active role</th>
                            <th className="p-3 text-left font-medium">Roles</th>
                            <th className="p-3 text-left font-medium">Verified</th>
                            <th className="p-3 text-left font-medium">Joined</th>
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
                                    No users match these filters.
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            items.map((u) => (
                                <tr key={u._id} className="border-t border-borderColor">
                                    <td className="p-3 font-medium">{u.name}</td>
                                    <td className="p-3">{u.email}</td>
                                    <td className="p-3 text-xs">{u.phone || "—"}</td>
                                    <td className="p-3 text-xs capitalize">
                                        {(u.currentRole || u.activeRole || "").replace(/_/g, " ")}
                                    </td>
                                    <td className="p-3 text-xs">
                                        {(u.roles || u.hasRoles || [])
                                            .map((r) => r.replace(/_/g, " "))
                                            .join(", ")}
                                    </td>
                                    <td className="p-3 text-xs">
                                        {u.isVerified ? (
                                            <span className="text-green-700">Yes</span>
                                        ) : (
                                            <span className="text-gray-500">No</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-xs">{fmtDate(u.createdAt)}</td>
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

export default Users;
