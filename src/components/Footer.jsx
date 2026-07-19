import { Link } from "react-router-dom";
import Brand from "./Brand";

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="mt-24 border-t border-borderColor bg-white">
            <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10 xl:px-14">
                <div className="grid gap-10 border-b border-borderColor pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
                    <div>
                        <Brand />
                        <p className="mt-4 max-w-md text-sm leading-6 text-muted">
                            Book verified cars and professional drivers across Pakistan with
                            clear pricing and dependable support.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-ink">Explore</h2>
                        <nav className="mt-4 flex flex-col items-start gap-3 text-sm text-muted">
                            <Link className="hover:text-primary" to="/cars">
                                Browse cars
                            </Link>
                            <Link className="hover:text-primary" to="/drivers">
                                Find a driver
                            </Link>
                            <Link className="hover:text-primary" to="/my-bookings">
                                My bookings
                            </Link>
                            <Link className="hover:text-primary" to="/account/license">
                                Driving license
                            </Link>
                        </nav>
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-ink">Contact</h2>
                        <address className="mt-4 space-y-2 text-sm not-italic leading-6 text-muted">
                            <p>Main Boulevard, Gulberg III</p>
                            <p>Lahore, Pakistan</p>
                            <a className="block hover:text-primary" href="tel:+923001234567">
                                +92 300 1234567
                            </a>
                            <a className="block hover:text-primary" href="mailto:info@cargonow.pk">
                                info@cargonow.pk
                            </a>
                        </address>
                    </div>
                </div>

                <div className="flex flex-col gap-2 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
                    <p>© {year} Car Go Now. All rights reserved.</p>
                    <p>Cars and drivers are subject to verification and availability.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
