import React from "react";
import Hero from "../components/Hero";
import Title from "../components/Title";
import CarListingsResults from "../components/CarListingsResults";
import Banner from "../components/Banner";
import Testimonial from "../components/Testimonial";
import Newsletter from "../components/Newsletter";
import { useCarListingsBrowse } from "../hooks/useCarListingsBrowse";
import { motion } from "motion/react";

const Home = () => {
    const browse = useCarListingsBrowse({ limit: 6, syncSearchParams: true });

    return (
        <>
            <Hero browse={browse} />
            <motion.div
                id="browse-cars"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="flex flex-col items-center py-16 px-6 md:px-16 lg:px-24 xl:px-32"
            >
                <Title
                    title="Featured Vehicles"
                    subTitle="Explore our selection of premium vehicles available for your next adventure."
                />
                <div className="w-full mt-10">
                    <CarListingsResults {...browse} compact showExploreAll />
                </div>
            </motion.div>
            <Banner />
            <Testimonial />
            <Newsletter />
        </>
    );
};

export default Home;
