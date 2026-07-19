import { Link } from "react-router-dom";

const Brand = ({ compact = false, label }) => (
    <Link
        to="/"
        aria-label="Car Go Now home"
        className="inline-flex min-w-0 items-center gap-2 text-ink"
    >
        <span
            aria-hidden="true"
            className={`grid shrink-0 place-items-center rounded-xl bg-primary font-bold text-white shadow-sm ${
                compact ? "h-9 w-9 text-sm" : "h-10 w-10 text-base"
            }`}
        >
            CG
        </span>
        <span className="min-w-0">
            <span className="block truncate text-lg font-bold leading-tight tracking-tight sm:text-xl">
                Car <span className="text-primary">Go Now</span>
            </span>
            {label && (
                <span className="block truncate text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                    {label}
                </span>
            )}
        </span>
    </Link>
);

export default Brand;
