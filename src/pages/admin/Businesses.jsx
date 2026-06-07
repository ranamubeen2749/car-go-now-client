import React, { useEffect, useState } from "react";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

// NOTE: The admin docs don't expose a "list all businesses" endpoint yet
// (see plan Phase 6 open questions). We attempt /api/admin/businesses with
// a clear fallback message.

const Businesses = () => {
    const { axios } = useAppContext();
    const [items, setItems] = useState([]);
    const [missing, setMissing] = useState(false);
    const [blockTarget, setBlockTarget] = useState(null);
    const [reason, setReason] = useState("");

    const fetch = async () => {
        try {
            const { data } = await axios.get("/api/admin/businesses");
            if (data.success) {
                setItems(data.businesses || []);
                setMissing(false);
            } else {
                setMissing(true);
            }
        } catch (error) {
            console.warn("admin/businesses endpoint missing", error);
            setMissing(true);
        }
    };

    useEffect(() => {
        fetch();
    }, []);

    const block = async () => {
        if (!blockTarget) return;
        if (!reason.trim()) {
            toast.error("Reason is required");
            return;
        }
        try {
            const { data } = await axios.post("/api/admin/business/block", {
                businessId: blockTarget._id,
                reason,
            });
            if (data.success) {
                toast.success(data.message);
                setBlockTarget(null);
                setReason("");
                fetch();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const unblock = async (b) => {
        try {
            const { data } = await axios.post("/api/admin/business/unblock", {
                businessId: b._id,
            });
            if (data.success) {
                toast.success(data.message);
                fetch();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    return (
        <div className="px-4 pt-10 md:px-10 w-full">
            <Title
                title="Businesses"
                subTitle="Block or unblock businesses. Outstanding fees may require manual blocking."
            />

            {missing && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 my-6 max-w-xl">
                    Backend doesn't yet expose <code>GET /api/admin/businesses</code>. Once it
                    does, this table will populate. Block/unblock actions are wired and will
                    work as soon as that endpoint returns business IDs.
                </div>
            )}

            <div className="max-w-5xl rounded-md overflow-hidden border border-borderColor mt-4">
                <table className="w-full text-sm">
                    <thead className="bg-light text-gray-500">
                        <tr>
                            <th className="p-3 text-left font-medium">Business</th>
                            <th className="p-3 text-left font-medium">Owner</th>
                            <th className="p-3 text-left font-medium">Status</th>
                            <th className="p-3 text-left font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-6 text-center text-gray-500">
                                    No businesses.
                                </td>
                            </tr>
                        )}
                        {items.map((b) => (
                            <tr key={b._id} className="border-t border-borderColor">
                                <td className="p-3">{b.name}</td>
                                <td className="p-3">{b.user?.name || b.user?.email}</td>
                                <td className="p-3">{b.status}</td>
                                <td className="p-3 text-xs">
                                    {b.status === "blocked" ? (
                                        <button
                                            onClick={() => unblock(b)}
                                            className="px-2 py-1 bg-green-600 text-white rounded"
                                        >
                                            Unblock
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setBlockTarget(b)}
                                            className="px-2 py-1 bg-red-500 text-white rounded"
                                        >
                                            Block
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {blockTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setBlockTarget(null)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold mb-2">Block Business</h2>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Reason"
                            className="w-full border border-borderColor rounded-md p-2 text-sm mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setBlockTarget(null)}
                                className="flex-1 border border-borderColor rounded-md py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={block}
                                className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm"
                            >
                                Block
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Businesses;
