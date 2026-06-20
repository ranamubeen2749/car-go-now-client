import React from "react";
import { assets, locationPlaceholder } from "../assets/assets";
import { motion } from "motion/react";

const CarListingsFilter = ({
    location,
    setLocation,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    input,
    setInput,
    query,
    handleApplyFilters,
    variant = "default",
}) => {
    const isHero = variant === "hero";

    const filterForm = (
        <form
            onSubmit={handleApplyFilters}
            className={
                isHero
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 w-full max-w-5xl mx-auto px-4 items-end"
                    : "grid grid-cols-2 md:grid-cols-6 gap-3 max-w-7xl mx-auto xl:px-20 mb-6 items-end"
            }
        >
            <div className="flex flex-col text-sm text-left">
                <label className="text-gray-500">Location</label>
                <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={locationPlaceholder}
                    className="border border-borderColor rounded-md px-2 py-1.5 outline-none bg-white"
                />
            </div>
            <div className="flex flex-col text-sm text-left">
                <label className="text-gray-500">Min Price</label>
                <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="border border-borderColor rounded-md px-2 py-1.5 outline-none bg-white"
                />
            </div>
            <div className="flex flex-col text-sm text-left">
                <label className="text-gray-500">Max Price</label>
                <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="border border-borderColor rounded-md px-2 py-1.5 outline-none bg-white"
                />
            </div>
            <div className="flex flex-col text-sm text-left">
                <label className="text-gray-500">Sort By</label>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-borderColor rounded-md px-2 py-1.5 outline-none bg-white"
                >
                    <option value="createdAt">Newest</option>
                    <option value="pricePerDay">Price</option>
                    <option value="year">Year</option>
                </select>
            </div>
            <div className="flex flex-col text-sm text-left">
                <label className="text-gray-500">Order</label>
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="border border-borderColor rounded-md px-2 py-1.5 outline-none bg-white"
                >
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                </select>
            </div>
            <button
                type="submit"
                className="bg-primary text-white rounded-md px-4 py-2 text-sm h-fit cursor-pointer"
            >
                Apply
            </button>
        </form>
    );

    const searchBar = (
        <div className="flex items-center bg-white px-4 w-full max-w-140 h-12 rounded-full shadow">
            <img src={assets.search_icon} alt="" className="w-4.5 h-4.5 mr-2" />
            <input
                onChange={(e) => setInput(e.target.value)}
                value={input}
                type="text"
                placeholder="Search by make, model, transmission..."
                className="w-full h-full outline-none text-gray-500"
                disabled={!query}
            />
            <img src={assets.filter_icon} alt="" className="w-4.5 h-4.5 ml-2" />
        </div>
    );

    if (isHero) {
        return (
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col items-center gap-4 w-full"
            >
                {filterForm}
                {searchBar}
            </motion.div>
        );
    }

    return (
        <>
            {filterForm}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex items-center bg-white px-4 mt-6 max-w-140 w-full h-12 rounded-full shadow mx-auto"
            >
                <img src={assets.search_icon} alt="" className="w-4.5 h-4.5 mr-2" />
                <input
                    onChange={(e) => setInput(e.target.value)}
                    value={input}
                    type="text"
                    placeholder="Search by make, model, transmission..."
                    className="w-full h-full outline-none text-gray-500"
                    disabled={!query}
                />
                <img src={assets.filter_icon} alt="" className="w-4.5 h-4.5 ml-2" />
            </motion.div>
        </>
    );
};

export default CarListingsFilter;
