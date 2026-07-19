import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const RequireRole = ({ role, children }) => {
    const { user, authLoading, currentRole, hasRoles, openLogin, switchRole } =
        useAppContext();

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            openLogin("login", "customer");
            return;
        }
        if (currentRole !== role && hasRoles.includes(role)) {
            switchRole(role);
        } else if (!hasRoles.includes(role)) {
            toast.error(`You don't have access to the ${role.replace("_", " ")} area`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user, currentRole, role]);

    if (authLoading) {
        return (
            <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-16 text-sm text-gray-500">
                Restoring your session…
            </div>
        );
    }
    if (!user) return <Navigate to="/" replace />;
    if (!hasRoles.includes(role)) return <Navigate to="/" replace />;
    if (currentRole !== role) {
        return (
            <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-16 text-sm text-gray-500">
                Switching to {role.replace("_", " ")}…
            </div>
        );
    }

    return children;
};

export default RequireRole;
