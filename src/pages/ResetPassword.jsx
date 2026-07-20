import { useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import Brand from "../components/Brand";

const ResetPassword = () => {
    const { token } = useParams();
    const { axios, navigate, openLogin } = useAppContext();
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (password !== confirmation) {
            toast.error("Passwords do not match");
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await axios.post("/api/user/reset-password", {
                token,
                password
            });

            if (!data.success) {
                toast.error(data.message);
                return;
            }

            toast.success(data.message);
            navigate("/");
            openLogin();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-[75vh] items-center justify-center bg-light px-4 py-16">
            <form
                onSubmit={handleSubmit}
                className="ui-card w-full max-w-md overflow-hidden"
            >
                <div className="border-b border-borderColor bg-slate-50 px-7 py-6">
                    <Brand compact />
                    <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                        Account recovery
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                        Reset Password
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-muted">
                        Choose a new password with at least 8 characters.
                    </p>
                </div>

                <div className="space-y-4 px-7 py-6">
                    <label className="block text-sm font-semibold text-slate-700">
                        New password
                        <input
                            type="password"
                            minLength={8}
                            required
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="ui-field mt-1.5"
                        />
                    </label>

                    <label className="block text-sm font-semibold text-slate-700">
                        Confirm new password
                        <input
                            type="password"
                            minLength={8}
                            required
                            autoComplete="new-password"
                            value={confirmation}
                            onChange={(event) => setConfirmation(event.target.value)}
                            className="ui-field mt-1.5"
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="ui-button mt-2 min-h-12 w-full text-base disabled:opacity-60"
                    >
                        {submitting ? "Please wait…" : "Reset Password"}
                    </button>
                </div>
            </form>
        </main>
    );
};

export default ResetPassword;
