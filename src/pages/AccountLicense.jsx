import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Title from "../components/Title";
import { useAppContext } from "../context/AppContext";
import PageState from "../components/PageState";

const STATUS_STYLES = {
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-red-200 bg-red-50 text-red-700",
    not_submitted: "border-slate-200 bg-slate-50 text-slate-600",
};

const fmtDate = (date) => (date ? new Date(date).toLocaleDateString() : "—");

const AccountLicense = () => {
    const { axios, user, fetchUser } = useAppContext();
    const [attachments, setAttachments] = useState([]);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchLicenses = useCallback(async () => {
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
    }, [axios]);

    useEffect(() => {
        if (user) fetchLicenses();
    }, [user, fetchLicenses]);

    const handleUpload = async (event) => {
        event.preventDefault();
        if (!files.length) return toast.error("Please select at least one license file");
        if (files.length > 5) return toast.error("Max 5 files allowed");

        setUploading(true);
        try {
            const formData = new FormData();
            files.forEach((file) => formData.append("licenses", file));
            const { data } = await axios.post("/api/user/license/upload", formData);
            if (data.success) {
                toast.success(data.message);
                setFiles([]);
                event.target.reset();
                await Promise.all([fetchLicenses(), fetchUser?.()]);
            } else {
                toast.error(data.message);
            }
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
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    if (!user) {
        return (
            <main className="min-h-[65vh] bg-light px-6 py-14 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-5xl">
                    <Title
                        title="My Driving License"
                        subTitle="Please log in to manage your license verification."
                        align="left"
                    />
                </div>
            </main>
        );
    }

    const status = user.verificationStatus || "not_submitted";
    const isVerified = Boolean(user.isVerified);

    return (
        <main className="min-h-screen bg-light px-6 py-14 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-5xl">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <Title
                        eyebrow="Customer verification"
                        title="My Driving License"
                        subTitle="Upload your license for admin review before booking a self-drive car."
                        align="left"
                    />
                    <div
                        className={`rounded-2xl border px-5 py-4 ${
                            STATUS_STYLES[status] || STATUS_STYLES.not_submitted
                        }`}
                    >
                        <p className="text-xs font-bold uppercase tracking-[0.14em]">
                            Verification status
                        </p>
                        <p className="mt-1 text-lg font-semibold capitalize">
                            {status.replace(/_/g, " ")}
                        </p>
                    </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                    <section className="ui-card overflow-hidden">
                        <div className="flex items-center justify-between border-b border-borderColor px-5 py-4 sm:px-6">
                            <div>
                                <h2 className="font-semibold text-ink">Submitted documents</h2>
                                <p className="mt-1 text-xs text-muted">
                                    {attachments.length} of 5 files uploaded
                                </p>
                            </div>
                            {isVerified && (
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    Self-drive enabled
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <PageState
                                compact
                                loading
                                title="Loading your documents"
                                description="Checking the latest verification status…"
                            />
                        ) : attachments.length === 0 ? (
                            <div className="p-10 text-center">
                                <p className="font-semibold text-ink">No license uploaded yet</p>
                                <p className="mt-2 text-sm text-muted">
                                    Add a clear image or PDF using the upload panel.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-borderColor">
                                {attachments.map((attachment) => (
                                    <article
                                        key={attachment._id}
                                        className="flex items-center gap-4 p-4 sm:p-5"
                                    >
                                        {attachment.thumbnailUrl || attachment.url ? (
                                            <a
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="shrink-0"
                                            >
                                                <img
                                                    src={attachment.thumbnailUrl || attachment.url}
                                                    alt="Driving license preview"
                                                    className="h-16 w-20 rounded-xl border border-borderColor object-cover"
                                                />
                                            </a>
                                        ) : (
                                            <div className="grid h-16 w-20 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs text-muted">
                                                PDF
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold capitalize text-ink">
                                                {(attachment.category || "driver_license").replace(
                                                    /_/g,
                                                    " "
                                                )}
                                            </p>
                                            <p className="mt-1 text-xs text-muted">
                                                Submitted {fmtDate(attachment.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-2">
                                            <a
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="ui-button ui-button-secondary"
                                            >
                                                View
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(attachment._id)}
                                                className="ui-button ui-button-secondary text-red-600"
                                                disabled={isVerified}
                                                title={
                                                    isVerified
                                                        ? "Verified licenses cannot be removed"
                                                        : ""
                                                }
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <form onSubmit={handleUpload} className="ui-card p-5 sm:p-6 lg:sticky lg:top-24">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                            Submit for review
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-ink">
                            Upload license documents
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-muted">
                            Add up to 5 image or PDF files. Re-uploading returns your status
                            to pending.
                        </p>

                        <label className="mt-5 block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-700 hover:border-primary">
                            License files
                            <input
                                type="file"
                                multiple
                                accept="image/*,application/pdf"
                                onChange={(event) =>
                                    setFiles(Array.from(event.target.files || []))
                                }
                                className="mt-3 block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-semibold file:text-white"
                            />
                        </label>

                        {files.length > 0 && (
                            <p className="mt-3 break-words text-xs leading-5 text-muted">
                                Selected: {files.map((file) => file.name).join(", ")}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={uploading || files.length === 0}
                            className="ui-button mt-5 min-h-11 w-full disabled:opacity-60"
                        >
                            {uploading ? "Uploading…" : "Upload"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default AccountLicense;
