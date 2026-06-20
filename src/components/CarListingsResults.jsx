import React from "react";
import CarCard from "./CarCard";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

const CarListingsResults = ({
    query,
    loading,
    total,
    displayedCars,
    totalPages,
    goToPage,
    showExploreAll = false,
    exploreAllPath = "/cars",
    compact = false,
}) => {
    const navigate = useNavigate();

    if (!query) {
        return (
            <p
                className={`text-gray-500 max-w-7xl mx-auto text-center ${
                    compact ? "py-8" : "py-12 xl:px-20"
                }`}
            >
                Set your filters and click <strong>Apply</strong> to see available cars.
            </p>
        );
    }

    return (
        <>
            <p className={`text-gray-500 max-w-7xl mx-auto ${compact ? "" : "xl:px-20"}`}>
                Showing {displayedCars.length} of {total} cars
                {loading && " (loading…)"}
            </p>

            <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4 max-w-7xl mx-auto ${
                    compact ? "" : "xl:px-20"
                }`}
            >
                {displayedCars.map((car, index) => (
                    <motion.div
                        key={car._id || index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.05 * index, duration: 0.4 }}
                    >
                        <CarCard car={car} />
                    </motion.div>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 mb-8">
                    <button
                        onClick={() => goToPage(Math.max(1, query.page - 1))}
                        disabled={query.page === 1 || loading}
                        className="px-3 py-1.5 border border-borderColor rounded-md text-sm disabled:opacity-40"
                    >
                        Prev
                    </button>
                    <span className="text-sm text-gray-500">
                        Page {query.page} of {totalPages}
                    </span>
                    <button
                        onClick={() => goToPage(Math.min(totalPages, query.page + 1))}
                        disabled={query.page === totalPages || loading}
                        className="px-3 py-1.5 border border-borderColor rounded-md text-sm disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}

            {showExploreAll && (
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    onClick={() => {
                        navigate(exploreAllPath);
                        scrollTo(0, 0);
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-2 border border-borderColor hover:bg-gray-50 rounded-md mt-12 mx-auto cursor-pointer"
                >
                    Explore all cars <img src={assets.arrow_icon} alt="arrow" />
                </motion.button>
            )}
        </>
    );
};

export default CarListingsResults;
