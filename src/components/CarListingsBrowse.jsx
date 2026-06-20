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
        <div id={id}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center py-20 bg-light max-md:px-4"
            >
                <Title title={title} subTitle={subTitle} />
                <div className="w-full mt-6 px-4">
                    <CarListingsFilter {...browse} />
                </div>
            </motion.div>

            <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-10">
                <CarListingsResults
                    {...browse}
                    showExploreAll={showExploreAll}
                    exploreAllPath={exploreAllPath}
                />
            </div>
        </div>
    );
};

export default CarListingsBrowse;
