import { motion } from "motion/react";
import CarListingsFilter from "./CarListingsFilter";
import heroImage from "../assets/hero-premium.png";

const Hero = ({ browse }) => (
    <section className="relative isolate overflow-hidden bg-ink text-white">
        <img
            src={heroImage}
            alt="Premium sedan on a modern city boulevard"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/88 to-slate-950/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/20" />

        <div className="mx-auto flex min-h-[570px] max-w-7xl flex-col justify-center px-6 pb-12 pt-28 sm:px-8 lg:px-12">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl"
            >
                <p className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100 backdrop-blur">
                    Cars and professional drivers across Pakistan
                </p>
                <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                    Luxury cars on Rent
                    <span className="mt-2 block text-blue-300">without the guesswork.</span>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
                    Compare verified vehicles, choose self-drive or a professional
                    driver, and manage every booking in one place.
                </p>

                <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-200">
                    {["Verified listings", "Flexible payments", "Local support"].map(
                        (item) => (
                            <span key={item} className="flex items-center gap-2">
                                <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-400/20 text-xs text-blue-200">
                                    ✓
                                </span>
                                {item}
                            </span>
                        )
                    )}
                </div>
            </motion.div>
        </div>

        {browse && (
            <div className="px-4 pb-6 sm:px-6 lg:px-8">
                <CarListingsFilter {...browse} variant="hero" />
            </div>
        )}
    </section>
);

export default Hero;
