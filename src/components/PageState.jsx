const PageState = ({ title, description, loading = false }) => (
    <div
        className="flex min-h-[45vh] flex-col items-center justify-center px-6 text-center"
        role={loading ? "status" : undefined}
    >
        {loading && (
            <span
                className="mb-5 h-10 w-10 animate-spin rounded-full border-[3px] border-primary/15 border-t-primary"
                aria-hidden="true"
            />
        )}
        <p className="text-base font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 max-w-md text-sm text-muted">{description}</p>}
    </div>
);

export default PageState;
