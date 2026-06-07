import React, { useEffect } from "react";
import NavbarAdmin from "../../components/admin/NavbarAdmin";
import Sidebar from "../../components/admin/Sidebar";
import { Outlet } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const Layout = () => {
    const { isAdmin, navigate } = useAppContext();

    useEffect(() => {
        if (!isAdmin) navigate("/");
    }, [isAdmin]);

    return (
        <div className="flex flex-col">
            <NavbarAdmin />
            <div className="flex">
                <Sidebar />
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
