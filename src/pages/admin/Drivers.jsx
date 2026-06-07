import React, { useEffect, useState } from "react";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

// Lists all independent drivers via the public listings endpoint
// (no admin-only listing exists in current docs). Block/unblock are wired.

const Drivers = () => {
    const { axios } = useAppContext();
    const [items, setItems] = useState([]);
    const [blockTarget, setBlockTarget] = useState(null);
    const [reason, setReason] = useState("");

    const fetch = async () => {
        try {
            const { data } = await axios.get("/api/driver/listings", {
                params: { limit: 100 },
            });
            if (data.success) setItems(data.drivers);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
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
            const { data } = await axios.post("/api/admin/driver/block", {
                driverId: blockTarget._id,
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

    const unblock = async (d) => {
        try {
            const { data } = await axios.post("/api/admin/driver/unblock", {
                driverId: d._id,
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
                title="Independent Drivers"
                subTitle="Block or unblock independent drivers."
            />
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 my-4 max-w-2xl text-sm">
                The public listings endpoint hides blocked drivers, so this list shows only
                visible drivers today. Backend should add{" "}
                <code>GET /api/admin/drivers</code> to list every driver including blocked ones.
            </div>

            <div className="max-w-5xl rounded-md overflow-hidden border border-borderColor mt-4">
                <table className="w-full text-sm">
                    <thead className="bg-light text-gray-500">
                        <tr>
                            <th className="p-3 text-left font-medium">Name</th>
                            <th className="p-3 text-left font-medium">City</th>
                            <th className="p-3 text-left font-medium">Price</th>
                            <th className="p-3 text-left font-medium">Status</th>
                            <th className="p-3 text-left font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-6 text-center text-gray-500">
                                    No drivers.
                                </td>
                            </tr>
                        )}
                        {items.map((d) => (
                            <tr key={d._id} className="border-t border-borderColor">
                                <td className="p-3">{d.name}</td>
                                <td className="p-3">{d.city}</td>
                                <td className="p-3">{d.pricePerDay}</td>
                                <td className="p-3">{d.status}</td>
                                <td className="p-3 text-xs">
                                    {d.status === "blocked" ? (
                                        <button
                                            onClick={() => unblock(d)}
                                            className="px-2 py-1 bg-green-600 text-white rounded"
                                        >
                                            Unblock
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setBlockTarget(d)}
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
                        <h2 className="text-lg font-semibold mb-2">Block Driver</h2>
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

export default Drivers;
