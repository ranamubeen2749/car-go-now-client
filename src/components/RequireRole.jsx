import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import PageState from "./PageState";

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
        return <PageState title="Restoring your session" description="Checking your account access…" loading />;
    }
    if (!user) return <Navigate to="/" replace />;
    if (!hasRoles.includes(role)) return <Navigate to="/" replace />;
    if (currentRole !== role) {
        return (
            <PageState
                title={`Switching to ${role.replaceAll("_", " ")}`}
                description="Your workspace will be ready in a moment."
                loading
            />
        );
    }

    return children;
};

export default RequireRole;
