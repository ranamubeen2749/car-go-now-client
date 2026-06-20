import React, { useEffect, useState } from "react";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import { locationPlaceholder } from "../../assets/assets";
import toast from "react-hot-toast";

const BusinessProfile = () => {
    const { axios } = useAppContext();
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({
        name: "",
        phone: "",
        address: "",
        city: "",
        country: "",
    });
    const [saving, setSaving] = useState(false);

    const fetchProfile = async () => {
        try {
            const { data } = await axios.get("/api/business/profile");
            if (data.success) {
                setProfile(data.business);
                setForm({
                    name: data.business.name || "",
                    phone: data.business.phone || "",
                    address: data.business.address || "",
                    city: data.business.city || "",
                    country: data.business.country || "",
                });
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await axios.put("/api/business/profile", form);
            if (data.success) {
                toast.success(data.message);
                fetchProfile();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="px-4 pt-10 md:px-10 flex-1">
            <Title
                title="Business Profile"
                subTitle="Your business name, contact, and address. Visible to customers on car listings."
            />

            {profile && (
                <p className="text-sm text-gray-500 mt-4">
                    Status:{" "}
                    <span
                        className={`px-2 py-0.5 rounded-full ${
                            profile.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }`}
                    >
                        {profile.status}
                    </span>
                </p>
            )}

            <form onSubmit={handleSave} className="max-w-xl flex flex-col gap-4 mt-6 text-sm">
                {[
                    ["name", "Business Name", ""],
                    ["phone", "Phone", ""],
                    ["address", "Address", "e.g. Main Boulevard, Gulberg III"],
                    ["city", "City", locationPlaceholder],
                    ["country", "Country", "Pakistan"],
                ].map(([key, label, placeholder]) => (
                    <label key={key} className="block">
                        <span className="text-gray-500">{label}</span>
                        <input
                            value={form[key]}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            placeholder={placeholder}
                            className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                        />
                    </label>
                ))}
                <button
                    disabled={saving}
                    className="bg-primary text-white rounded-md px-4 py-2 w-fit text-sm disabled:opacity-60"
                >
                    {saving ? "Saving…" : "Save"}
                </button>
            </form>
        </div>
    );
};

export default BusinessProfile;
