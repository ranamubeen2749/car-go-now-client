import React, { useEffect, useState } from "react";
import Title from "../components/Title";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const STATUS_COLORS = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    not_submitted: "bg-gray-100 text-gray-600",
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const AccountLicense = () => {
    const { axios, user, fetchUser } = useAppContext();
    const [attachments, setAttachments] = useState([]);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchLicenses = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get("/api/user/license/my-licenses");
            if (data.success) setAttachments(data.attachments || []);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchLicenses();
    }, [user]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!files.length) {
            toast.error("Please select at least one license file");
            return;
        }
        if (files.length > 5) {
            toast.error("Max 5 files allowed");
            return;
        }
        setUploading(true);
        try {
            const formData = new FormData();
            files.forEach((f) => formData.append("licenses", f));
            const { data } = await axios.post("/api/user/license/upload", formData);
            if (data.success) {
                toast.success(data.message);
                setFiles([]);
                e.target.reset();
                await Promise.all([fetchLicenses(), fetchUser?.()]);
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (attachmentId) => {
        if (!window.confirm("Delete this license document?")) return;
        try {
            const { data } = await axios.delete("/api/user/license/delete", {
                data: { attachmentId },
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

    const status = user.verificationStatus || "not_submitted";
    const isVerified = !!user.isVerified;

    return (
        <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-16 max-w-4xl">
            <Title
                title="My Driving License"
                subTitle="Upload one or more driving license documents. Admin verifies these before you can book a self-drive car."
                align="left"
            />

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-gray-500">Verification status:</span>
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[status] || STATUS_COLORS.not_submitted
                    }`}
                >
                    {status.replace("_", " ")}
                </span>
                {isVerified && (
                    <span className="text-green-700 text-xs">
                        Verified — you can book self-drive cars.
                    </span>
                )}
                {!isVerified && status === "pending" && attachments.length > 0 && (
                    <span className="text-yellow-700 text-xs">
                        Awaiting admin review.
                    </span>
                )}
            </div>

            <div className="border border-borderColor rounded-md overflow-hidden mt-6">
                <table className="w-full text-sm">
                    <thead className="bg-light text-gray-500">
                        <tr>
                            <th className="text-left p-3 font-medium">Preview</th>
                            <th className="text-left p-3 font-medium">Category</th>
                            <th className="text-left p-3 font-medium">Submitted</th>
                            <th className="p-3 font-medium" />
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={4} className="p-6 text-center text-gray-500">
                                    Loading…
                                </td>
                            </tr>
                        )}
                        {!loading && attachments.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-6 text-center text-gray-500">
                                    No license uploaded yet.
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            attachments.map((a) => (
                                <tr key={a._id} className="border-t border-borderColor">
                                    <td className="p-3">
                                        {a.thumbnailUrl || a.url ? (
                                            <a
                                                href={a.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-block"
                                            >
                                                <img
                                                    src={a.thumbnailUrl || a.url}
                                                    alt="license"
                                                    className="w-16 h-12 object-cover rounded border border-borderColor"
                                                />
                                            </a>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td className="p-3 capitalize">
                                        {(a.category || "driving_license").replace("_", " ")}
                                    </td>
                                    <td className="p-3">{fmtDate(a.createdAt)}</td>
                                    <td className="p-3 text-right text-xs">
                                        <a
                                            href={a.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary underline mr-3"
                                        >
                                            View
                                        </a>
                                        <button
                                            onClick={() => handleDelete(a._id)}
                                            className="text-red-500 disabled:opacity-50"
                                            disabled={isVerified}
                                            title={
                                                isVerified
                                                    ? "Verified licenses cannot be removed"
                                                    : ""
                                            }
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
                <h2 className="text-lg font-medium">Upload license documents</h2>
                <p className="text-xs text-gray-500">
                    You can upload up to 5 files at once (images or PDFs). Re-uploading sets your
                    status back to pending until admin re-verifies.
                </p>
                <label>
                    <span className="text-gray-500">License files</span>
                    <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={(e) => setFiles(Array.from(e.target.files || []))}
                        className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                    />
                </label>
                {files.length > 0 && (
                    <div className="text-xs text-gray-500">
                        Selected: {files.map((f) => f.name).join(", ")}
                    </div>
                )}
                <button
                    disabled={uploading || files.length === 0}
                    className="bg-primary text-white rounded-md px-4 py-2 w-fit text-sm disabled:opacity-60 mt-2"
                >
                    {uploading ? "Uploading…" : "Upload"}
                </button>
            </form>
        </div>
    );
};

export default AccountLicense;
