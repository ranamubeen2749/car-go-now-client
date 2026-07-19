const Title = ({ title, subTitle, eyebrow, align }) => {
    const left = align === "left";

    return (
        <div
            className={`flex flex-col ${
                left
                    ? "items-start text-left"
                    : "items-center text-center"
            }`}
        >
            {eyebrow && (
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    {eyebrow}
                </p>
            )}
            <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-[40px] md:leading-tight">
                {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted md:text-base">
                {subTitle}
            </p>
        </div>
    );
};

export default Title;
