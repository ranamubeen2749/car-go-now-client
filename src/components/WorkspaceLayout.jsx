import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Brand from "./Brand";
import NotificationsBell from "./NotificationsBell";

const WorkspaceLayout = ({ label, menuLinks }) => {
    const { user, logout } = useAppContext();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!menuOpen) return undefined;
        const close = (event) => event.key === "Escape" && setMenuOpen(false);
        document.addEventListener("keydown", close);
        return () => document.removeEventListener("keydown", close);
    }, [menuOpen]);

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-light">
            <header className="relative z-40 flex h-17 shrink-0 items-center justify-between border-b border-borderColor bg-white px-4 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        className="ui-icon-button md:hidden"
                        aria-label="Open workspace navigation"
                        aria-expanded={menuOpen}
                    >
                        <MenuIcon />
                    </button>
                    <Brand compact label={label} />
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <p className="hidden text-sm text-muted lg:block">
                        Welcome, <span className="font-semibold text-ink">{user?.name}</span>
                    </p>
                    <NotificationsBell />
                    <button type="button" onClick={logout} className="ui-button ui-button-secondary">
                        Logout
                    </button>
                </div>
            </header>

            <div className="relative flex min-h-0 flex-1">
                {menuOpen && (
                    <button
                        type="button"
                        aria-label="Close workspace navigation"
                        onClick={() => setMenuOpen(false)}
                        className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-[1px] md:hidden"
                    />
                )}

                <aside
                    className={`absolute inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-borderColor bg-white shadow-xl transition-transform duration-200 md:static md:z-auto md:w-60 md:translate-x-0 md:shadow-none ${
                        menuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    <div className="flex h-17 items-center justify-between border-b border-borderColor px-5 md:hidden">
                        <Brand compact label={label} />
                        <button
                            type="button"
                            onClick={() => setMenuOpen(false)}
                            className="ui-icon-button"
                            aria-label="Close workspace navigation"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="border-b border-borderColor px-5 py-5">
                        <div className="flex items-center gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                                {(user?.name || "U")[0].toUpperCase()}
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
                                <p className="truncate text-xs text-muted">{user?.email}</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label={`${label} navigation`}>
                        {menuLinks.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                end={link.path.split("/").filter(Boolean).length === 1}
                                className={({ isActive }) =>
                                    `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                                        isActive
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <img
                                            src={isActive ? link.coloredIcon : link.icon}
                                            alt=""
                                            className={`h-5 w-5 ${isActive ? "brightness-0 invert" : ""}`}
                                        />
                                        <span>{link.name}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="border-t border-borderColor p-3 md:hidden">
                        <button
                            type="button"
                            onClick={logout}
                            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                            Logout
                        </button>
                    </div>
                </aside>

                <main className="min-w-0 flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
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

export default WorkspaceLayout;
