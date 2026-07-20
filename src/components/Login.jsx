import { useState } from "react";
import toast from "react-hot-toast";
import { locationPlaceholder } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import Brand from "./Brand";

const ROLE_HOMES = {
    customer: "/",
    business_owner: "/owner",
    independent_driver: "/driver",
    super_admin: "/admin",
};

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
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [address, setAddress] = useState("");
    const [country, setCountry] = useState("Pakistan");
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
            } else {
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
            if (!data.success) {
                toast.error(data.message);
                return;
            }

            if (state === "forgot") {
                toast.success(data.message);
                setState("login");
                return;
            }

            axios.defaults.headers.common["Authorization"] = data.token;
            setToken(data.token);
            setShowLogin(false);
            toast.success(
                state === "login" ? "Logged in successfully!" : "Registered successfully!"
            );

            if (state === "register") {
                navigate(REGISTER_ROLE_HOMES[role] || "/");
            } else {
                const fetchedUser = await fetchUser();
                navigate(ROLE_HOMES[fetchedUser?.currentRole] || "/");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const title =
        state === "login"
            ? "Welcome back"
            : state === "forgot"
              ? "Forgot Password"
              : "Create your account";

    return (
        <div
            onClick={() => setShowLogin(false)}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm"
            role="presentation"
        >
            <form
                onSubmit={onSubmitHandler}
                onClick={(event) => event.stopPropagation()}
                className="ui-card relative mx-auto my-4 w-full max-w-lg overflow-hidden sm:my-10"
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-title"
            >
                <div className="border-b border-borderColor bg-slate-50 px-6 py-5 sm:px-8">
                    <div className="flex items-center justify-between gap-4">
                        <Brand compact />
                        <button
                            type="button"
                            onClick={() => setShowLogin(false)}
                            className="ui-icon-button"
                            aria-label="Close authentication"
                        >
                            ×
                        </button>
                    </div>
                    <h1 id="auth-title" className="mt-6 text-2xl font-semibold text-ink">
                        {title}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-muted">
                        {state === "login"
                            ? "Sign in to manage bookings, payments, and account updates."
                            : state === "forgot"
                              ? "Enter your account email and we will send you a reset link."
                              : "Choose the account type that matches how you use Car Go Now."}
                    </p>
                </div>

                <div className="space-y-4 px-6 py-6 sm:px-8">
                    {state === "register" && (
                        <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1">
                            {[
                                ["customer", "Customer"],
                                ["business", "Business"],
                                ["driver", "Driver"],
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setRole(value)}
                                    className={`min-h-10 rounded-lg px-2 text-sm font-semibold transition ${
                                        role === value
                                            ? "bg-white text-primary shadow-sm"
                                            : "text-slate-500 hover:text-ink"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    {state === "register" && (
                        <Field label="Full name" value={name} onChange={setName} required />
                    )}
                    <Field
                        label="Email"
                        type="email"
                        value={email}
                        onChange={setEmail}
                        autoComplete="email"
                        required
                    />
                    {state !== "forgot" && (
                        <Field
                            label="Password"
                            type="password"
                            value={password}
                            onChange={setPassword}
                            autoComplete={state === "login" ? "current-password" : "new-password"}
                            minLength={8}
                            hint={state === "register" ? "Use at least 8 characters." : undefined}
                            required
                        />
                    )}

                    {state === "login" && (
                        <button
                            type="button"
                            onClick={() => setState("forgot")}
                            className="ml-auto block text-sm font-semibold text-primary hover:underline"
                        >
                            Forgot password?
                        </button>
                    )}

                    {state === "register" && role === "business" && (
                        <>
                            <Field
                                label="Business name"
                                value={businessName}
                                onChange={setBusinessName}
                                required
                            />
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Phone" value={phone} onChange={setPhone} required />
                                <Field
                                    label="City"
                                    value={city}
                                    onChange={setCity}
                                    placeholder={locationPlaceholder}
                                    required
                                />
                            </div>
                            <Field
                                label="Address"
                                value={address}
                                onChange={setAddress}
                                placeholder="e.g. Main Boulevard, Gulberg III"
                                required
                            />
                            <Field
                                label="Country"
                                value={country}
                                onChange={setCountry}
                                required
                            />
                        </>
                    )}

                    {state === "register" && role === "driver" && (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Phone" value={phone} onChange={setPhone} required />
                                <Field
                                    label="City"
                                    value={city}
                                    onChange={setCity}
                                    placeholder={locationPlaceholder}
                                    required
                                />
                            </div>
                            <Field
                                label="License number"
                                value={licenseNumber}
                                onChange={setLicenseNumber}
                                required
                            />
                            <Field
                                label="Price per day"
                                type="number"
                                min="0"
                                value={pricePerDay}
                                onChange={setPricePerDay}
                                required
                            />
                            <label className="block text-sm font-semibold text-slate-700">
                                Bio
                                <textarea
                                    onChange={(event) => setBio(event.target.value)}
                                    value={bio}
                                    rows={3}
                                    className="ui-field mt-1.5 min-h-24 resize-y"
                                />
                            </label>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="ui-button min-h-12 w-full text-base disabled:opacity-60"
                    >
                        {submitting
                            ? "Please wait…"
                            : state === "register"
                              ? "Create Account"
                              : state === "forgot"
                                ? "Send Reset Link"
                                : "Login"}
                    </button>

                    <p className="text-center text-sm text-muted">
                        {state === "forgot" ? (
                            <button
                                type="button"
                                onClick={() => setState("login")}
                                className="font-semibold text-primary hover:underline"
                            >
                                Back to login
                            </button>
                        ) : state === "register" ? (
                            <>
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => setState("login")}
                                    className="font-semibold text-primary hover:underline"
                                >
                                    Log in
                                </button>
                            </>
                        ) : (
                            <>
                                Create a new account?{" "}
                                <span
                                    onClick={() => setState("register")}
                                    className="cursor-pointer font-semibold text-primary hover:underline"
                                >
                                    Sign up
                                </span>
                            </>
                        )}
                    </p>
                </div>
            </form>
        </div>
    );
};

const Field = ({ label, hint, value, onChange, ...props }) => (
    <label className="block text-sm font-semibold text-slate-700">
        {label}
        <input
            {...props}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="ui-field mt-1.5"
        />
        {hint && <span className="mt-1.5 block text-xs font-normal text-muted">{hint}</span>}
    </label>
);

export default Login;
