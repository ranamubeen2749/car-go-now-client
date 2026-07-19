import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";

const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800&auto=format&fit=crop";

const getCarImage = (car) => {
    if (car?.images?.length) return car.images[0].thumbnailUrl || car.images[0].url;
    const attachment = car?.attachments?.find(
        (item) => item.category === "car_image"
    );
    return attachment?.thumbnailUrl || attachment?.url || car?.image || FALLBACK_IMAGE;
};

const CarCard = ({ car }) => {
    const navigate = useNavigate();
    const currency = import.meta.env.VITE_CURRENCY || "$";

    const openCar = () => {
        navigate(`/car-details/${car._id}`);
        scrollTo(0, 0);
    };

    return (
        <button
            type="button"
            onClick={openCar}
            className="group ui-card block w-full overflow-hidden text-left transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
            aria-label={`View ${car.brand} ${car.model}`}
        >
            <span className="relative block aspect-[16/10] overflow-hidden bg-slate-100">
                <img
                    src={getCarImage(car)}
                    alt={`${car.brand} ${car.model}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/65 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full border border-white/40 bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 backdrop-blur">
                    Available
                </span>
                <span className="absolute bottom-4 right-4 rounded-xl bg-slate-950/85 px-3 py-2 text-white backdrop-blur">
                    <strong className="text-lg">
                        {currency}
                        {car.pricePerDay}
                    </strong>
                    <span className="text-xs text-slate-300"> / day</span>
                </span>
            </span>

            <span className="block p-5">
                <span className="flex items-start justify-between gap-3">
                    <span>
                        <span className="block text-lg font-semibold text-ink">
                            {car.brand} {car.model}
                        </span>
                        <span className="mt-1 block text-sm text-muted">
                            {car.category} · {car.year}
                        </span>
                    </span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-primary transition group-hover:bg-primary group-hover:text-white">
                        →
                    </span>
                </span>

                <span className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-borderColor pt-4 text-sm text-slate-600">
                    <Feature icon={assets.users_icon} text={`${car.seating_capacity} seats`} />
                    <Feature icon={assets.fuel_icon} text={car.fuel_type} />
                    <Feature icon={assets.car_icon} text={car.transmission} />
                    <Feature icon={assets.location_icon} text={car.location} />
                </span>
            </span>
        </button>
    );
};

const Feature = ({ icon, text }) => (
    <span className="flex min-w-0 items-center gap-2">
        <img src={icon} alt="" className="h-4 w-4 shrink-0 opacity-70" />
        <span className="truncate">{text}</span>
    </span>
);

export default CarCard;
