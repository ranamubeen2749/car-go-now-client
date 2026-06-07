import React from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";

const DriverCard = ({ driver }) => {
    const currency = import.meta.env.VITE_CURRENCY || "$";
    const navigate = useNavigate();

    return (
        <div
            onClick={() => {
                navigate(`/driver-details/${driver._id}`);
                scrollTo(0, 0);
            }}
            className="group rounded-xl overflow-hidden shadow-lg hover:-translate-y-1 transition-all duration-500 cursor-pointer bg-white"
        >
            <div className="bg-light p-6 flex flex-col items-center">
                {driver.avatar?.url ? (
                    <img
                        src={driver.avatar.thumbnailUrl || driver.avatar.url}
                        alt={driver.name}
                        className="w-24 h-24 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-semibold">
                        {(driver.name || "D")[0]}
                    </div>
                )}
                <h3 className="text-lg font-medium mt-4">{driver.name}</h3>
                <p className="text-gray-500 text-sm flex items-center gap-1">
                    <img src={assets.location_icon} alt="" className="h-3" />
                    {driver.city}
                </p>
            </div>
            <div className="p-4">
                {driver.bio && (
                    <p className="text-sm text-gray-500 line-clamp-3">{driver.bio}</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-primary font-semibold">
                        {currency}
                        {driver.pricePerDay} / day
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        Available
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DriverCard;
