const formatDate = date =>
    new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

const BookingAvailability = ({
    ranges,
    loading,
    error,
    conflict,
    invalidRange,
    hasSelection
}) => (
    <div className="rounded-xl border border-borderColor bg-slate-50 p-4 text-sm" aria-live="polite">
        <p className="font-semibold text-ink">Date availability</p>
        {loading ? (
            <p className="mt-2 text-muted">Checking unavailable dates…</p>
        ) : error ? (
            <p className="mt-2 text-amber-700">
                Availability could not be loaded. Your dates will still be checked
                when you submit.
            </p>
        ) : (
            <>
                {ranges.length > 0 ? (
                    <div className="mt-2 max-h-28 space-y-1 overflow-y-auto text-muted">
                        {ranges.map((range, index) => (
                            <p key={`${range.startDate}-${range.endDate}-${index}`}>
                                Unavailable: {formatDate(range.startDate)} –{" "}
                                {formatDate(range.endDate)}
                            </p>
                        ))}
                    </div>
                ) : (
                    <p className="mt-2 text-emerald-700">No unavailable dates listed.</p>
                )}
                <p className="mt-2 text-xs text-muted">Return dates are also blocked.</p>
            </>
        )}

        {invalidRange && (
            <p className="mt-3 font-semibold text-red-600">
                The end date must be after the start date.
            </p>
        )}
        {conflict && (
            <p className="mt-3 font-semibold text-red-600">
                Your selected dates overlap an existing booking.
            </p>
        )}
        {hasSelection && !loading && !error && !invalidRange && !conflict && (
            <p className="mt-3 font-semibold text-emerald-700">
                Your selected dates are available.
            </p>
        )}
    </div>
);

export default BookingAvailability;
