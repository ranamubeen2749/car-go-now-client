import React, { useEffect, useState } from "react";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const GROUP_BY_KEY = {
    business_fee_percentage: "Fees",
    driver_fee_percentage: "Fees",
    fee_cycle: "Cycle",
    fee_deadline_days: "Cycle",
    payment_bank_name: "Platform Bank",
    payment_account_number: "Platform Bank",
    payment_account_name: "Platform Bank",
};

const Settings = () => {
    const { axios } = useAppContext();
    const [settings, setSettings] = useState([]);
    const [drafts, setDrafts] = useState({});
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [newDesc, setNewDesc] = useState("");

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get("/api/admin/settings");
            if (data.success) {
                setSettings(data.settings);
                const next = {};
                data.settings.forEach((s) => {
                    next[s.key] = { value: s.value, description: s.description || "" };
                });
                setDrafts(next);
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const saveOne = async (key) => {
        try {
            const draft = drafts[key] || {};
            const { data } = await axios.put("/api/admin/settings", {
                key,
                value: draft.value,
                description: draft.description,
            });
            if (data.success) {
                toast.success("Saved");
                fetchSettings();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const addNew = async (e) => {
        e.preventDefault();
        if (!newKey || newValue === "") {
            toast.error("Key and value are required");
            return;
        }
        try {
            const { data } = await axios.put("/api/admin/settings", {
                key: newKey,
                value: newValue,
                description: newDesc,
            });
            if (data.success) {
                toast.success("Saved");
                setNewKey("");
                setNewValue("");
                setNewDesc("");
                fetchSettings();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const grouped = settings.reduce((acc, s) => {
        const g = GROUP_BY_KEY[s.key] || "Other";
        if (!acc[g]) acc[g] = [];
        acc[g].push(s);
        return acc;
    }, {});

    return (
        <div className="px-4 pt-10 md:px-10 w-full">
            <Title
                title="Platform Settings"
                subTitle="Tune fee percentages, payment cycle, deadline, and the platform bank account."
            />

            {Object.entries(grouped).map(([group, items]) => (
                <div key={group} className="mt-6 max-w-3xl">
                    <h2 className="text-lg font-medium mb-2">{group}</h2>
                    <div className="border border-borderColor rounded-md overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-light text-gray-500">
                                <tr>
                                    <th className="text-left p-3 font-medium">Key</th>
                                    <th className="text-left p-3 font-medium">Value</th>
                                    <th className="text-left p-3 font-medium">Description</th>
                                    <th className="p-3 font-medium" />
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((s) => (
                                    <tr key={s.key} className="border-t border-borderColor">
                                        <td className="p-3 font-mono text-xs">{s.key}</td>
                                        <td className="p-3">
                                            <input
                                                value={drafts[s.key]?.value ?? ""}
                                                onChange={(e) =>
                                                    setDrafts({
                                                        ...drafts,
                                                        [s.key]: {
                                                            ...drafts[s.key],
                                                            value: e.target.value,
                                                        },
                                                    })
                                                }
                                                className="border border-borderColor rounded p-1 text-sm w-full"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                value={drafts[s.key]?.description ?? ""}
                                                onChange={(e) =>
                                                    setDrafts({
                                                        ...drafts,
                                                        [s.key]: {
                                                            ...drafts[s.key],
                                                            description: e.target.value,
                                                        },
                                                    })
                                                }
                                                className="border border-borderColor rounded p-1 text-sm w-full"
                                            />
                                        </td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => saveOne(s.key)}
                                                className="px-3 py-1 bg-primary text-white text-xs rounded"
                                            >
                                                Save
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            <form onSubmit={addNew} className="max-w-3xl mt-10 mb-12 text-sm">
                <h2 className="text-lg font-medium mb-2">Add or update a setting</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <label>
                        <span className="text-gray-500">Key</span>
                        <input
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                            className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                            placeholder="e.g. fee_cycle"
                        />
                    </label>
                    <label>
                        <span className="text-gray-500">Value</span>
                        <input
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                        />
                    </label>
                    <label>
                        <span className="text-gray-500">Description</span>
                        <input
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            className="w-full border border-borderColor rounded-md p-2 mt-1 outline-none"
                        />
                    </label>
                </div>
                <button
                    type="submit"
                    className="mt-3 px-4 py-2 bg-primary text-white rounded-md text-sm"
                >
                    Save Setting
                </button>
            </form>
        </div>
    );
};

export default Settings;
