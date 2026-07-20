import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { menuLinks } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import Brand from "./Brand";
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
    const { openLogin, user, logout, hasRoles, currentRole, switchRole } = useAppContext();
    const location = useLocation();
    const navigate = useNavigate();
    const roleMenuRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [roleMenuOpen, setRoleMenuOpen] = useState(false);

    useEffect(() => {
        setMenuOpen(false);
        setRoleMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const close = (event) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
                setRoleMenuOpen(false);
            }
            if (
                event.type === "mousedown" &&
                roleMenuRef.current &&
                !roleMenuRef.current.contains(event.target)
            ) {
                setRoleMenuOpen(false);
            }
        };
        document.addEventListener("keydown", close);
        document.addEventListener("mousedown", close);
        return () => {
            document.removeEventListener("keydown", close);
            document.removeEventListener("mousedown", close);
        };
    }, []);

    const handleSwitchRole = async (role) => {
        setRoleMenuOpen(false);
        if (role === currentRole) return;
        if (await switchRole(role)) navigate(ROLE_HOMES[role] || "/");
    };

    const handleBecomeBusiness = () => {
        if (!user) openLogin("register", "business");
        else toast("Contact support to add a business role to this account.");
    };

    const handleBecomeDriver = () => {
        if (!user) openLogin("register", "driver");
        else toast("Contact support to add a driver role to this account.");
    };

    const dashboardAction =
        currentRole === "business_owner"
            ? ["Dashboard", "/owner"]
            : currentRole === "independent_driver"
              ? ["Driver Dashboard", "/driver"]
              : currentRole === "super_admin"
              ? ["Admin Panel", "/admin"]
              : null;
    const visibleMenuLinks = menuLinks.filter(
        (link) => link.path !== "/my-bookings" || user
    );

    return (
        <>
            <motion.header
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.28 }}
                className="sticky top-0 z-40 border-b border-borderColor bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur"
            >
                <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-14">
                    <Brand />

                    <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
                        {visibleMenuLinks.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                className={({ isActive }) =>
                                    `rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                                        isActive
                                            ? "bg-primary/8 text-primary"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                                    }`
                                }
                            >
                                {link.name}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="hidden items-center gap-2 lg:flex">
                        {user && <NotificationsBell />}

                        {user && hasRoles.length > 1 && (
                            <div className="relative" ref={roleMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setRoleMenuOpen((value) => !value)}
                                    className="ui-button ui-button-secondary"
                                    aria-haspopup="menu"
                                    aria-expanded={roleMenuOpen}
                                >
                                    {ROLE_LABELS[currentRole] || "Switch role"}
                                    <ChevronIcon />
                                </button>
                                {roleMenuOpen && (
                                    <div
                                        role="menu"
                                        className="absolute right-0 mt-2 w-56 rounded-2xl border border-borderColor bg-white p-2 shadow-xl"
                                    >
                                        {hasRoles.map((role) => (
                                            <button
                                                type="button"
                                                role="menuitem"
                                                key={role}
                                                onClick={() => handleSwitchRole(role)}
                                                className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium ${
                                                    role === currentRole
                                                        ? "bg-primary/8 text-primary"
                                                        : "text-slate-600 hover:bg-slate-100"
                                                }`}
                                            >
                                                {ROLE_LABELS[role] || role}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {dashboardAction && (
                            <button
                                type="button"
                                onClick={() => navigate(dashboardAction[1])}
                                className="ui-button ui-button-secondary"
                            >
                                {dashboardAction[0]}
                            </button>
                        )}

                        {!user && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleBecomeBusiness}
                                    className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-primary"
                                >
                                    List cars
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBecomeDriver}
                                    className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-primary"
                                >
                                    Become a driver
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => (user ? logout() : openLogin("login", "customer"))}
                            className="ui-button"
                        >
                            {user ? "Logout" : "Login"}
                        </button>
                    </div>

                    <div className="flex items-center gap-2 lg:hidden">
                        {user && <NotificationsBell />}
                        <button
                            type="button"
                            onClick={() => setMenuOpen(true)}
                            className="ui-icon-button"
                            aria-label="Open navigation"
                            aria-expanded={menuOpen}
                        >
                            <MenuIcon />
                        </button>
                    </div>
                </div>
            </motion.header>

            {menuOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-[1px] lg:hidden"
                />
            )}

            {menuOpen && (
                <aside className="fixed inset-y-0 right-0 z-50 flex w-[min(88vw,360px)] flex-col bg-white shadow-2xl lg:hidden">
                    <div className="flex h-18 items-center justify-between border-b border-borderColor px-5">
                        <Brand compact />
                        <button
                            type="button"
                            onClick={() => setMenuOpen(false)}
                            className="ui-icon-button"
                            aria-label="Close navigation"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {user && (
                        <div className="border-b border-borderColor px-5 py-4">
                            <p className="text-sm font-semibold text-ink">{user.name}</p>
                            <p className="text-xs text-muted">{ROLE_LABELS[currentRole]}</p>
                        </div>
                    )}

                    <nav
                        className="flex-1 space-y-1 overflow-y-auto p-4"
                        aria-label="Mobile navigation"
                    >
                        {visibleMenuLinks.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                className={({ isActive }) =>
                                    `block rounded-xl px-4 py-3 text-sm font-semibold ${
                                        isActive
                                            ? "bg-primary text-white"
                                            : "text-slate-600 hover:bg-slate-100"
                                    }`
                                }
                            >
                                {link.name}
                            </NavLink>
                        ))}

                        {dashboardAction && (
                            <button
                                type="button"
                                onClick={() => navigate(dashboardAction[1])}
                                className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100"
                            >
                                {dashboardAction[0]}
                            </button>
                        )}

                        {user &&
                            hasRoles
                                .filter((role) => role !== currentRole)
                                .map((role) => (
                                    <button
                                        type="button"
                                        key={role}
                                        onClick={() => handleSwitchRole(role)}
                                        className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100"
                                    >
                                        Switch to {ROLE_LABELS[role] || role}
                                    </button>
                                ))}

                        {!user && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleBecomeBusiness}
                                    className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                    List cars
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBecomeDriver}
                                    className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                    Become a driver
                                </button>
                            </>
                        )}
                    </nav>

                    <div className="border-t border-borderColor p-4">
                        <button
                            type="button"
                            onClick={() => (user ? logout() : openLogin("login", "customer"))}
                            className="ui-button w-full"
                        >
                            {user ? "Logout" : "Login"}
                        </button>
                    </div>
                </aside>
            )}
        </>
    );
};

const MenuIcon = () => (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
);

const CloseIcon = () => (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 6 12 12M18 6 6 18" />
    </svg>
);

const ChevronIcon = () => (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m7 10 5 5 5-5" />
    </svg>
);

export default Navbar;
