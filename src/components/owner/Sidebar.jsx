import React from "react";
import { ownerMenuLinks } from "../../assets/assets";
import { NavLink, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const Sidebar = () => {
    const { user, logout } = useAppContext();
    const location = useLocation();

    return (
        <div className="h-full flex flex-col items-center pt-8 w-13 md:w-60 shrink-0 border-r border-borderColor text-sm bg-white overflow-y-auto">
            {/* Avatar placeholder — backend doesn't expose an avatar upload endpoint yet. */}
            <div className="relative">
                <div className="h-9 md:h-14 w-9 md:w-14 rounded-full mx-auto bg-primary/10 text-primary flex items-center justify-center text-base md:text-xl font-semibold">
                    {(user?.name || "U")[0]}
                </div>
                <p
                    title="Avatar upload coming soon"
                    className="absolute -bottom-1 -right-1 text-[10px] bg-gray-200 text-gray-600 px-1 rounded-full max-md:hidden"
                >
                    soon
                </p>
            </div>
            <p className="mt-2 text-base max-md:hidden">{user?.name}</p>

            <div className="w-full flex-1">
                {ownerMenuLinks.map((link, index) => (
                    <NavLink
                        key={index}
                        to={link.path}
                        end={link.path === "/owner"}
                        className={`relative flex items-center gap-2 w-full py-3 pl-4 first:mt-6 ${
                            link.path === location.pathname
                                ? "bg-primary/10 text-primary"
                                : "text-gray-600"
                        }`}
                    >
                        <img
                            src={
                                link.path === location.pathname ? link.coloredIcon : link.icon
                            }
                            alt=""
                        />
                        <span className="max-md:hidden">{link.name}</span>
                        <div
                            className={`${
                                link.path === location.pathname && "bg-primary"
                            } w-1.5 h-8 rounded-l right-0 absolute`}
                        ></div>
                    </NavLink>
                ))}
            </div>

            <button
                onClick={logout}
                className="w-full py-3 px-4 mb-6 text-sm text-red-600 hover:bg-red-50 border-t border-borderColor"
            >
                Logout
            </button>
        </div>
    );
};

export default Sidebar;
