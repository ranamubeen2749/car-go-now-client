import { createContext, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const navigate = useNavigate();
    const currency = import.meta.env.VITE_CURRENCY || "$";

    // Auth state
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(Boolean(token));
    const authRequest = useRef(0);

    // UI state
    const [showLogin, setShowLogin] = useState(false);
    const [loginInitialState, setLoginInitialState] = useState("login"); // "login" | "register"
    const [loginInitialRole, setLoginInitialRole] = useState("customer"); // "customer" | "business" | "driver"

    // Shared booking date state (used by Hero / CarDetails)
    const [pickupDate, setPickupDate] = useState("");
    const [returnDate, setReturnDate] = useState("");

    // Public car list cache used by Home/FeaturedSection
    const [cars, setCars] = useState([]);

    // Derived role helpers
    const hasRoles = user?.hasRoles || [];
    const currentRole = user?.currentRole || null;
    const isCustomer = currentRole === "customer";
    const isOwner = currentRole === "business_owner";
    const isDriver = currentRole === "independent_driver";
    const isAdmin = currentRole === "super_admin";

    const fetchUser = async () => {
        const requestId = ++authRequest.current;
        try {
            const { data } = await axios.get("/api/user/data");
            if (data.success) {
                if (requestId === authRequest.current) setUser(data.user);
                return data.user;
            } else if (requestId === authRequest.current) {
                logout();
            }
        } catch (error) {
            console.error("fetchUser error:", error);
            if (requestId === authRequest.current && error.response?.status === 401) {
                logout();
            }
        }
        return null;
    };

    // Public car listings. Accepts query params per docs/api/car-controller.md
    const fetchCars = async (params = {}) => {
        try {
            const { data } = await axios.get("/api/car/listings", { params });
            if (data.success) {
                setCars(data.cars);
                return data;
            }
            return null;
        } catch (error) {
            console.error("fetchCars error:", error);
            return null;
        }
    };

    const switchRole = async (role) => {
        try {
            const { data } = await axios.post("/api/user/switch-role", { role });
            if (data.success) {
                await fetchUser();
                toast.success(data.message || "Role switched");
                return true;
            }
            toast.error(data.message || "Failed to switch role");
            return false;
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
            return false;
        }
    };

    const openLogin = (state = "login", role = "customer") => {
        setLoginInitialState(state);
        setLoginInitialRole(role);
        setShowLogin(true);
    };

    const logout = () => {
        authRequest.current += 1;
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setAuthLoading(false);
        delete axios.defaults.headers.common["Authorization"];
        toast.success("You have been logged out");
        navigate("/");
    };

    // Keep axios header in sync with token
    useEffect(() => {
        let active = true;

        const restoreSession = async () => {
            if (token) {
                setAuthLoading(true);
                axios.defaults.headers.common["Authorization"] = token;
                localStorage.setItem("token", token);
                await fetchUser();
            } else {
                delete axios.defaults.headers.common["Authorization"];
                localStorage.removeItem("token");
            }

            if (active) setAuthLoading(false);
        };

        restoreSession();
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const value = {
        navigate,
        currency,
        axios,
        // auth
        user,
        setUser,
        token,
        setToken,
        authLoading,
        fetchUser,
        logout,
        // role helpers
        hasRoles,
        currentRole,
        isCustomer,
        isOwner,
        isDriver,
        isAdmin,
        switchRole,
        // login modal
        showLogin,
        setShowLogin,
        openLogin,
        loginInitialState,
        loginInitialRole,
        // cars cache (home page)
        cars,
        setCars,
        fetchCars,
        // shared booking date state
        pickupDate,
        setPickupDate,
        returnDate,
        setReturnDate,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
