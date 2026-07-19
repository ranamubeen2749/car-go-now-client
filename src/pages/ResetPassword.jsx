import { useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

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
        <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl"
            >
                <h1 className="text-2xl font-medium text-center text-primary">
                    Reset Password
                </h1>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Choose a new password with at least 8 characters.
                </p>

                <label className="block mt-6 text-sm text-gray-600">
                    New password
                    <input
                        type="password"
                        minLength={8}
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="mt-1 w-full rounded border border-gray-200 p-2 outline-primary"
                    />
                </label>

                <label className="block mt-4 text-sm text-gray-600">
                    Confirm new password
                    <input
                        type="password"
                        minLength={8}
                        required
                        value={confirmation}
                        onChange={(event) => setConfirmation(event.target.value)}
                        className="mt-1 w-full rounded border border-gray-200 p-2 outline-primary"
                    />
                </label>

                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-6 w-full rounded bg-primary py-2 text-white transition-all hover:bg-blue-800 disabled:opacity-60"
                >
                    {submitting ? "Please wait…" : "Reset Password"}
                </button>
            </form>
        </main>
    );
};

export default ResetPassword;
