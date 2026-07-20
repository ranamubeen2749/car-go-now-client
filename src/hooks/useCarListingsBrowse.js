import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

export const useCarListingsBrowse = ({ limit = 12, syncSearchParams = false } = {}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const pickupLocation = syncSearchParams
        ? searchParams.get("pickupLocation") || ""
        : "";
    const initialSearch = syncSearchParams ? searchParams.get("search") || "" : "";

    const { axios } = useAppContext();

    const [location, setLocation] = useState(pickupLocation);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    const [query, setQuery] = useState({
        location: pickupLocation,
        minPrice: "",
        maxPrice: "",
        sortBy: "createdAt",
        sortOrder: "desc",
        search: initialSearch,
        page: 1,
    });
    const [input, setInput] = useState(initialSearch);

    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(false);
    const requestId = useRef(0);

    useEffect(() => {
        if (syncSearchParams) {
            setLocation(pickupLocation);
        }
    }, [pickupLocation, syncSearchParams]);

    useEffect(() => {
        if (syncSearchParams) {
            setInput((current) => (current === initialSearch ? current : initialSearch));
        }
    }, [initialSearch, syncSearchParams]);

    const fetchListings = useCallback(async () => {
        if (!query) return;

        const currentRequest = ++requestId.current;
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
            if (query.search) params.search = query.search;

            const { data } = await axios.get("/api/car/listings", { params });
            if (data.success && currentRequest === requestId.current) {
                setCars(data.cars);
                setTotalPages(data.pagination?.totalPages || 1);
                setTotal(data.pagination?.total || data.cars.length);
                if (data.cars.length === 0 && !query.search) {
                    toast("No cars match these filters");
                }
            } else if (!data.success) {
                toast.error(data.message || "Failed to fetch cars");
            }
        } catch (error) {
            if (currentRequest === requestId.current) {
                toast.error(error.response?.data?.message || error.message);
            }
        } finally {
            if (currentRequest === requestId.current) setLoading(false);
        }
    }, [axios, query, limit]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            const search = input.trim();
            setQuery((previous) =>
                previous.search === search
                    ? previous
                    : { ...previous, search, page: 1 }
            );

            if (syncSearchParams && searchParams.get("search") !== search) {
                const next = new URLSearchParams(searchParams);
                if (search) next.set("search", search);
                else next.delete("search");
                setSearchParams(next, { replace: true });
            }
        }, 350);

        return () => clearTimeout(timeout);
    }, [input, searchParams, setSearchParams, syncSearchParams]);

    const handleApplyFilters = (e) => {
        e.preventDefault();
        setQuery({
            location,
            minPrice,
            maxPrice,
            sortBy,
            sortOrder,
            search: query.search,
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
        displayedCars: cars,
        handleApplyFilters,
        goToPage,
    };
};
