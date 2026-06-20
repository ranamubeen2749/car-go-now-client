import React from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const NavbarDriver = () => {
    const { user, logout } = useAppContext();

    return (
        <div className="flex items-center justify-between px-6 md:px-10 py-4 text-gray-500 border-b border-borderColor bg-white shrink-0 z-50">
            <Link to="/">
                <h2 className="font-bold text-2xl">
                    Car <span className="text-primary">Go Now</span>
                </h2>
            </Link>
            <div className="flex items-center gap-4">
                <p className="max-sm:hidden">Welcome, {user?.name || "Driver"}</p>
                <button
                    onClick={logout}
                    className="cursor-pointer px-5 py-2 bg-primary hover:bg-primary-dull transition-all text-white rounded-lg text-sm"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default NavbarDriver;
