import React, { useState, useRef, useEffect } from "react";
import { assets, menuLinks } from "../assets/assets";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "motion/react";
import NotificationsBell from "./NotificationsBell";

const ROLE_LABELS = {
    customer: "Customer",
    business_owner: "Business Owner",
    independent_driver: "Independent Driver",
    super_admin: "Super Admin",
};

const ROLE_HOMES = {
    customer: "/",
    business_owner: "/owner",
    independent_driver: "/driver",
    super_admin: "/admin",
};

const Navbar = () => {
    const {
        openLogin,
        user,
        logout,
        hasRoles,
        currentRole,
        switchRole,
    } = useAppContext();

    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [roleMenuOpen, setRoleMenuOpen] = useState(false);
    const roleMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) {
                setRoleMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSwitchRole = async (role) => {
        setRoleMenuOpen(false);
        if (role === currentRole) return;
        const ok = await switchRole(role);
        if (ok) navigate(ROLE_HOMES[role] || "/");
    };

    const handleBecomeBusiness = () => {
        if (!user) {
            openLogin("register", "business");
        } else {
            toast("To register a business, please contact support or use a fresh account for now.");
        }
    };

    const handleBecomeDriver = () => {
        if (!user) {
            openLogin("register", "driver");
        } else {
            toast("To register as an independent driver, please contact support or use a fresh account for now.");
        }
    };

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`flex items-center justify-between px-6 md:px-16 lg:px-24 xl:px-32 py-4 text-gray-600 border-b border-borderColor relative transition-all ${
                location.pathname === "/" && "bg-light"
            }`}
        >
            <Link to="/">
                <h2 className="font-bold text-2xl">
                    Car <span className="text-primary">Go Now</span>
                </h2>
            </Link>

            <div
                className={`max-sm:fixed max-sm:h-screen max-sm:w-full max-sm:top-16 max-sm:border-t border-borderColor right-0 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 max-sm:p-4 transition-all duration-300 z-45 ${
                    location.pathname === "/" ? "bg-light" : "bg-white"
                } ${open ? "max-sm:translate-x-0" : "max-sm:translate-x-full"}`}
            >
                {menuLinks.map((link, index) => (
                    <Link key={index} to={link.path}>
                        {link.name}
                    </Link>
                ))}

                <div className="hidden lg:flex items-center text-sm gap-2 border border-borderColor px-3 rounded-full max-w-56">
                    <input
                        type="text"
                        className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500"
                        placeholder="Search cars"
                    />
                    <img src={assets.search_icon} alt="search" />
                </div>

                <div className="flex max-sm:flex-col items-start sm:items-center gap-4">
                    {user && <NotificationsBell />}

                    {/* Role switcher when user has multiple roles */}
                    {user && hasRoles.length > 1 && (
                        <div className="relative" ref={roleMenuRef}>
                            <button
                                onClick={() => setRoleMenuOpen((v) => !v)}
                                className="cursor-pointer px-3 py-1.5 border border-borderColor rounded-md text-sm"
                            >
                                {ROLE_LABELS[currentRole] || "Switch role"} ▾
                            </button>
                            {roleMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white border border-borderColor rounded-md shadow-lg overflow-hidden z-50">
                                    {hasRoles.map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => handleSwitchRole(role)}
                                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-light ${
                                                role === currentRole ? "bg-primary/10 text-primary font-medium" : ""
                                            }`}
                                        >
                                            {ROLE_LABELS[role] || role}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quick dashboard link for the active role */}
                    {user && currentRole === "business_owner" && (
                        <button onClick={() => navigate("/owner")} className="cursor-pointer">
                            Dashboard
                        </button>
                    )}
                    {user && currentRole === "independent_driver" && (
                        <button onClick={() => navigate("/driver")} className="cursor-pointer">
                            Driver Dashboard
                        </button>
                    )}
                    {user && currentRole === "super_admin" && (
                        <button onClick={() => navigate("/admin")} className="cursor-pointer">
                            Admin Panel
                        </button>
                    )}

                    {/* "Become a..." links for users missing those roles */}
                    {(!user || !hasRoles.includes("business_owner")) && (
                        <button onClick={handleBecomeBusiness} className="cursor-pointer text-sm">
                            List cars
                        </button>
                    )}
                    {(!user || !hasRoles.includes("independent_driver")) && (
                        <button onClick={handleBecomeDriver} className="cursor-pointer text-sm">
                            Become a driver
                        </button>
                    )}

                    <button
                        onClick={() => {
                            user ? logout() : openLogin("login", "customer");
                        }}
                        className="cursor-pointer px-8 py-2 bg-primary hover:bg-primary-dull transition-all text-white rounded-lg"
                    >
                        {user ? "Logout" : "Login"}
                    </button>
                </div>
            </div>

            <button
                className="sm:hidden cursor-pointer"
                aria-label="Menu"
                onClick={() => setOpen(!open)}
            >
                <img src={open ? assets.close_icon : assets.menu_icon} alt="menu" />
            </button>
        </motion.div>
    );
};

export default Navbar;
