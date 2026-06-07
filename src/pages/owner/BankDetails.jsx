import React, { useEffect, useState } from "react";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const BankDetails = () => {
    const { axios } = useAppContext();
    const [business, setBusiness] = useState(null);
    const [bank_name, setBankName] = useState("");
    const [account_number, setAccountNumber] = useState("");
    const [account_name, setAccountName] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchProfile = async () => {
        try {
            const { data } = await axios.get("/api/business/profile");
            if (data.success) {
                setBusiness(data.business);
                setBankName(data.business.bank_name || "");
                setAccountNumber(data.business.account_number || "");
                setAccountName(data.business.account_name || "");
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
        if (!bank_name || !account_number || !account_name) {
            toast.error("All three fields are required");
            return;
        }
        setSaving(true);
        try {
            const { data } = await axios.put("/api/business/bank-details", {
                bank_name,
                account_number,
                account_name,
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

    const isSet = business?.bank_name && business?.account_number && business?.account_name;

    return (
        <div className="px-4 pt-10 md:px-10 flex-1">
            <Title
                title="Bank Details"
                subTitle="Where customers will send prepaid bookings. Required before the prepaid option appears for your cars."
            />

            {!isSet && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 my-6 max-w-xl">
                    Bank details not set — only <strong>cash</strong> bookings are available for
                    your cars.
                </div>
            )}

            <form onSubmit={handleSave} className="max-w-xl flex flex-col gap-4 mt-6">
                <label className="text-sm">
                    <span className="text-gray-500">Bank Name</span>
                    <input
                        value={bank_name}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                        required
                    />
                </label>
                <label className="text-sm">
                    <span className="text-gray-500">Account Number</span>
                    <input
                        value={account_number}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                        required
                    />
                </label>
                <label className="text-sm">
                    <span className="text-gray-500">Account Holder Name</span>
                    <input
                        value={account_name}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                        required
                    />
                </label>
                <button
                    disabled={saving}
                    className="bg-primary text-white rounded-md px-4 py-2 w-fit text-sm disabled:opacity-60"
                >
                    {saving ? "Saving…" : "Save Bank Details"}
                </button>
            </form>
        </div>
    );
};

export default BankDetails;
