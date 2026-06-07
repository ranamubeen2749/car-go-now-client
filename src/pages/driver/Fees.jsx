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
    const [uploadTarget, setUploadTarget] = useState(null);
    const [file, setFile] = useState(null);
    const [proofLightbox, setProofLightbox] = useState(null);

    const fetchFees = async () => {
        try {
            const { data } = await axios.get("/api/driver/fees");
            if (data.success) setFees(data.fees);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        fetchFees();
    }, []);

    const handleUpload = async () => {
        if (!file || !uploadTarget) return;
        try {
            const formData = new FormData();
            formData.append("feeId", uploadTarget._id);
            formData.append("proof", file);
            const { data } = await axios.post(
                "/api/driver/fees/upload-proof",
                formData
            );
            if (data.success) {
                toast.success(data.message);
                setUploadTarget(null);
                setFile(null);
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
                subTitle="Your periodic commission to the platform. Pay via bank transfer and upload a screenshot for admin verification."
            />

            <div className="max-w-5xl w-full rounded-md overflow-hidden border border-borderColor mt-6">
                <table className="w-full border-collapse text-left text-sm text-gray-600">
                    <thead className="text-gray-500 bg-light">
                        <tr>
                            <th className="p-3 font-medium">Period</th>
                            <th className="p-3 font-medium">Gross</th>
                            <th className="p-3 font-medium">Rate</th>
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
                                    No fee records yet.
                                </td>
                            </tr>
                        )}
                        {fees.map((fee) => (
                            <tr key={fee._id} className="border-t border-borderColor">
                                <td className="p-3">{fee.period}</td>
                                <td className="p-3">
                                    {currency}
                                    {fee.gross_earning}
                                </td>
                                <td className="p-3">{fee.fee_percentage}%</td>
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
                                        {fee.payment_status !== "paid" && (
                                            <button
                                                onClick={() => setUploadTarget(fee)}
                                                className="px-2 py-1 bg-primary text-white rounded"
                                            >
                                                {fee.proof_attachment ? "Re-upload" : "Upload"} proof
                                            </button>
                                        )}
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
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {uploadTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setUploadTarget(null)}
                >
                    <div
                        className="bg-white rounded-xl p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold mb-2">
                            Upload Fee Payment Proof
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Transfer {currency}
                            {uploadTarget.fee_amount} for period {uploadTarget.period}, then
                            upload the screenshot.
                        </p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="w-full border border-borderColor rounded-md p-2 text-sm mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setUploadTarget(null);
                                    setFile(null);
                                }}
                                className="flex-1 border border-borderColor rounded-md py-2 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!file}
                                className="flex-1 bg-primary text-white rounded-md py-2 text-sm disabled:opacity-60"
                            >
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
