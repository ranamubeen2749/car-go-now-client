import React, { useEffect } from "react";
import NavbarDriver from "../../components/driver/NavbarDriver";
import Sidebar from "../../components/driver/Sidebar";
import { Outlet } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const Layout = () => {
    const { isDriver, navigate } = useAppContext();

    useEffect(() => {
        if (!isDriver) navigate("/");
    }, [isDriver]);

    return (
        <div className="flex flex-col">
            <NavbarDriver />
            <div className="flex">
                <Sidebar />
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
