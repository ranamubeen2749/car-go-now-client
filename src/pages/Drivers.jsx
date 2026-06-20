import React, { useCallback, useEffect, useState } from "react";
import Title from "../components/Title";
import { locationPlaceholder } from "../assets/assets";
import DriverCard from "../components/DriverCard";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "motion/react";

const Drivers = () => {
    const { axios } = useAppContext();
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [city, setCity] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchDrivers = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 12, sortBy, sortOrder };
            if (city) params.city = city;
            if (minPrice) params.minPrice = Number(minPrice);
            if (maxPrice) params.maxPrice = Number(maxPrice);
            const { data } = await axios.get("/api/driver/listings", { params });
            if (data.success) {
                setDrivers(data.drivers);
                setTotalPages(data.pagination?.totalPages || 1);
                setTotal(data.pagination?.total || data.drivers.length);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [axios, page, city, minPrice, maxPrice, sortBy, sortOrder]);

    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers]);

    return (
        <div>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center py-20 bg-light max-md:px-4"
            >
                <Title
                    title="Independent Drivers"
                    subTitle="Hire a professional driver for your own vehicle"
                />
            </motion.div>

            <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-10">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setPage(1);
                        fetchDrivers();
                    }}
                    className="grid grid-cols-2 md:grid-cols-6 gap-3 max-w-7xl mx-auto xl:px-20 mb-6 items-end"
                >
                    <div className="flex flex-col text-sm">
                        <label className="text-gray-500">City</label>
                        <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder={locationPlaceholder}
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
                    <button className="bg-primary text-white rounded-md px-4 py-2 text-sm h-fit cursor-pointer">
                        Apply
                    </button>
                </form>

                <p className="text-gray-500 xl:px-20 max-w-7xl mx-auto">
                    Showing {drivers.length} of {total} drivers{loading && " (loading…)"}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4 xl:px-20 max-w-7xl mx-auto">
                    {drivers.map((d) => (
                        <DriverCard key={d._id} driver={d} />
                    ))}
                </div>

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

export default Drivers;
