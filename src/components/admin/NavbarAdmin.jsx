import React from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const NavbarAdmin = () => {
    const { user } = useAppContext();

    return (
        <div className="flex items-center justify-between px-6 md:px-10 py-4 text-gray-500 border-b border-borderColor relative transition-all">
            <Link to="/">
                <h2 className="font-bold text-2xl">
                    Car <span className="text-primary">Go Now</span>{" "}
                    <span className="text-xs text-gray-400 align-middle">/ Admin</span>
                </h2>
            </Link>
            <p>Welcome, {user?.name || "Admin"}</p>
        </div>
    );
};

export default NavbarAdmin;
