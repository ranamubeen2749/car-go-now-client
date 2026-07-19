import { motion } from "motion/react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import Title from "../components/Title";
import CarListingsResults from "../components/CarListingsResults";
import Banner from "../components/Banner";
import Testimonial from "../components/Testimonial";
import Newsletter from "../components/Newsletter";
import { useCarListingsBrowse } from "../hooks/useCarListingsBrowse";

const Home = () => {
    const browse = useCarListingsBrowse({ limit: 6, syncSearchParams: true });

    return (
        <main className="overflow-hidden bg-light">
            <Hero browse={browse} />

            <motion.section
                id="browse-cars"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.55 }}
                className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-24"
            >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <Title
                        align="left"
                        eyebrow="Available now"
                        title="Featured vehicles"
                        subTitle="Verified cars from local rental businesses, ready for your next trip."
                    />
                    <Link to="/cars" className="ui-button ui-button-secondary shrink-0">
                        View all cars <span aria-hidden="true">→</span>
                    </Link>
                </div>
                <div className="mt-10">
                    <CarListingsResults {...browse} compact />
                </div>
            </motion.section>

            <section className="border-y border-borderColor bg-white">
                <div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 sm:px-8 md:grid-cols-2 lg:px-12">
                    <ServiceCard
                        label="Drive your way"
                        title="Book a verified car"
                        description="Choose self-drive or request a business driver with your rental."
                        link="/cars"
                        action="Browse cars"
                        icon="01"
                    />
                    <ServiceCard
                        label="Bring your own car"
                        title="Hire a professional driver"
                        description="Compare independent drivers by city, price, profile, and reviews."
                        link="/drivers"
                        action="Browse drivers"
                        icon="02"
                    />
                </div>
            </section>

            <div className="px-4 py-20 sm:px-6">
                <Banner />
            </div>
            <Testimonial />
            <Newsletter />
        </main>
    );
};

const ServiceCard = ({ label, title, description, link, action, icon }) => (
    <Link
        to={link}
        className="group ui-card flex items-start gap-5 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl sm:p-8"
    >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20">
            {icon}
        </span>
        <span>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {label}
            </span>
            <span className="mt-2 block text-2xl font-semibold text-ink">{title}</span>
            <span className="mt-2 block max-w-lg leading-6 text-muted">{description}</span>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                {action}
                <span className="transition-transform group-hover:translate-x-1">→</span>
            </span>
        </span>
    </Link>
);

export default Home;
