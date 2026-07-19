import React from "react";
import Title from "./Title";
import CarListingsFilter from "./CarListingsFilter";
import CarListingsResults from "./CarListingsResults";
import { useCarListingsBrowse } from "../hooks/useCarListingsBrowse";
import { motion } from "motion/react";

const CarListingsBrowse = ({
    id,
    title = "Available Cars",
    subTitle = "Browse our selection of premium vehicles available for your next adventure",
    limit = 12,
    syncSearchParams = false,
    showExploreAll = false,
    exploreAllPath = "/cars",
}) => {
    const browse = useCarListingsBrowse({ limit, syncSearchParams });

    return (
        <main id={id} className="min-h-screen bg-light">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="border-b border-borderColor bg-white px-6 py-14 sm:px-8 lg:px-12 lg:py-16"
            >
                <div className="mx-auto w-full max-w-7xl">
                    <Title
                        eyebrow="Car marketplace"
                        title={title}
                        subTitle={subTitle}
                        align="left"
                    />
                </div>
                <div className="mt-8 w-full">
                    <CarListingsFilter {...browse} />
                </div>
            </motion.div>

            <section className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
                <CarListingsResults
                    {...browse}
                    showExploreAll={showExploreAll}
                    exploreAllPath={exploreAllPath}
                />
            </section>
        </main>
    );
};

export default CarListingsBrowse;
