import React, { useEffect, useState } from "react";
import { assets, locationPlaceholder } from "../../assets/assets";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const VERIFICATION_COLORS = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
};

const getCarThumb = (car) => {
    const fromAttach = car?.attachments?.find?.((a) => a.category === "car_image");
    if (fromAttach) return fromAttach.thumbnailUrl || fromAttach.url;
    if (Array.isArray(car?.images) && car.images.length > 0) {
        return car.images[0].thumbnailUrl || car.images[0].url;
    }
    return null;
};

const ManageCars = () => {
    const { isOwner, axios, currency } = useAppContext();
    const [cars, setCars] = useState([]);
    const [expanded, setExpanded] = useState(null); // car _id being expanded
    const [editing, setEditing] = useState(null); // car object being edited

    const fetchOwnerCars = async () => {
        try {
            const { data } = await axios.get("/api/car/business-cars");
            if (data.success) setCars(data.cars);
            else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const toggleAvailability = async (carId) => {
        try {
            const { data } = await axios.patch("/api/car/toggle-availability", { carId });
            if (data.success) {
                toast.success(data.message);
                fetchOwnerCars();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const deleteCar = async (carId) => {
        if (!window.confirm("Delete this car? This cannot be undone.")) return;
        try {
            const { data } = await axios.delete("/api/car/delete", { data: { carId } });
            if (data.success) {
                toast.success(data.message);
                fetchOwnerCars();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const deleteAttachment = async (carId, attachmentId) => {
        if (!window.confirm("Delete this attachment?")) return;
        try {
            const { data } = await axios.delete("/api/car/delete-attachment", {
                data: { carId, attachmentId },
            });
            if (data.success) {
                toast.success(data.message);
                fetchOwnerCars();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        if (isOwner) fetchOwnerCars();
    }, [isOwner]);

    return (
        <div className="px-4 pt-10 md:px-10 w-full">
            <Title
                title="Manage Cars"
                subTitle="View, edit, and manage availability of your listed cars."
            />

            <div className="max-w-5xl w-full rounded-md overflow-hidden border border-borderColor mt-6">
                <table className="w-full border-collapse text-left text-sm text-gray-600">
                    <thead className="text-gray-500 bg-light">
                        <tr>
                            <th className="p-3 font-medium">Car</th>
                            <th className="p-3 font-medium max-md:hidden">Category</th>
                            <th className="p-3 font-medium">Price</th>
                            <th className="p-3 font-medium max-md:hidden">Verification</th>
                            <th className="p-3 font-medium max-md:hidden">Available</th>
                            <th className="p-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cars.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-6 text-center text-gray-500">
                                    No cars listed yet.
                                </td>
                            </tr>
                        )}
                        {cars.map((car) => {
                            const thumb = getCarThumb(car);
                            return (
                                <React.Fragment key={car._id}>
                                    <tr className="border-t border-borderColor">
                                        <td className="p-3 flex items-center gap-3">
                                            {thumb ? (
                                                <img
                                                    src={thumb}
                                                    alt=""
                                                    className="h-12 w-12 aspect-square rounded-md object-cover"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                                                    —
                                                </div>
                                            )}
                                            <div className="max-md:hidden">
                                                <p className="font-medium">
                                                    {car.brand} {car.model}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {car.seating_capacity} seats • {car.transmission}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-3 max-md:hidden">{car.category}</td>
                                        <td className="p-3">
                                            {currency}
                                            {car.pricePerDay}/day
                                        </td>
                                        <td className="p-3 max-md:hidden">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs ${
                                                    VERIFICATION_COLORS[car.verification_status] ||
                                                    "bg-gray-100 text-gray-600"
                                                }`}
                                            >
                                                {car.verification_status}
                                            </span>
                                        </td>
                                        <td className="p-3 max-md:hidden">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs ${
                                                    car.isAvailable
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {car.isAvailable ? "Available" : "Unavailable"}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleAvailability(car._id)}
                                                    title={
                                                        car.isAvailable
                                                            ? "Mark unavailable"
                                                            : "Mark available"
                                                    }
                                                >
                                                    <img
                                                        src={
                                                            car.isAvailable
                                                                ? assets.eye_close_icon
                                                                : assets.eye_icon
                                                        }
                                                        alt=""
                                                        className="cursor-pointer"
                                                    />
                                                </button>
                                                <button
                                                    onClick={() => setEditing(car)}
                                                    title="Edit"
                                                >
                                                    <img
                                                        src={assets.edit_icon}
                                                        alt=""
                                                        className="cursor-pointer"
                                                    />
                                                </button>
                                                <button
                                                    onClick={() => deleteCar(car._id)}
                                                    title="Delete"
                                                >
                                                    <img
                                                        src={assets.delete_icon}
                                                        alt=""
                                                        className="cursor-pointer"
                                                    />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setExpanded(
                                                            expanded === car._id ? null : car._id
                                                        )
                                                    }
                                                    className="text-xs text-primary underline"
                                                >
                                                    {expanded === car._id ? "Hide" : "Files"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expanded === car._id && (
                                        <tr className="border-t border-borderColor bg-light">
                                            <td colSpan={6} className="p-4">
                                                <p className="text-sm font-medium mb-2">
                                                    Attachments
                                                </p>
                                                {(!car.attachments || car.attachments.length === 0) && (
                                                    <p className="text-xs text-gray-500">
                                                        No attachments yet.
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-3">
                                                    {(car.attachments || []).map((a) => (
                                                        <div
                                                            key={a._id}
                                                            className="relative h-20 w-28 rounded-md overflow-hidden border border-borderColor bg-white"
                                                        >
                                                            {a.type === "image" ? (
                                                                <img
                                                                    src={a.thumbnailUrl || a.url}
                                                                    alt=""
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <a
                                                                    href={a.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex items-center justify-center h-full w-full text-xs text-primary p-2 text-center"
                                                                >
                                                                    {a.category}
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={() =>
                                                                    deleteAttachment(car._id, a._id)
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
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {editing && (
                <EditCarModal
                    car={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        fetchOwnerCars();
                    }}
                />
            )}
        </div>
    );
};

const EditCarModal = ({ car, onClose, onSaved }) => {
    const { axios, currency } = useAppContext();
    const [form, setForm] = useState({
        brand: car.brand || "",
        model: car.model || "",
        year: car.year || "",
        pricePerDay: car.pricePerDay || "",
        category: car.category || "",
        transmission: car.transmission || "",
        fuel_type: car.fuel_type || "",
        seating_capacity: car.seating_capacity || "",
        location: car.location || "",
        description: car.description || "",
    });
    const [newImages, setNewImages] = useState([]);
    const [newDocs, setNewDocs] = useState([]);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("carId", car._id);
            Object.entries(form).forEach(([k, v]) => formData.append(k, v));
            newImages.forEach((f) => formData.append("images", f));
            newDocs.forEach((f) => formData.append("documents", f));

            const { data } = await axios.put("/api/car/update", formData);
            if (data.success) {
                toast.success(data.message);
                onSaved();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl p-6 max-w-2xl w-full my-8"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-semibold mb-4">Edit Car</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {[
                        ["brand", "Brand"],
                        ["model", "Model"],
                        ["year", "Year", "number"],
                        ["pricePerDay", `Price (${currency})`, "number"],
                        ["category", "Category"],
                        ["transmission", "Transmission"],
                        ["fuel_type", "Fuel Type"],
                        ["seating_capacity", "Seating Capacity", "number"],
                        ["location", "Location"],
                    ].map(([key, label, type = "text"]) => (
                        <div key={key} className="flex flex-col">
                            <label className="text-gray-500">{label}</label>
                            <input
                                type={type}
                                value={form[key]}
                                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                placeholder={key === "location" ? locationPlaceholder : ""}
                                className="border border-borderColor rounded-md px-2 py-1.5 outline-none"
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-4">
                    <label className="text-gray-500 text-sm">Description</label>
                    <textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full border border-borderColor rounded-md px-2 py-1.5 outline-none mt-1 text-sm"
                    />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <label className="border border-dashed border-borderColor rounded-md p-3 text-center cursor-pointer">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            hidden
                            onChange={(e) => setNewImages(Array.from(e.target.files || []))}
                        />
                        Add images ({newImages.length})
                    </label>
                    <label className="border border-dashed border-borderColor rounded-md p-3 text-center cursor-pointer">
                        <input
                            type="file"
                            multiple
                            hidden
                            onChange={(e) => setNewDocs(Array.from(e.target.files || []))}
                        />
                        Add documents ({newDocs.length})
                    </label>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-borderColor rounded-md text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-white rounded-md text-sm disabled:opacity-60"
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageCars;
