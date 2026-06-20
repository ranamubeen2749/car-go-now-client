import React from "react";
import { assets } from "../assets/assets";
import CarListingsFilter from "./CarListingsFilter";
import { motion } from "motion/react";

const Hero = ({ browse }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen flex flex-col items-center justify-center gap-10 bg-light text-center px-4 md:px-8 pt-24 pb-12"
        >
            <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl md:text-5xl font-semibold"
            >
                Luxury cars on Rent
            </motion.h1>

            {browse && <CarListingsFilter {...browse} variant="hero" />}

            <motion.img
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                src={assets.main_car}
                alt="car"
                className="max-h-74"
            />
        </motion.div>
    );
};

export default Hero;
