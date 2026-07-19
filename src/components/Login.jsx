import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { locationPlaceholder } from "../assets/assets";

const ROLE_HOMES = {
    customer: "/",
    business_owner: "/owner",
    independent_driver: "/driver",
    super_admin: "/admin",
};

// Map the registration tab to the role the backend will assign on success.
const REGISTER_ROLE_HOMES = {
    customer: "/",
    business: "/owner",
    driver: "/driver",
};

const Login = () => {
    const {
        setShowLogin,
        axios,
        setToken,
        fetchUser,
        navigate,
        loginInitialState,
        loginInitialRole,
    } = useAppContext();

    const [state, setState] = useState(loginInitialState || "login");
    const [role, setRole] = useState(loginInitialRole || "customer");

    // Common
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Business / Driver
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");

    // Business only
    const [businessName, setBusinessName] = useState("");
    const [address, setAddress] = useState("");
    const [country, setCountry] = useState("Pakistan");

    // Driver only
    const [licenseNumber, setLicenseNumber] = useState("");
    const [bio, setBio] = useState("");
    const [pricePerDay, setPricePerDay] = useState("");

    const [submitting, setSubmitting] = useState(false);

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            let endpoint = "";
            let payload = {};

            if (state === "forgot") {
                endpoint = "/api/user/forgot-password";
                payload = { email };
            } else if (state === "login") {
                endpoint = "/api/user/login";
                payload = { email, password };
            } else if (role === "customer") {
                endpoint = "/api/user/register";
                payload = { name, email, password };
            } else if (role === "business") {
                endpoint = "/api/business/register-owner";
                payload = {
                    userName: name,
                    email,
                    password,
                    businessName,
                    phone,
                    address,
                    city,
                    country,
                };
            } else if (role === "driver") {
                endpoint = "/api/driver/register-driver";
                payload = {
                    userName: name,
                    email,
                    password,
                    phone,
                    licenseNumber,
                    bio,
                    pricePerDay: Number(pricePerDay),
                    city,
                };
            }

            const { data } = await axios.post(endpoint, payload);

            if (data.success) {
                if (state === "forgot") {
                    toast.success(data.message);
                    setState("login");
                    return;
                }

                // Prime axios with the new token so the next request authenticates,
                // then fetch user to know the destination role.
                axios.defaults.headers.common["Authorization"] = data.token;
                setToken(data.token);
                setShowLogin(false);
                toast.success(
                    state === "login"
                        ? "Logged in successfully!"
                        : "Registered successfully!"
                );

                let destination = "/";
                if (state === "register") {
                    destination = REGISTER_ROLE_HOMES[role] || "/";
                } else {
                    const fetchedUser = await fetchUser();
                    destination = ROLE_HOMES[fetchedUser?.currentRole] || "/";
                }
                navigate(destination);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            onClick={() => setShowLogin(false)}
            className="fixed inset-0 z-50 flex items-center justify-center text-sm text-gray-600 bg-black/50 overflow-y-auto"
        >
            <form
                onSubmit={onSubmitHandler}
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col gap-4 m-auto p-8 w-[90%] sm:w-[440px] rounded-lg shadow-xl bg-white my-8"
            >
                <p className="text-2xl font-medium text-center">
                    <span className="text-primary">
                        {state === "login"
                            ? "Login"
                            : state === "forgot"
                            ? "Forgot Password"
                            : "Sign Up"}
                    </span>
                </p>

                {state === "forgot" && (
                    <p className="text-center">
                        Enter your account email and we will send you a reset link.
                    </p>
                )}

                {state === "register" && (
                    <div className="flex bg-gray-100 rounded-md p-1 mb-2">
                        <button
                            type="button"
                            onClick={() => setRole("customer")}
                            className={`flex-1 py-1.5 rounded-md ${
                                role === "customer"
                                    ? "bg-white shadow text-primary font-medium"
                                    : ""
                            }`}
                        >
                            Customer
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole("business")}
                            className={`flex-1 py-1.5 rounded-md ${
                                role === "business"
                                    ? "bg-white shadow text-primary font-medium"
                                    : ""
                            }`}
                        >
                            Business
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole("driver")}
                            className={`flex-1 py-1.5 rounded-md ${
                                role === "driver"
                                    ? "bg-white shadow text-primary font-medium"
                                    : ""
                            }`}
                        >
                            Driver
                        </button>
                    </div>
                )}

                {state === "register" && (
                    <div className="w-full">
                        <p>Full Name</p>
                        <input
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                            type="text"
                            required
                        />
                    </div>
                )}

                <div className="w-full">
                    <p>Email</p>
                    <input
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                        type="email"
                        required
                    />
                </div>

                {state !== "forgot" && (
                    <div className="w-full">
                        <p>Password</p>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                            type="password"
                            required
                            minLength={8}
                        />
                    </div>
                )}

                {state === "login" && (
                    <button
                        type="button"
                        onClick={() => setState("forgot")}
                        className="self-end text-primary hover:underline"
                    >
                        Forgot password?
                    </button>
                )}

                {state === "register" && role === "business" && (
                    <>
                        <div className="w-full">
                            <p>Business Name</p>
                            <input
                                onChange={(e) => setBusinessName(e.target.value)}
                                value={businessName}
                                className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                                type="text"
                                required
                            />
                        </div>
                        <div className="w-full flex gap-2">
                            <div className="flex-1">
                                <p>Phone</p>
                                <input
                                    onChange={(e) => setPhone(e.target.value)}
                                    value={phone}
                                    className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                                    type="text"
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <p>City</p>
                                <input
                                    onChange={(e) => setCity(e.target.value)}
                                    value={city}
                                    placeholder={locationPlaceholder}
                                    className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                                    type="text"
                                    required
                                />
                            </div>
                        </div>
                        <div className="w-full">
                            <p>Address</p>
                            <input
                                onChange={(e) => setAddress(e.target.value)}
                                value={address}
                                placeholder="e.g. Main Boulevard, Gulberg III"
                                className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                                type="text"
                                required
                            />
                        </div>
                        <div className="w-full">
                            <p>Country</p>
                            <input
                                onChange={(e) => setCountry(e.target.value)}
                                value={country}
                                placeholder="Pakistan"
                                className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                                type="text"
                                required
                            />
                        </div>
                    </>
                )}

                {state === "register" && role === "driver" && (
                    <>
                        <div className="w-full flex gap-2">
                            <div className="flex-1">
                                <p>Phone</p>
                                <input
                                    onChange={(e) => setPhone(e.target.value)}
                                    value={phone}
                                    className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                                    type="text"
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <p>City</p>
                                <input
                                    onChange={(e) => setCity(e.target.value)}
                                    value={city}
                                    placeholder={locationPlaceholder}
                                    className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                                    type="text"
                                    required
                                />
                            </div>
                        </div>
                        <div className="w-full">
                            <p>License Number</p>
                            <input
                                onChange={(e) => setLicenseNumber(e.target.value)}
                                value={licenseNumber}
                                className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                                type="text"
                                required
                            />
                        </div>
                        <div className="w-full">
                            <p>Price per day</p>
                            <input
                                onChange={(e) => setPricePerDay(e.target.value)}
                                value={pricePerDay}
                                className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                                type="number"
                                required
                            />
                        </div>
                        <div className="w-full">
                            <p>Bio</p>
                            <textarea
                                onChange={(e) => setBio(e.target.value)}
                                value={bio}
                                rows={2}
                                className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                            />
                        </div>
                    </>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary hover:bg-blue-800 transition-all text-white w-full py-2 mt-2 rounded-md cursor-pointer disabled:opacity-60"
                >
                    {submitting
                        ? "Please wait…"
                        : state === "register"
                        ? "Create Account"
                        : state === "forgot"
                        ? "Send Reset Link"
                        : "Login"}
                </button>

                {state === "forgot" ? (
                    <p className="text-center mt-2">
                        <span
                            onClick={() => setState("login")}
                            className="text-primary cursor-pointer hover:underline"
                        >
                            Back to login
                        </span>
                    </p>
                ) : state === "register" ? (
                    <p className="text-center mt-2">
                        Already have an account?{" "}
                        <span
                            onClick={() => setState("login")}
                            className="text-primary cursor-pointer hover:underline"
                        >
                            Log in
                        </span>
                    </p>
                ) : (
                    <p className="text-center mt-2">
                        Create a new account?{" "}
                        <span
                            onClick={() => setState("register")}
                            className="text-primary cursor-pointer hover:underline"
                        >
                            Sign up
                        </span>
                    </p>
                )}
            </form>
        </div>
    );
};

export default Login;
