import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

const Banner = () => {
    const navigate = useNavigate();
    const { user, currentRole, openLogin } = useAppContext();

    const handleListCar = () => {
        if (!user) return openLogin("register", "business");
        if (currentRole === "business_owner") return navigate("/owner/add-car");
        toast("Switch to your business-owner account to list a car.");
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
            className="relative mx-auto flex max-w-7xl flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-primary to-blue-500 px-7 pt-9 text-white shadow-2xl shadow-blue-950/15 sm:px-10 md:min-h-80 md:flex-row md:items-center md:px-14 md:py-12"
        >
            <div className="relative z-10 max-w-xl pb-6 md:pb-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                    Grow your rental business
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Turn your parked car into income.
                </h2>
                <p className="mt-4 max-w-lg leading-7 text-blue-50">
                    List your fleet, add trusted business drivers, and manage bookings
                    from one owner workspace.
                </p>
                <button
                    type="button"
                    onClick={handleListCar}
                    className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-primary shadow-lg transition hover:bg-blue-50"
                >
                    List your car <span className="ml-2" aria-hidden="true">→</span>
                </button>
            </div>

            <img
                src={assets.banner_car_image}
                alt="Car ready to be listed"
                className="relative z-10 ml-auto max-h-56 max-w-full object-contain md:absolute md:-bottom-4 md:right-4 md:w-[46%]"
            />
            <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[48px] border-white/10" />
        </motion.section>
    );
};

export default Banner;
