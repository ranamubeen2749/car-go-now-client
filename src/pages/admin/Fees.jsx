import React, { useEffect, useState } from "react";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const STATUS_COLORS = {
    unpaid: "bg-red-100 text-red-700",
    pending_verification: "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const Fees = () => {
    const { axios, currency } = useAppContext();
    const [fees, setFees] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState("");
    const [entityType, setEntityType] = useState("");
    const [period, setPeriod] = useState("");
    const [generating, setGenerating] = useState(false);
    const [proofLightbox, setProofLightbox] = useState(null);

    const fetchFees = async () => {
        try {
            const params = {};
            if (paymentStatus) params.payment_status = paymentStatus;
            if (entityType) params.entity_type = entityType;
            if (period) params.period = period;
            const { data } = await axios.get("/api/admin/fees", { params });
            if (data.success) setFees(data.fees);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        fetchFees();
    }, [paymentStatus, entityType, period]);

    const handleGenerate = async () => {
        if (!window.confirm("Generate fees for the current cycle?")) return;
        setGenerating(true);
        try {
            const { data } = await axios.post("/api/admin/fees/generate");
            if (data.success) {
                toast.success(data.message || "Fees generated");
                fetchFees();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleVerify = async (fee) => {
        if (!window.confirm(`Mark fee for ${fee.entity?.name || fee.entity_id} as paid?`))
            return;
        try {
            const { data } = await axios.post("/api/admin/fees/verify", { feeId: fee._id });
            if (data.success) {
                toast.success(data.message);
                fetchFees();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    return (
        <div className="px-4 pt-10 md:px-10 w-full">
            <Title
                title="Platform Fees"
                subTitle="Generate cycle fees and verify uploaded payment proofs from businesses and drivers."
            />

            <div className="flex flex-wrap items-center gap-3 mt-6">
                <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="border border-borderColor rounded-md px-2 py-1.5 text-sm"
                >
                    <option value="">All payment statuses</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="pending_verification">Pending verification</option>
                    <option value="paid">Paid</option>
                </select>
                <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="border border-borderColor rounded-md px-2 py-1.5 text-sm"
                >
                    <option value="">All entities</option>
                    <option value="business">Business</option>
                    <option value="independent_driver">Independent driver</option>
                </select>
                <input
                    placeholder="Period (e.g. 2026-06)"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="border border-borderColor rounded-md px-2 py-1.5 text-sm"
                />
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="bg-primary text-white text-sm rounded-md px-3 py-1.5 disabled:opacity-60"
                >
                    {generating ? "Generating…" : "Generate fees"}
                </button>
            </div>

            <div className="max-w-6xl w-full rounded-md overflow-hidden border border-borderColor mt-4">
                <table className="w-full border-collapse text-left text-sm text-gray-600">
                    <thead className="text-gray-500 bg-light">
                        <tr>
                            <th className="p-3 font-medium">Entity</th>
                            <th className="p-3 font-medium">Period</th>
                            <th className="p-3 font-medium">Gross</th>
                            <th className="p-3 font-medium">Fee</th>
                            <th className="p-3 font-medium">Due</th>
                            <th className="p-3 font-medium">Status</th>
                            <th className="p-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fees.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-6 text-center text-gray-500">
                                    No fees match these filters.
                                </td>
                            </tr>
                        )}
                        {fees.map((fee) => (
                            <tr key={fee._id} className="border-t border-borderColor">
                                <td className="p-3 text-xs">
                                    <p className="font-medium">
                                        {fee.entity?.name || fee.entity_id}
                                    </p>
                                    <p className="text-gray-500">{fee.entity_type}</p>
                                </td>
                                <td className="p-3">{fee.period}</td>
                                <td className="p-3">
                                    {currency}
                                    {fee.gross_earning}
                                </td>
                                <td className="p-3 font-medium">
                                    {currency}
                                    {fee.fee_amount}
                                </td>
                                <td className="p-3">{fmtDate(fee.dueAt)}</td>
                                <td className="p-3">
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs ${
                                            STATUS_COLORS[fee.payment_status] ||
                                            "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                        {fee.payment_status?.replace(/_/g, " ")}
                                    </span>
                                </td>
                                <td className="p-3 text-xs">
                                    <div className="flex flex-wrap gap-2">
                                        {fee.proof_attachment?.url && (
                                            <button
                                                onClick={() =>
                                                    setProofLightbox(fee.proof_attachment.url)
                                                }
                                                className="px-2 py-1 border border-borderColor rounded"
                                            >
                                                View proof
                                            </button>
                                        )}
                                        {fee.payment_status === "pending_verification" && (
                                            <button
                                                onClick={() => handleVerify(fee)}
                                                className="px-2 py-1 bg-green-600 text-white rounded"
                                            >
                                                Verify
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {proofLightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setProofLightbox(null)}
                >
                    <img
                        src={proofLightbox}
                        alt="payment proof"
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded"
                    />
                </div>
            )}
        </div>
    );
};

export default Fees;
