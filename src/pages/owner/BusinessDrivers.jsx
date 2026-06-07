import React, { useEffect, useState } from "react";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const VERIFICATION_COLORS = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
};

const BusinessDrivers = () => {
    const { axios } = useAppContext();
    const [drivers, setDrivers] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [showAddOwner, setShowAddOwner] = useState(false);
    const [editing, setEditing] = useState(null);

    const fetchDrivers = async () => {
        try {
            const { data } = await axios.get("/api/business-driver/list");
            if (data.success) setDrivers(data.drivers);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const toggleStatus = async (driverId) => {
        try {
            const { data } = await axios.patch("/api/business-driver/toggle-status", {
                driverId,
            });
            if (data.success) {
                toast.success(data.message);
                fetchDrivers();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const deleteDriver = async (driverId) => {
        if (!window.confirm("Delete this driver?")) return;
        try {
            const { data } = await axios.delete("/api/business-driver/delete", {
                data: { driverId },
            });
            if (data.success) {
                toast.success(data.message);
                fetchDrivers();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const deleteLicense = async (driverId, attachmentId) => {
        if (!window.confirm("Delete this license document?")) return;
        try {
            const { data } = await axios.delete("/api/business-driver/delete-license", {
                data: { driverId, attachmentId },
            });
            if (data.success) {
                toast.success(data.message);
                fetchDrivers();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    return (
        <div className="px-4 pt-10 md:px-10 w-full">
            <Title
                title="Business Drivers"
                subTitle="Drivers you can assign to with-driver bookings. Each driver requires admin approval."
            />

            <div className="flex flex-wrap gap-3 mt-6">
                <button
                    onClick={() => setShowAdd(true)}
                    className="px-4 py-2 bg-primary text-white text-sm rounded-md"
                >
                    + Add Driver
                </button>
                <button
                    onClick={() => setShowAddOwner(true)}
                    className="px-4 py-2 border border-borderColor text-sm rounded-md"
                >
                    Register myself as a driver
                </button>
            </div>

            <div className="max-w-5xl w-full rounded-md overflow-hidden border border-borderColor mt-6">
                <table className="w-full border-collapse text-left text-sm text-gray-600">
                    <thead className="text-gray-500 bg-light">
                        <tr>
                            <th className="p-3 font-medium">Name</th>
                            <th className="p-3 font-medium max-md:hidden">Phone</th>
                            <th className="p-3 font-medium max-md:hidden">License #</th>
                            <th className="p-3 font-medium">Verification</th>
                            <th className="p-3 font-medium">Status</th>
                            <th className="p-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-6 text-center text-gray-500">
                                    No drivers yet.
                                </td>
                            </tr>
                        )}
                        {drivers.map((d) => (
                            <React.Fragment key={d._id}>
                                <tr className="border-t border-borderColor">
                                    <td className="p-3">
                                        {d.name}
                                        {d.isOwnerSelf && (
                                            <span className="ml-2 text-xs text-primary">(you)</span>
                                        )}
                                    </td>
                                    <td className="p-3 max-md:hidden">{d.phone}</td>
                                    <td className="p-3 max-md:hidden">{d.licenseNumber}</td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs ${
                                                VERIFICATION_COLORS[d.verification_status] ||
                                                "bg-gray-100 text-gray-600"
                                            }`}
                                        >
                                            {d.verification_status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs ${
                                                d.status === "active"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-200 text-gray-600"
                                            }`}
                                        >
                                            {d.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => toggleStatus(d._id)}
                                                className="text-xs px-2 py-1 border border-borderColor rounded"
                                            >
                                                {d.status === "active" ? "Deactivate" : "Activate"}
                                            </button>
                                            {!d.isOwnerSelf && (
                                                <>
                                                    <button
                                                        onClick={() => setEditing(d)}
                                                        className="text-xs px-2 py-1 border border-borderColor rounded"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteDriver(d._id)}
                                                        className="text-xs px-2 py-1 bg-red-500 text-white rounded"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {d.licenseDocuments?.length > 0 && (
                                    <tr className="bg-light">
                                        <td colSpan={6} className="p-3">
                                            <p className="text-xs text-gray-500 mb-2">
                                                License documents
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {d.licenseDocuments.map((doc) => (
                                                    <div
                                                        key={doc._id}
                                                        className="relative h-16 w-24 rounded border border-borderColor overflow-hidden bg-white"
                                                    >
                                                        <a
                                                            href={doc.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center justify-center h-full w-full text-xs text-primary"
                                                        >
                                                            View
                                                        </a>
                                                        <button
                                                            onClick={() =>
                                                                deleteLicense(d._id, doc._id)
                                                            }
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAdd && (
                <AddDriverModal
                    onClose={() => setShowAdd(false)}
                    onSaved={() => {
                        setShowAdd(false);
                        fetchDrivers();
                    }}
                />
            )}

            {showAddOwner && (
                <AddOwnerAsDriverModal
                    onClose={() => setShowAddOwner(false)}
                    onSaved={() => {
                        setShowAddOwner(false);
                        fetchDrivers();
                    }}
                />
            )}

            {editing && (
                <EditDriverModal
                    driver={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        fetchDrivers();
                    }}
                />
            )}
        </div>
    );
};

const AddDriverModal = ({ onClose, onSaved }) => {
    const { axios } = useAppContext();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [licenseNumber, setLicenseNumber] = useState("");
    const [licenses, setLicenses] = useState([]);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("phone", phone);
            formData.append("licenseNumber", licenseNumber);
            licenses.forEach((f) => formData.append("licenses", f));
            const { data } = await axios.post("/api/business-driver/add-driver", formData);
            if (data.success) {
                toast.success(data.message);
                onSaved();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal onClose={onClose} title="Add Driver">
            <FormFields>
                <Field label="Name" value={name} onChange={setName} required />
                <Field label="Phone" value={phone} onChange={setPhone} required />
                <Field
                    label="License Number"
                    value={licenseNumber}
                    onChange={setLicenseNumber}
                    required
                />
                <FileField
                    label="License documents (up to 5)"
                    onChange={(files) => setLicenses(files.slice(0, 5))}
                    multiple
                />
            </FormFields>
            <ModalActions
                onCancel={onClose}
                onConfirm={handleSave}
                confirmText={saving ? "Saving…" : "Save"}
                disabled={saving || !name || !phone || !licenseNumber}
            />
        </Modal>
    );
};

const AddOwnerAsDriverModal = ({ onClose, onSaved }) => {
    const { axios } = useAppContext();
    const [phone, setPhone] = useState("");
    const [licenseNumber, setLicenseNumber] = useState("");
    const [licenses, setLicenses] = useState([]);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("phone", phone);
            formData.append("licenseNumber", licenseNumber);
            licenses.forEach((f) => formData.append("licenses", f));
            const { data } = await axios.post(
                "/api/business-driver/add-owner-as-driver",
                formData
            );
            if (data.success) {
                toast.success(data.message);
                onSaved();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal onClose={onClose} title="Register Myself as Driver">
            <FormFields>
                <Field label="Phone" value={phone} onChange={setPhone} required />
                <Field
                    label="License Number"
                    value={licenseNumber}
                    onChange={setLicenseNumber}
                    required
                />
                <FileField
                    label="License documents (up to 5)"
                    onChange={(files) => setLicenses(files.slice(0, 5))}
                    multiple
                />
            </FormFields>
            <ModalActions
                onCancel={onClose}
                onConfirm={handleSave}
                confirmText={saving ? "Saving…" : "Save"}
                disabled={saving || !phone || !licenseNumber}
            />
        </Modal>
    );
};

const EditDriverModal = ({ driver, onClose, onSaved }) => {
    const { axios } = useAppContext();
    const [name, setName] = useState(driver.name || "");
    const [phone, setPhone] = useState(driver.phone || "");
    const [licenseNumber, setLicenseNumber] = useState(driver.licenseNumber || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data } = await axios.put("/api/business-driver/update", {
                driverId: driver._id,
                name,
                phone,
                licenseNumber,
            });
            if (data.success) {
                toast.success(data.message);
                onSaved();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal onClose={onClose} title="Edit Driver">
            <FormFields>
                <Field label="Name" value={name} onChange={setName} required />
                <Field label="Phone" value={phone} onChange={setPhone} required />
                <Field
                    label="License Number"
                    value={licenseNumber}
                    onChange={setLicenseNumber}
                    required
                />
            </FormFields>
            <ModalActions
                onCancel={onClose}
                onConfirm={handleSave}
                confirmText={saving ? "Saving…" : "Save"}
                disabled={saving}
            />
        </Modal>
    );
};

// --- tiny local UI helpers (kept inline to honor "no api layer + plain components") ---

const Modal = ({ title, onClose, children }) => (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
        onClick={onClose}
    >
        <div
            className="bg-white rounded-xl p-6 max-w-md w-full my-8"
            onClick={(e) => e.stopPropagation()}
        >
            <h2 className="text-lg font-semibold mb-4">{title}</h2>
            {children}
        </div>
    </div>
);

const FormFields = ({ children }) => <div className="flex flex-col gap-3">{children}</div>;

const Field = ({ label, value, onChange, required }) => (
    <label className="block text-sm">
        <span className="text-gray-500">{label}</span>
        <input
            type="text"
            value={value}
            required={required}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
        />
    </label>
);

const FileField = ({ label, onChange, multiple }) => (
    <label className="block text-sm">
        <span className="text-gray-500">{label}</span>
        <input
            type="file"
            multiple={multiple}
            onChange={(e) => onChange(Array.from(e.target.files || []))}
            className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
        />
    </label>
);

const ModalActions = ({ onCancel, onConfirm, confirmText, disabled }) => (
    <div className="flex gap-3 mt-6">
        <button
            onClick={onCancel}
            className="flex-1 border border-borderColor rounded-md py-2 text-sm"
        >
            Cancel
        </button>
        <button
            onClick={onConfirm}
            disabled={disabled}
            className="flex-1 bg-primary text-white rounded-md py-2 text-sm disabled:opacity-60"
        >
            {confirmText}
        </button>
    </div>
);

export default BusinessDrivers;
