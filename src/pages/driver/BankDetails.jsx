import React, { useEffect, useState } from "react";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

// NOTE: The independent-driver docs do NOT currently expose a
// `PUT /api/driver/bank-details` endpoint. We attempt the call and
// surface a clear error to the user / dev console so the missing
// endpoint is obvious to the backend team.

const BankDetails = () => {
    const { axios } = useAppContext();
    const [driver, setDriver] = useState(null);
    const [bank_name, setBankName] = useState("");
    const [account_number, setAccountNumber] = useState("");
    const [account_name, setAccountName] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchProfile = async () => {
        try {
            const { data } = await axios.get("/api/driver/profile");
            if (data.success) {
                setDriver(data.driver);
                setBankName(data.driver.bank_name || "");
                setAccountNumber(data.driver.account_number || "");
                setAccountName(data.driver.account_name || "");
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
            // Targeted at the (unconfirmed) endpoint; backend team may need to add it.
            const { data } = await axios.put("/api/driver/bank-details", {
                bank_name,
                account_number,
                account_name,
            });
            if (data.success) {
                toast.success(data.message || "Bank details updated");
                fetchProfile();
            } else toast.error(data.message);
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            toast.error(msg);
            console.warn(
                "Driver bank-details endpoint may not exist on backend yet. See plan Phase 6 open questions."
            );
        } finally {
            setSaving(false);
        }
    };

    const isSet = driver?.bank_name && driver?.account_number && driver?.account_name;

    return (
        <div className="px-4 pt-10 md:px-10 flex-1">
            <Title
                title="Bank Details"
                subTitle="Where customers will send prepaid bookings for you. Required before the prepaid option appears on your listing."
            />

            {!isSet && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 my-6 max-w-xl">
                    Bank details not set — customers can only choose <strong>cash</strong> for
                    your hire requests.
                </div>
            )}

            <form onSubmit={handleSave} className="max-w-xl flex flex-col gap-4 mt-6 text-sm">
                <label>
                    <span className="text-gray-500">Bank Name</span>
                    <input
                        value={bank_name}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                        required
                    />
                </label>
                <label>
                    <span className="text-gray-500">Account Number</span>
                    <input
                        value={account_number}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                        required
                    />
                </label>
                <label>
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
