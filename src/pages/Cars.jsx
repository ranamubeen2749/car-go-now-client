import React from "react";
import CarListingsBrowse from "../components/CarListingsBrowse";

const Cars = () => {
    return <CarListingsBrowse syncSearchParams limit={12} />;
};

export default Cars;
