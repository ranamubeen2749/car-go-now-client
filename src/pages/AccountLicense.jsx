import React, { useEffect, useState } from "react";
import Title from "../components/Title";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const STATUS_COLORS = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const AccountLicense = () => {
    const { axios, user } = useAppContext();
    const [licenses, setLicenses] = useState([]);
    const [licenseNumber, setLicenseNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fetchLicenses = async () => {
        try {
            const { data } = await axios.get("/api/user/license/my-licenses");
            if (data.success) setLicenses(data.licenses || []);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        if (user) fetchLicenses();
    }, [user]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !licenseNumber) {
            toast.error("License number and file required");
            return;
        }
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("licenseNumber", licenseNumber);
            if (expiryDate) formData.append("expiryDate", expiryDate);
            formData.append("license", file);
            const { data } = await axios.post("/api/user/license/upload", formData);
            if (data.success) {
                toast.success(data.message);
                setLicenseNumber("");
                setExpiryDate("");
                setFile(null);
                fetchLicenses();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (licenseId) => {
        if (!window.confirm("Delete this license?")) return;
        try {
            const { data } = await axios.delete("/api/user/license/delete", {
                data: { licenseId },
            });
            if (data.success) {
                toast.success(data.message);
                fetchLicenses();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    if (!user) {
        return (
            <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-16">
                <Title title="My Driving License" subTitle="Please log in" align="left" />
            </div>
        );
    }

    return (
        <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-16 max-w-4xl">
            <Title
                title="My Driving License"
                subTitle="Upload your driving license to unlock self-drive car bookings. Admin will verify it."
                align="left"
            />

            <div className="mt-4 text-sm text-gray-500">
                Your verification status:{" "}
                <span className="font-medium">{user.verificationStatus || "not_submitted"}</span>
            </div>

            <div className="border border-borderColor rounded-md overflow-hidden mt-6">
                <table className="w-full text-sm">
                    <thead className="bg-light text-gray-500">
                        <tr>
                            <th className="text-left p-3 font-medium">License #</th>
                            <th className="text-left p-3 font-medium">Expiry</th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-left p-3 font-medium">Submitted</th>
                            <th className="p-3 font-medium" />
                        </tr>
                    </thead>
                    <tbody>
                        {licenses.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-6 text-center text-gray-500">
                                    No license uploaded yet.
                                </td>
                            </tr>
                        )}
                        {licenses.map((l) => (
                            <tr key={l._id} className="border-t border-borderColor">
                                <td className="p-3">{l.licenseNumber}</td>
                                <td className="p-3">{fmtDate(l.expiryDate)}</td>
                                <td className="p-3">
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs ${
                                            STATUS_COLORS[l.verification_status] ||
                                            "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                        {l.verification_status}
                                    </span>
                                </td>
                                <td className="p-3">{fmtDate(l.createdAt)}</td>
                                <td className="p-3 text-right text-xs">
                                    {l.attachment?.url && (
                                        <a
                                            href={l.attachment.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary underline mr-3"
                                        >
                                            View
                                        </a>
                                    )}
                                    <button
                                        onClick={() => handleDelete(l._id)}
                                        className="text-red-500"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <form onSubmit={handleUpload} className="mt-10 max-w-xl flex flex-col gap-3 text-sm">
                <h2 className="text-lg font-medium">Upload a license</h2>
                <label>
                    <span className="text-gray-500">License number</span>
                    <input
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                        required
                    />
                </label>
                <label>
                    <span className="text-gray-500">Expiry date</span>
                    <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                    />
                </label>
                <label>
                    <span className="text-gray-500">License image/PDF</span>
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                        required
                    />
                </label>
                <button
                    disabled={uploading}
                    className="bg-primary text-white rounded-md px-4 py-2 w-fit text-sm disabled:opacity-60 mt-2"
                >
                    {uploading ? "Uploading…" : "Upload"}
                </button>
            </form>
        </div>
    );
};

export default AccountLicense;
