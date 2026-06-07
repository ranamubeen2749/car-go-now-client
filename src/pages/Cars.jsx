import React, { useCallback, useEffect, useState } from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CarCard from "../components/CarCard";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "motion/react";

const Cars = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const pickupLocation = searchParams.get("pickupLocation") || "";

    const { axios } = useAppContext();

    // Server-side filters (per docs/api/car-controller.md)
    const [location, setLocation] = useState(pickupLocation);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    // Client-side text search (matches against brand/model/category/transmission)
    const [input, setInput] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchListings = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit, sortBy, sortOrder };
            if (location) params.location = location;
            if (minPrice) params.minPrice = Number(minPrice);
            if (maxPrice) params.maxPrice = Number(maxPrice);

            const { data } = await axios.get("/api/car/listings", { params });
            if (data.success) {
                setCars(data.cars);
                setTotalPages(data.pagination?.totalPages || 1);
                setTotal(data.pagination?.total || data.cars.length);
                if (data.cars.length === 0) {
                    toast("No cars match these filters");
                }
            } else {
                toast.error(data.message || "Failed to fetch cars");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [axios, page, limit, sortBy, sortOrder, location, minPrice, maxPrice]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    const handleApplyFilters = (e) => {
        e?.preventDefault();
        setPage(1);
        // Sync location back to URL so the link stays shareable
        const next = new URLSearchParams(searchParams);
        if (location) next.set("pickupLocation", location);
        else next.delete("pickupLocation");
        setSearchParams(next, { replace: true });
        fetchListings();
    };

    const displayedCars = input
        ? cars.filter((c) => {
              const q = input.toLowerCase();
              return (
                  c.brand?.toLowerCase().includes(q) ||
                  c.model?.toLowerCase().includes(q) ||
                  c.category?.toLowerCase().includes(q) ||
                  c.transmission?.toLowerCase().includes(q)
              );
          })
        : cars;

    return (
        <div>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center py-20 bg-light max-md:px-4"
            >
                <Title
                    title="Available Cars"
                    subTitle="Browse our selection of premium vehicles available for your next adventure"
                />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex items-center bg-white px-4 mt-6 max-w-140 w-full h-12 rounded-full shadow"
                >
                    <img src={assets.search_icon} alt="" className="w-4.5 h-4.5 mr-2" />
                    <input
                        onChange={(e) => setInput(e.target.value)}
                        value={input}
                        type="text"
                        placeholder="Search by make, model, transmission..."
                        className="w-full h-full outline-none text-gray-500"
                    />
                    <img src={assets.filter_icon} alt="" className="w-4.5 h-4.5 ml-2" />
                </motion.div>
            </motion.div>

            <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-10">
                {/* Server-side filter bar */}
                <form
                    onSubmit={handleApplyFilters}
                    className="grid grid-cols-2 md:grid-cols-6 gap-3 max-w-7xl mx-auto xl:px-20 mb-6 items-end"
                >
                    <div className="flex flex-col text-sm">
                        <label className="text-gray-500">Location</label>
                        <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. New York"
                            className="border border-borderColor rounded-md px-2 py-1.5 outline-none"
                        />
                    </div>
                    <div className="flex flex-col text-sm">
                        <label className="text-gray-500">Min Price</label>
                        <input
                            type="number"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className="border border-borderColor rounded-md px-2 py-1.5 outline-none"
                        />
                    </div>
                    <div className="flex flex-col text-sm">
                        <label className="text-gray-500">Max Price</label>
                        <input
                            type="number"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="border border-borderColor rounded-md px-2 py-1.5 outline-none"
                        />
                    </div>
                    <div className="flex flex-col text-sm">
                        <label className="text-gray-500">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border border-borderColor rounded-md px-2 py-1.5 outline-none"
                        >
                            <option value="createdAt">Newest</option>
                            <option value="pricePerDay">Price</option>
                            <option value="year">Year</option>
                        </select>
                    </div>
                    <div className="flex flex-col text-sm">
                        <label className="text-gray-500">Order</label>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="border border-borderColor rounded-md px-2 py-1.5 outline-none"
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

                <p className="text-gray-500 xl:px-20 max-w-7xl mx-auto">
                    Showing {displayedCars.length} of {total} cars
                    {loading && " (loading…)"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4 xl:px-20 max-w-7xl mx-auto">
                    {displayedCars.map((car, index) => (
                        <motion.div
                            key={car._id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * index, duration: 0.4 }}
                        >
                            <CarCard car={car} />
                        </motion.div>
                    ))}
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10 mb-16">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 border border-borderColor rounded-md text-sm disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <span className="text-sm text-gray-500">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1.5 border border-borderColor rounded-md text-sm disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cars;
