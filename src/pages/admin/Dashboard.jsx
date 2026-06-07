import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const Dashboard = () => {
    const { axios, currency, isAdmin } = useAppContext();
    const [unpaid, setUnpaid] = useState([]);
    const [pendingVerif, setPendingVerif] = useState([]);

    useEffect(() => {
        if (!isAdmin) return;
        (async () => {
            try {
                const [u, p] = await Promise.all([
                    axios.get("/api/admin/fees", { params: { payment_status: "unpaid" } }),
                    axios.get("/api/admin/fees", {
                        params: { payment_status: "pending_verification" },
                    }),
                ]);
                if (u.data?.success) setUnpaid(u.data.fees || []);
                if (p.data?.success) setPendingVerif(p.data.fees || []);
            } catch (error) {
                toast.error(error.response?.data?.message || error.message);
            }
        })();
    }, [axios, isAdmin]);

    const sum = (arr) => arr.reduce((acc, f) => acc + (f.fee_amount || 0), 0);

    return (
        <div className="px-4 pt-10 md:px-10 flex-1">
            <Title
                title="Admin Dashboard"
                subTitle="Quick view of outstanding fees and pending verifications. (Dedicated admin dashboard endpoint is pending backend.)"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-4xl">
                <Card
                    label="Unpaid fees"
                    value={`${currency}${sum(unpaid)}`}
                    sub={`${unpaid.length} record(s)`}
                />
                <Card
                    label="Awaiting verification"
                    value={`${currency}${sum(pendingVerif)}`}
                    sub={`${pendingVerif.length} record(s)`}
                />
                <Card
                    label="Quick action"
                    value={<Link to="/admin/fees" className="text-primary underline">Manage fees →</Link>}
                />
            </div>

            <div className="mt-10 max-w-4xl">
                <h2 className="font-medium text-lg mb-3">Most overdue (unpaid)</h2>
                <div className="border border-borderColor rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-light text-gray-500">
                            <tr>
                                <th className="p-3 text-left font-medium">Entity</th>
                                <th className="p-3 text-left font-medium">Period</th>
                                <th className="p-3 text-left font-medium">Amount</th>
                                <th className="p-3 text-left font-medium">Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unpaid.slice(0, 10).map((f) => (
                                <tr key={f._id} className="border-t border-borderColor">
                                    <td className="p-3">
                                        {f.entity_type} — {f.entity?.name || f.entity_id}
                                    </td>
                                    <td className="p-3">{f.period}</td>
                                    <td className="p-3">
                                        {currency}
                                        {f.fee_amount}
                                    </td>
                                    <td className="p-3">{fmtDate(f.dueAt)}</td>
                                </tr>
                            ))}
                            {unpaid.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-6 text-center text-gray-500">
                                        No unpaid fees.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const Card = ({ label, value, sub }) => (
    <div className="p-4 border border-borderColor rounded-md">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
);

export default Dashboard;
