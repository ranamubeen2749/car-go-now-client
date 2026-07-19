import React, { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const TABS = [
    { key: "cars", label: "Cars" },
    { key: "independent-drivers", label: "Independent Drivers" },
    { key: "renter-licenses", label: "Renter Licenses" },
    { key: "booking-payments", label: "Booking Payments" },
    { key: "business-drivers", label: "Business Drivers" },
];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const Verifications = () => {
    const location = useLocation();
    const active = location.pathname.split("/")[3] || "cars";

    return (
        <div className="px-4 pt-10 md:px-10 w-full max-w-7xl">
            <Title
                title="Verification Queues"
                subTitle="Approve pending cars, drivers, licenses, and booking payment proofs."
            />

            <div className="flex gap-2 mt-6 border-b border-borderColor overflow-x-auto">
                {TABS.map((t) => (
                    <Link
                        key={t.key}
                        to={`/admin/verifications/${t.key}`}
                        className={`px-4 py-2 text-sm border-b-2 whitespace-nowrap ${
                            active === t.key
                                ? "border-primary text-primary font-medium"
                                : "border-transparent text-gray-500"
                        }`}
                    >
                        {t.label}
                    </Link>
                ))}
            </div>

            <div className="mt-6">
                <Outlet />
            </div>
        </div>
    );
};

/* ============ Pending Cars ============ */
export const PendingCars = () => {
    const { axios, currency } = useAppContext();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [reason, setReason] = useState("");

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get("/api/admin/cars", {
                params: { verification_status: "pending", limit: 50 },
            });
            if (data.success) setItems(data.cars || []);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [axios]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const approve = async (c) => {
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
        if (!reason.trim()) return toast.error("Reason is required");
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
        <QueueTable
            loading={loading}
            empty="No cars awaiting approval."
            count={items.length}
            heading="Pending cars"
        >
            <thead className="bg-light text-gray-500">
                <tr>
                    <th className="p-3 text-left font-medium">Car</th>
                    <th className="p-3 text-left font-medium">Business</th>
                    <th className="p-3 text-left font-medium">Price/day</th>
                    <th className="p-3 text-left font-medium">Created</th>
                    <th className="p-3 text-left font-medium">Actions</th>
                </tr>
            </thead>
            <tbody>
                {items.map((c) => (
                    <tr key={c._id} className="border-t border-borderColor">
                        <td className="p-3">
                            <div className="font-medium">
                                {c.brand} {c.model}
                            </div>
                            <div className="text-xs text-gray-500">{c.year}</div>
                        </td>
                        <td className="p-3 text-xs">{c.business?.name || "—"}</td>
                        <td className="p-3">
                            {currency}
                            {c.pricePerDay}
                        </td>
                        <td className="p-3 text-xs">{fmtDate(c.createdAt)}</td>
                        <td className="p-3 text-xs">
                            <div className="flex gap-1 flex-wrap">
                                <button
                                    onClick={() => approve(c)}
                                    className="px-2 py-1 bg-green-600 text-white rounded"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => setRejectTarget(c)}
                                    className="px-2 py-1 bg-red-500 text-white rounded"
                                >
                                    Reject
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
            {rejectTarget && (
                <ReasonModal
                    title={`Reject ${rejectTarget.brand} ${rejectTarget.model}`}
                    reason={reason}
                    setReason={setReason}
                    onCancel={() => setRejectTarget(null)}
                    onSubmit={submitReject}
                />
            )}
        </QueueTable>
    );
};

/* ============ Pending Independent Drivers ============ */
export const PendingIndependentDrivers = () => {
    const { axios, currency } = useAppContext();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [reason, setReason] = useState("");

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get("/api/admin/drivers", {
                params: { verification_status: "pending", limit: 50 },
            });
            if (data.success) setItems(data.drivers || []);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [axios]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const approve = async (d) => {
        try {
            const { data } = await axios.post("/api/admin/driver/approve", { driverId: d._id });
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
        if (!reason.trim()) return toast.error("Reason is required");
        try {
            const { data } = await axios.post("/api/admin/driver/reject", {
                driverId: rejectTarget._id,
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
        <QueueTable
            loading={loading}
            empty="No independent drivers awaiting approval."
            count={items.length}
            heading="Pending independent drivers"
        >
            <thead className="bg-light text-gray-500">
                <tr>
                    <th className="p-3 text-left font-medium">Driver</th>
                    <th className="p-3 text-left font-medium">User</th>
                    <th className="p-3 text-left font-medium">City</th>
                    <th className="p-3 text-left font-medium">Price/day</th>
                    <th className="p-3 text-left font-medium">Created</th>
                    <th className="p-3 text-left font-medium">Actions</th>
                </tr>
            </thead>
            <tbody>
                {items.map((d) => (
                    <tr key={d._id} className="border-t border-borderColor">
                        <td className="p-3 font-medium">{d.name}</td>
                        <td className="p-3 text-xs">{d.user?.email || "—"}</td>
                        <td className="p-3 text-xs">{d.city || "—"}</td>
                        <td className="p-3">
                            {currency}
                            {d.pricePerDay}
                        </td>
                        <td className="p-3 text-xs">{fmtDate(d.createdAt)}</td>
                        <td className="p-3 text-xs">
                            <div className="flex gap-1 flex-wrap">
                                <button
                                    onClick={() => approve(d)}
                                    className="px-2 py-1 bg-green-600 text-white rounded"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => setRejectTarget(d)}
                                    className="px-2 py-1 bg-red-500 text-white rounded"
                                >
                                    Reject
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
            {rejectTarget && (
                <ReasonModal
                    title={`Reject ${rejectTarget.name}`}
                    reason={reason}
                    setReason={setReason}
                    onCancel={() => setRejectTarget(null)}
                    onSubmit={submitReject}
                />
            )}
        </QueueTable>
    );
};

/* ============ Pending Renter Licenses ============ */
export const PendingLicenses = () => {
    const { axios } = useAppContext();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [reason, setReason] = useState("");
    const [preview, setPreview] = useState(null);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get("/api/admin/pending-licenses", {
                params: { limit: 50 },
            });
            if (data.success) setItems(data.users || []);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [axios]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const verify = async (u) => {
        try {
            const { data } = await axios.post("/api/admin/user/verify-license", {
                userId: u._id,
            });
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
        if (!reason.trim()) return toast.error("Reason is required");
        try {
            const { data } = await axios.post("/api/admin/user/reject-license", {
                userId: rejectTarget._id,
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
        <QueueTable
            loading={loading}
            empty="No renter licenses awaiting verification."
            count={items.length}
            heading="Pending renter licenses"
        >
            <thead className="bg-light text-gray-500">
                <tr>
                    <th className="p-3 text-left font-medium">User</th>
                    <th className="p-3 text-left font-medium">Phone</th>
                    <th className="p-3 text-left font-medium">Documents</th>
                    <th className="p-3 text-left font-medium">Actions</th>
                </tr>
            </thead>
            <tbody>
                {items.map((u) => (
                    <tr key={u._id} className="border-t border-borderColor align-top">
                        <td className="p-3">
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="p-3 text-xs">{u.phone || "—"}</td>
                        <td className="p-3">
                            <div className="flex flex-wrap gap-2">
                                {(u.licenses || []).map((l) => (
                                    <button
                                        key={l._id}
                                        onClick={() => setPreview(l.url)}
                                        className="block w-16 h-12 rounded border border-borderColor overflow-hidden"
                                    >
                                        <img
                                            src={l.url}
                                            alt="license"
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                                {(!u.licenses || u.licenses.length === 0) && (
                                    <span className="text-xs text-gray-400">
                                        No files uploaded
                                    </span>
                                )}
                            </div>
                        </td>
                        <td className="p-3 text-xs">
                            <div className="flex gap-1 flex-wrap">
                                <button
                                    onClick={() => verify(u)}
                                    className="px-2 py-1 bg-green-600 text-white rounded"
                                >
                                    Verify
                                </button>
                                <button
                                    onClick={() => setRejectTarget(u)}
                                    className="px-2 py-1 bg-red-500 text-white rounded"
                                >
                                    Reject
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
            {rejectTarget && (
                <ReasonModal
                    title={`Reject ${rejectTarget.name}'s license`}
                    reason={reason}
                    setReason={setReason}
                    onCancel={() => setRejectTarget(null)}
                    onSubmit={submitReject}
                />
            )}
            {preview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setPreview(null)}
                >
                    <img
                        src={preview}
                        alt="License preview"
                        className="max-w-4xl max-h-[90vh]"
                    />
                </div>
            )}
        </QueueTable>
    );
};

/* ============ Pending Booking Payments ============ */
export const PendingBookingPayments = () => {
    const { axios, currency } = useAppContext();
    const [bookingType, setBookingType] = useState("car");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            // No dedicated endpoint — use generic /admin/bookings and filter client-side
            const { data } = await axios.get("/api/admin/bookings", {
                params: { bookingType, status: "pending", limit: 50 },
            });
            if (data.success) {
                const all = data.bookings || [];
                setItems(
                    all.filter((b) => b.paymentStatus === "pending_verification")
                );
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [axios, bookingType]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const verify = async (b) => {
        if (!window.confirm("Mark this payment as verified?")) return;
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
        <>
            <div className="flex border border-borderColor rounded-md overflow-hidden mb-4 w-fit">
                {["car", "driver"].map((t) => (
                    <button
                        key={t}
                        onClick={() => setBookingType(t)}
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
            <QueueTable
                loading={loading}
                empty="No payment proofs awaiting verification."
                count={items.length}
                heading={`Pending ${bookingType} payment proofs`}
            >
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
                        <th className="p-3 text-left font-medium">Amount</th>
                        <th className="p-3 text-left font-medium">Proof</th>
                        <th className="p-3 text-left font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((b) => (
                        <tr key={b._id} className="border-t border-borderColor">
                            <td className="p-3">
                                <div>{b.user?.name}</div>
                                <div className="text-xs text-gray-500">{b.user?.email}</div>
                            </td>
                            {bookingType === "car" ? (
                                <>
                                    <td className="p-3 text-xs">
                                        {b.car?.brand} {b.car?.model}
                                    </td>
                                    <td className="p-3 text-xs">{b.business?.name || "—"}</td>
                                </>
                            ) : (
                                <td className="p-3 text-xs">
                                    {b.independentDriver?.name || "—"}
                                </td>
                            )}
                            <td className="p-3">
                                {currency}
                                {b.price}
                            </td>
                            <td className="p-3">
                                {b.payment_proof?.url ? (
                                    <button
                                        onClick={() => setPreview(b.payment_proof.url)}
                                        className="block w-16 h-12 rounded border border-borderColor overflow-hidden"
                                    >
                                        <img
                                            src={b.payment_proof.url}
                                            alt="proof"
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ) : (
                                    <span className="text-xs text-gray-400">No proof</span>
                                )}
                            </td>
                            <td className="p-3 text-xs">
                                <button
                                    onClick={() => verify(b)}
                                    className="px-2 py-1 bg-green-600 text-white rounded"
                                >
                                    Verify
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
                {preview && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                        onClick={() => setPreview(null)}
                    >
                        <img
                            src={preview}
                            alt="Payment proof"
                            className="max-w-4xl max-h-[90vh]"
                        />
                    </div>
                )}
            </QueueTable>
        </>
    );
};

/* ============ Pending Business Drivers ============ */
export const PendingBusinessDrivers = () => {
    const { axios } = useAppContext();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [reason, setReason] = useState("");
    const [preview, setPreview] = useState(null);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get("/api/admin/business-drivers", {
                params: { verification_status: "pending", limit: 50 },
            });
            if (data.success) setItems(data.drivers || []);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [axios]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const approve = async (driver) => {
        try {
            const { data } = await axios.post("/api/admin/business-driver/approve", {
                driverId: driver._id,
            });
            if (data.success) {
                toast.success(data.message);
                fetchList();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const submitReject = async () => {
        if (!rejectTarget || !reason.trim()) return toast.error("Reason is required");
        try {
            const { data } = await axios.post("/api/admin/business-driver/reject", {
                driverId: rejectTarget._id,
                reason: reason.trim(),
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
        <QueueTable
            loading={loading}
            empty="No business drivers awaiting approval."
            count={items.length}
            heading="Pending business drivers"
        >
            <thead className="bg-light text-gray-500">
                <tr>
                    <th className="p-3 text-left font-medium">Driver</th>
                    <th className="p-3 text-left font-medium">Business</th>
                    <th className="p-3 text-left font-medium">License</th>
                    <th className="p-3 text-left font-medium">Created</th>
                    <th className="p-3 text-left font-medium">Actions</th>
                </tr>
            </thead>
            <tbody>
                {items.map((driver) => (
                    <tr key={driver._id} className="border-t border-borderColor align-top">
                        <td className="p-3">
                            <div className="font-medium">
                                {driver.name}
                                {driver.isOwnerSelf ? " (owner)" : ""}
                            </div>
                            <div className="text-xs text-gray-500">{driver.phone}</div>
                        </td>
                        <td className="p-3 text-xs">{driver.business?.name || "—"}</td>
                        <td className="p-3">
                            <div className="flex flex-wrap gap-2">
                                {(driver.licenseDocuments || []).map((document) => (
                                    <button
                                        key={document._id}
                                        onClick={() => setPreview(document.url)}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        View document
                                    </button>
                                ))}
                                {!driver.licenseDocuments?.length && (
                                    <span className="text-xs text-gray-400">No document</span>
                                )}
                            </div>
                        </td>
                        <td className="p-3 text-xs">{fmtDate(driver.createdAt)}</td>
                        <td className="p-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => approve(driver)}
                                    className="px-2 py-1 bg-green-600 text-white rounded"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => setRejectTarget(driver)}
                                    className="px-2 py-1 bg-red-500 text-white rounded"
                                >
                                    Reject
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
            {rejectTarget && (
                <ReasonModal
                    title={`Reject ${rejectTarget.name}`}
                    reason={reason}
                    setReason={setReason}
                    onCancel={() => setRejectTarget(null)}
                    onSubmit={submitReject}
                />
            )}
            {preview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setPreview(null)}
                >
                    <img
                        src={preview}
                        alt="Driver license"
                        className="max-w-4xl max-h-[90vh]"
                    />
                </div>
            )}
        </QueueTable>
    );
};

/* ============ Helpers ============ */
const QueueTable = ({ loading, empty, count, heading, children }) => (
    <div>
        <div className="flex justify-between items-center mb-3">
            <h2 className="font-medium">{heading}</h2>
            <span className="text-xs text-gray-500">
                {loading ? "Loading…" : `${count} item${count === 1 ? "" : "s"}`}
            </span>
        </div>
        <div className="rounded-md overflow-hidden border border-borderColor">
            <table className="w-full text-sm">
                {React.Children.toArray(children).filter(
                    (c) => c?.type === "thead" || c?.type === "tbody"
                )}
            </table>
        </div>
        {!loading && count === 0 && (
            <div className="text-center text-sm text-gray-500 py-6">{empty}</div>
        )}
        {React.Children.toArray(children).filter(
            (c) => c?.type !== "thead" && c?.type !== "tbody"
        )}
    </div>
);

const ReasonModal = ({ title, reason, setReason, onCancel, onSubmit }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onCancel}
    >
        <div
            className="bg-white rounded-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
        >
            <h2 className="text-lg font-semibold mb-2">{title}</h2>
            <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason"
                className="w-full border border-borderColor rounded-md p-2 text-sm mb-4"
            />
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 border border-borderColor rounded-md py-2 text-sm"
                >
                    Cancel
                </button>
                <button
                    onClick={onSubmit}
                    className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm"
                >
                    Submit
                </button>
            </div>
        </div>
    </div>
);

export default Verifications;
