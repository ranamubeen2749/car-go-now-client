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
        <div className="h-screen flex flex-col overflow-hidden bg-white">
            <NavbarDriver />
            <div className="flex flex-1 min-h-0">
                <aside className="shrink-0 h-full overflow-hidden">
                    <Sidebar />
                </aside>
                <main className="flex-1 min-h-0 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
