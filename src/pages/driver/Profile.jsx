import React, { useEffect, useState } from "react";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import { locationPlaceholder } from "../../assets/assets";
import toast from "react-hot-toast";

const Profile = () => {
    const { axios } = useAppContext();
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({
        phone: "",
        bio: "",
        pricePerDay: "",
        city: "",
    });
    const [saving, setSaving] = useState(false);

    const fetchProfile = async () => {
        try {
            const { data } = await axios.get("/api/driver/profile");
            if (data.success) {
                setProfile(data.driver);
                setForm({
                    phone: data.driver.phone || "",
                    bio: data.driver.bio || "",
                    pricePerDay: data.driver.pricePerDay || "",
                    city: data.driver.city || "",
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
            const { data } = await axios.put("/api/driver/profile", {
                ...form,
                pricePerDay: Number(form.pricePerDay),
            });
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
                title="Driver Profile"
                subTitle="Update your phone, bio, daily rate, and city. Visible in driver listings."
            />

            {profile && (
                <div className="mt-4 text-sm text-gray-500">
                    Name: <span className="font-medium text-gray-700">{profile.name}</span> ·
                    License #:{" "}
                    <span className="font-medium text-gray-700">{profile.licenseNumber}</span>{" "}
                    · Status: <span className="font-medium">{profile.verification_status}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="max-w-xl flex flex-col gap-4 mt-6 text-sm">
                <label className="block">
                    <span className="text-gray-500">Phone</span>
                    <input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                    />
                </label>
                <label className="block">
                    <span className="text-gray-500">City</span>
                    <input
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder={locationPlaceholder}
                        className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                    />
                </label>
                <label className="block">
                    <span className="text-gray-500">Price per day</span>
                    <input
                        type="number"
                        value={form.pricePerDay}
                        onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
                        className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                    />
                </label>
                <label className="block">
                    <span className="text-gray-500">Bio</span>
                    <textarea
                        rows={4}
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                    />
                </label>
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

export default Profile;
