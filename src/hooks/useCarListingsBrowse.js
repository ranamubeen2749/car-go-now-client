import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

export const useCarListingsBrowse = ({ limit = 12, syncSearchParams = false } = {}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const pickupLocation = syncSearchParams
        ? searchParams.get("pickupLocation") || ""
        : "";

    const { axios } = useAppContext();

    const [location, setLocation] = useState(pickupLocation);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    const [query, setQuery] = useState(null);
    const [input, setInput] = useState("");

    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (syncSearchParams) {
            setLocation(pickupLocation);
        }
    }, [pickupLocation, syncSearchParams]);

    const fetchListings = useCallback(async () => {
        if (!query) return;

        setLoading(true);
        try {
            const params = {
                page: query.page,
                limit,
                sortBy: query.sortBy,
                sortOrder: query.sortOrder,
            };
            if (query.location) params.location = query.location;
            if (query.minPrice) params.minPrice = Number(query.minPrice);
            if (query.maxPrice) params.maxPrice = Number(query.maxPrice);

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
    }, [axios, query, limit]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    const handleApplyFilters = (e) => {
        e.preventDefault();
        setQuery({
            location,
            minPrice,
            maxPrice,
            sortBy,
            sortOrder,
            page: 1,
        });

        if (syncSearchParams) {
            const next = new URLSearchParams(searchParams);
            if (location) next.set("pickupLocation", location);
            else next.delete("pickupLocation");
            setSearchParams(next, { replace: true });
        }
    };

    const goToPage = (page) => {
        setQuery((prev) => (prev ? { ...prev, page } : prev));
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

    return {
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
        loading,
        total,
        totalPages,
        displayedCars,
        handleApplyFilters,
        goToPage,
    };
};
