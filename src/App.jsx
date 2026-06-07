import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./components/Login";
import RequireRole from "./components/RequireRole";

// Public pages
import Home from "./pages/Home";
import Cars from "./pages/Cars";
import CarDetails from "./pages/CarDetails";
import Drivers from "./pages/Drivers";
import DriverDetails from "./pages/DriverDetails";
import MyBookings from "./pages/MyBookings";
import AccountLicense from "./pages/AccountLicense";

// Owner pages
import OwnerLayout from "./pages/owner/Layout";
import OwnerDashboard from "./pages/owner/Dashboard";
import AddCar from "./pages/owner/AddCar";
import ManageCars from "./pages/owner/ManageCars";
import ManageBookings from "./pages/owner/ManageBookings";
import BusinessDrivers from "./pages/owner/BusinessDrivers";
import OwnerBankDetails from "./pages/owner/BankDetails";
import OwnerFees from "./pages/owner/Fees";
import BusinessProfile from "./pages/owner/BusinessProfile";

// Driver pages
import DriverLayout from "./pages/driver/Layout";
import DriverDashboard from "./pages/driver/Dashboard";
import DriverProfile from "./pages/driver/Profile";
import DriverBookings from "./pages/driver/Bookings";
import DriverFees from "./pages/driver/Fees";
import DriverBankDetails from "./pages/driver/BankDetails";

// Admin pages
import AdminLayout from "./pages/admin/Layout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminFees from "./pages/admin/Fees";
import AdminSettings from "./pages/admin/Settings";
import AdminBusinesses from "./pages/admin/Businesses";
import AdminDrivers from "./pages/admin/Drivers";
import Verifications, { VerificationPlaceholder } from "./pages/admin/Verifications";

import { useAppContext } from "./context/AppContext";

const App = () => {
    const { showLogin } = useAppContext();
    const path = useLocation().pathname;
    const hideShell =
        path.startsWith("/owner") ||
        path.startsWith("/driver") ||
        path.startsWith("/admin");

    return (
        <>
            <Toaster />
            {showLogin && <Login />}

            {!hideShell && <Navbar />}

            <Routes>
                {/* Public */}
                <Route path="/" element={<Home />} />
                <Route path="/cars" element={<Cars />} />
                <Route path="/car-details/:id" element={<CarDetails />} />
                <Route path="/drivers" element={<Drivers />} />
                <Route path="/driver-details/:id" element={<DriverDetails />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/account/license" element={<AccountLicense />} />

                {/* Owner */}
                <Route
                    path="/owner"
                    element={
                        <RequireRole role="business_owner">
                            <OwnerLayout />
                        </RequireRole>
                    }
                >
                    <Route index element={<OwnerDashboard />} />
                    <Route path="add-car" element={<AddCar />} />
                    <Route path="manage-cars" element={<ManageCars />} />
                    <Route path="manage-bookings" element={<ManageBookings />} />
                    <Route path="business-drivers" element={<BusinessDrivers />} />
                    <Route path="bank-details" element={<OwnerBankDetails />} />
                    <Route path="fees" element={<OwnerFees />} />
                    <Route path="profile" element={<BusinessProfile />} />
                </Route>

                {/* Driver */}
                <Route
                    path="/driver"
                    element={
                        <RequireRole role="independent_driver">
                            <DriverLayout />
                        </RequireRole>
                    }
                >
                    <Route index element={<DriverDashboard />} />
                    <Route path="profile" element={<DriverProfile />} />
                    <Route path="bookings" element={<DriverBookings />} />
                    <Route path="fees" element={<DriverFees />} />
                    <Route path="bank-details" element={<DriverBankDetails />} />
                </Route>

                {/* Admin */}
                <Route
                    path="/admin"
                    element={
                        <RequireRole role="super_admin">
                            <AdminLayout />
                        </RequireRole>
                    }
                >
                    <Route index element={<AdminDashboard />} />
                    <Route path="fees" element={<AdminFees />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="businesses" element={<AdminBusinesses />} />
                    <Route path="drivers" element={<AdminDrivers />} />
                    <Route path="verifications" element={<Verifications />}>
                        <Route
                            index
                            element={
                                <VerificationPlaceholder
                                    entity="Pending cars"
                                    endpoint="GET /api/admin/cars/pending"
                                />
                            }
                        />
                        <Route
                            path="cars"
                            element={
                                <VerificationPlaceholder
                                    entity="Pending cars"
                                    endpoint="GET /api/admin/cars/pending"
                                />
                            }
                        />
                        <Route
                            path="business-drivers"
                            element={
                                <VerificationPlaceholder
                                    entity="Pending business drivers"
                                    endpoint="GET /api/admin/business-drivers/pending"
                                />
                            }
                        />
                        <Route
                            path="independent-drivers"
                            element={
                                <VerificationPlaceholder
                                    entity="Pending independent drivers"
                                    endpoint="GET /api/admin/independent-drivers/pending"
                                />
                            }
                        />
                        <Route
                            path="renter-licenses"
                            element={
                                <VerificationPlaceholder
                                    entity="Pending renter licenses"
                                    endpoint="GET /api/admin/licenses/pending"
                                />
                            }
                        />
                        <Route
                            path="booking-payments"
                            element={
                                <VerificationPlaceholder
                                    entity="Pending booking payment proofs"
                                    endpoint="GET /api/admin/booking-payments/pending"
                                />
                            }
                        />
                    </Route>
                </Route>
            </Routes>

            {!hideShell && <Footer />}
        </>
    );
};

export default App;
