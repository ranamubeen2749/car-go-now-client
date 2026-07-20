import { motion } from "motion/react";
import { assets, locationPlaceholder } from "../assets/assets";

const fields = [
    ["Location", "location"],
    ["Min price", "min"],
    ["Max price", "max"],
];

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
    const values = { location, min: minPrice, max: maxPrice };
    const setters = { location: setLocation, min: setMinPrice, max: setMaxPrice };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: isHero ? 0.25 : 0 }}
            className={`mx-auto w-full max-w-7xl ${
                isHero
                    ? "rounded-2xl border border-white/15 bg-white/95 p-4 text-ink shadow-2xl shadow-slate-950/25 backdrop-blur sm:p-5"
                    : "ui-card p-4 sm:p-5"
            }`}
        >
            <form
                onSubmit={handleApplyFilters}
                className="grid grid-cols-2 items-end gap-3 md:grid-cols-3 lg:grid-cols-6"
            >
                {fields.map(([label, key]) => (
                    <label key={key} className="text-left text-xs font-semibold text-slate-600">
                        {label}
                        <input
                            type={key === "location" ? "text" : "number"}
                            min={key === "location" ? undefined : "0"}
                            value={values[key]}
                            onChange={(event) => setters[key](event.target.value)}
                            placeholder={key === "location" ? locationPlaceholder : "Any"}
                            className="ui-field mt-1.5"
                        />
                    </label>
                ))}

                <label className="text-left text-xs font-semibold text-slate-600">
                    Sort by
                    <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                        className="ui-field mt-1.5"
                    >
                        <option value="createdAt">Newest</option>
                        <option value="pricePerDay">Price</option>
                        <option value="year">Year</option>
                    </select>
                </label>

                <label className="text-left text-xs font-semibold text-slate-600">
                    Order
                    <select
                        value={sortOrder}
                        onChange={(event) => setSortOrder(event.target.value)}
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

            <label className="ui-search-field mt-4 flex h-12 items-center gap-3 rounded-xl border border-borderColor bg-slate-50 px-4 transition">
                <img src={assets.search_icon} alt="" className="h-4 w-4 opacity-60" />
                <span className="sr-only">Search cars</span>
                <input
                    onChange={(event) => setInput(event.target.value)}
                    value={input}
                    type="search"
                    placeholder="Search make, model, category, or transmission"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-slate-400"
                    disabled={!query}
                />
            </label>
        </motion.div>
    );
};

export default CarListingsFilter;
