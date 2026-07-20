import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import CarCard from "./CarCard";
import PageState from "./PageState";

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

    if (!query) return null;

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted" aria-live="polite">
                    {loading
                        ? "Updating results…"
                        : `${total} ${total === 1 ? "car" : "cars"} available`}
                </p>
            </div>

            {loading && displayedCars.length === 0 ? (
                <div className="ui-card mt-5">
                    <PageState
                        compact
                        loading
                        title="Finding available cars"
                        description="Checking the latest verified listings…"
                    />
                </div>
            ) : displayedCars.length === 0 ? (
                <div className="ui-card mt-5 px-6 py-14 text-center">
                    <p className="text-lg font-semibold text-ink">No cars found</p>
                    <p className="mt-2 text-sm text-muted">
                        Try a different location, price range, or search term.
                    </p>
                </div>
            ) : (
                <div
                    className={`mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${
                        compact ? "" : "xl:gap-7"
                    }`}
                >
                    {displayedCars.map((car, index) => (
                        <motion.div
                            key={car._id || index}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: Math.min(index * 0.04, 0.2), duration: 0.35 }}
                        >
                            <CarCard car={car} />
                        </motion.div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => goToPage(Math.max(1, query.page - 1))}
                        disabled={query.page === 1 || loading}
                        className="ui-button ui-button-secondary"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-muted">
                        Page {query.page} of {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => goToPage(Math.min(totalPages, query.page + 1))}
                        disabled={query.page === totalPages || loading}
                        className="ui-button ui-button-secondary"
                    >
                        Next
                    </button>
                </div>
            )}

            {showExploreAll && (
                <button
                    type="button"
                    onClick={() => {
                        navigate(exploreAllPath);
                        scrollTo(0, 0);
                    }}
                    className="ui-button ui-button-secondary mx-auto mt-10 flex"
                >
                    Explore all cars <span aria-hidden="true">→</span>
                </button>
            )}
        </>
    );
};

export default CarListingsResults;
