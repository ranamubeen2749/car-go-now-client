import React, { useEffect } from "react";
import Hero from "../components/Hero";
import FeaturedSection from "../components/FeaturedSection";
import Banner from "../components/Banner";
import Testimonial from "../components/Testimonial";
import Newsletter from "../components/Newsletter";
import { useAppContext } from "../context/AppContext";

const Home = () => {
    const { fetchCars } = useAppContext();

    useEffect(() => {
        fetchCars({ page: 1, limit: 6, sortBy: "createdAt", sortOrder: "desc" });
    }, []);

    return (
        <>
            <Hero />
            <FeaturedSection />
            <Banner />
            <Testimonial />
            <Newsletter />
        </>
    );
};

export default Home;
