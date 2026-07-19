import { motion } from "motion/react";
import { Link } from "react-router-dom";

const Newsletter = () => (
    <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="px-6 py-20 sm:px-8 lg:px-12"
    >
        <div className="mx-auto flex max-w-5xl flex-col items-center rounded-3xl border border-borderColor bg-slate-950 px-6 py-12 text-center text-white shadow-2xl shadow-slate-950/10 sm:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                Your next trip starts here
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Choose the ride—or the driver.
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                Browse verified options and book with clear pricing, flexible payment,
                and status updates from request to completion.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/cars" className="ui-button min-w-36">
                    Find a car
                </Link>
                <Link
                    to="/drivers"
                    className="ui-button min-w-36 border-white/20 bg-white/10 hover:bg-white/15"
                >
                    Find a driver
                </Link>
            </div>
        </div>
    </motion.section>
);

export default Newsletter;
