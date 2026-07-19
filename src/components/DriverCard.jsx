import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";

const DriverCard = ({ driver }) => {
    const navigate = useNavigate();
    const currency = import.meta.env.VITE_CURRENCY || "$";

    const openDriver = () => {
        navigate(`/driver-details/${driver._id}`);
        scrollTo(0, 0);
    };

    return (
        <button
            type="button"
            onClick={openDriver}
            className="group ui-card block w-full overflow-hidden text-left transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
            aria-label={`View ${driver.name}`}
        >
            <span className="relative flex items-center gap-4 bg-gradient-to-br from-slate-50 to-blue-50 p-5">
                {driver.avatar?.url ? (
                    <img
                        src={driver.avatar.thumbnailUrl || driver.avatar.url}
                        alt={driver.name}
                        loading="lazy"
                        className="h-20 w-20 rounded-2xl object-cover shadow-sm"
                    />
                ) : (
                    <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-primary text-2xl font-semibold text-white shadow-lg shadow-primary/20">
                        {(driver.name || "D")[0].toUpperCase()}
                    </span>
                )}
                <span className="min-w-0">
                    <span className="block truncate text-lg font-semibold text-ink">
                        {driver.name}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                        <img src={assets.location_icon} alt="" className="h-3.5 w-3.5" />
                        {driver.city || "Location not provided"}
                    </span>
                    <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Available
                    </span>
                </span>
            </span>

            <span className="block p-5">
                <span className="block min-h-12 text-sm leading-6 text-muted">
                    {driver.bio || "Professional independent driver ready for your trip."}
                </span>
                <span className="mt-5 flex items-end justify-between border-t border-borderColor pt-4">
                    <span>
                        <span className="block text-xs uppercase tracking-wide text-muted">
                            Daily rate
                        </span>
                        <strong className="mt-1 block text-xl text-ink">
                            {currency}
                            {driver.pricePerDay}
                            <span className="text-sm font-normal text-muted"> / day</span>
                        </strong>
                    </span>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-primary transition group-hover:bg-primary group-hover:text-white">
                        →
                    </span>
                </span>
            </span>
        </button>
    );
};

export default DriverCard;
