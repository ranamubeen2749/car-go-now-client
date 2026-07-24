import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";

export const nextDate = date => {
    if (!date) return new Date().toISOString().slice(0, 10);
    const next = new Date(`${date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return next.toISOString().slice(0, 10);
};

export const useBookingAvailability = ({ endpoint, startDate, endDate }) => {
    const { axios } = useAppContext();
    const [ranges, setRanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const requestId = useRef(0);

    const refresh = useCallback(async () => {
        if (!endpoint) return;
        const currentRequest = ++requestId.current;
        setLoading(true);
        setError("");
        setRanges([]);
        try {
            const { data } = await axios.get(endpoint, {
                params: { from: new Date().toISOString().slice(0, 10) }
            });
            if (currentRequest !== requestId.current) return;
            if (data.success) setRanges(data.unavailableRanges || []);
            else setError(data.message || "Availability could not be loaded");
        } catch (requestError) {
            if (currentRequest === requestId.current) {
                setError(
                    requestError.response?.data?.message ||
                        "Availability could not be loaded"
                );
            }
        } finally {
            if (currentRequest === requestId.current) setLoading(false);
        }
    }, [axios, endpoint]);

    useEffect(() => {
        refresh();
        return () => {
            requestId.current += 1;
        };
    }, [refresh]);

    const invalidRange = Boolean(startDate && endDate && endDate <= startDate);
    const conflict = useMemo(
        () =>
            startDate && endDate && !invalidRange
                ? ranges.find(
                      range =>
                          range.startDate <= endDate &&
                          range.endDate >= startDate
                  ) || null
                : null,
        [endDate, invalidRange, ranges, startDate]
    );

    return { ranges, loading, error, conflict, invalidRange, refresh };
};
