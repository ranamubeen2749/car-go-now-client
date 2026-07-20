import React, { useCallback, useEffect, useState } from "react";
import Title from "../components/Title";
import { locationPlaceholder } from "../assets/assets";
import DriverCard from "../components/DriverCard";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "motion/react";
import PageState from "../components/PageState";

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
        <main className="min-h-screen bg-light">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="border-b border-borderColor bg-white px-6 py-14 sm:px-8 lg:px-12 lg:py-16"
            >
                <div className="mx-auto w-full max-w-7xl">
                    <Title
                        eyebrow="Driver marketplace"
                        title="Independent Drivers"
                        subTitle="Hire a verified professional driver for your own vehicle."
                        align="left"
                    />
                </div>
            </motion.div>

            <section className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-12 lg:py-12">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setPage(1);
                        fetchDrivers();
                    }}
                    className="ui-card grid grid-cols-2 items-end gap-3 p-4 md:grid-cols-3 lg:grid-cols-6 sm:p-5"
                >
                    <label className="text-xs font-semibold text-slate-600">
                        City
                        <input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder={locationPlaceholder}
                            className="ui-field mt-1.5"
                        />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                        Min price
                        <input
                            type="number"
                            min="0"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            placeholder="Any"
                            className="ui-field mt-1.5"
                        />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                        Max price
                        <input
                            type="number"
                            min="0"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            placeholder="Any"
                            className="ui-field mt-1.5"
                        />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                        Sort by
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="ui-field mt-1.5"
                        >
                            <option value="createdAt">Newest</option>
                            <option value="pricePerDay">Price</option>
                        </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                        Order
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="ui-field mt-1.5"
                        >
                            <option value="desc">High to low</option>
                            <option value="asc">Low to high</option>
                        </select>
                    </label>
                    <button type="submit" className="ui-button h-11 w-full">
                        Apply filters
                    </button>
                </form>

                <p className="mt-8 text-sm text-muted" aria-live="polite">
                    {loading
                        ? "Updating results…"
                        : `${total} ${total === 1 ? "driver" : "drivers"} available`}
                </p>

                {loading && drivers.length === 0 ? (
                    <div className="ui-card mt-5">
                        <PageState
                            compact
                            loading
                            title="Finding available drivers"
                            description="Checking the latest verified profiles…"
                        />
                    </div>
                ) : (
                    <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {drivers.map((d) => (
                            <DriverCard key={d._id} driver={d} />
                        ))}
                    </div>
                )}

                {!loading && drivers.length === 0 && (
                    <div className="ui-card mt-5 px-6 py-14 text-center">
                        <p className="text-lg font-semibold text-ink">No drivers found</p>
                        <p className="mt-2 text-sm text-muted">
                            Try a different city or price range.
                        </p>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="ui-button ui-button-secondary"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-muted">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="ui-button ui-button-secondary"
                        >
                            Next
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
};

export default Drivers;
