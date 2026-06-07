import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Title from "../../components/owner/Title";

const TABS = [
    { key: "cars", label: "Cars" },
    { key: "business-drivers", label: "Business Drivers" },
    { key: "independent-drivers", label: "Independent Drivers" },
    { key: "renter-licenses", label: "Renter Licenses" },
    { key: "booking-payments", label: "Booking Payments" },
];

const Verifications = () => {
    const location = useLocation();
    const active = location.pathname.split("/")[3] || "cars";

    return (
        <div className="px-4 pt-10 md:px-10 w-full">
            <Title
                title="Verification Queues"
                subTitle="Approve pending cars, drivers, licenses, and booking payment proofs."
            />

            <div className="flex gap-2 mt-6 border-b border-borderColor overflow-x-auto">
                {TABS.map((t) => (
                    <Link
                        key={t.key}
                        to={`/admin/verifications/${t.key}`}
                        className={`px-4 py-2 text-sm border-b-2 whitespace-nowrap ${
                            active === t.key
                                ? "border-primary text-primary font-medium"
                                : "border-transparent text-gray-500"
                        }`}
                    >
                        {t.label}
                    </Link>
                ))}
            </div>

            <div className="mt-6">
                <Outlet />
            </div>
        </div>
    );
};

export const VerificationPlaceholder = ({ entity, endpoint }) => (
    <div className="border border-borderColor rounded-md p-6 bg-light text-sm text-gray-600 max-w-3xl">
        <p className="font-medium text-base mb-2">{entity} — coming soon</p>
        <p>
            Backend does not yet expose a queue endpoint for {entity}. Once the team adds{" "}
            <code className="bg-white px-1 rounded">{endpoint}</code>, this view will list
            pending records with approve/reject actions.
        </p>
    </div>
);

export default Verifications;
