import { motion } from "motion/react";
import Title from "./Title";

const testimonials = [
    {
        name: "Ayesha Khan",
        location: "Lahore",
        testimonial:
            "The car matched the listing, pickup was straightforward, and every booking update was easy to follow.",
    },
    {
        name: "Hassan Ali",
        location: "Karachi",
        testimonial:
            "I booked a car with a driver for a family trip. Comparing the options in one place saved a lot of time.",
    },
    {
        name: "Fatima Malik",
        location: "Islamabad",
        testimonial:
            "The clear pricing and payment status made the whole rental feel much more dependable.",
    },
];

const Testimonial = () => (
    <section className="bg-white px-6 py-20 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-7xl">
            <Title
                eyebrow="Customer stories"
                title="Trusted for the whole journey"
                subTitle="Clear listings, verified profiles, and one place to follow every booking."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-3">
                {testimonials.map((item, index) => (
                    <motion.article
                        key={item.name}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.45, delay: index * 0.08 }}
                        className="ui-card flex h-full flex-col p-6 sm:p-7"
                    >
                        <div className="flex gap-1 text-amber-400" aria-label="5 out of 5 stars">
                            {"★★★★★"}
                        </div>
                        <blockquote className="mt-5 flex-1 text-base leading-7 text-slate-600">
                            “{item.testimonial}”
                        </blockquote>
                        <div className="mt-7 border-t border-borderColor pt-5">
                            <p className="font-semibold text-ink">{item.name}</p>
                            <p className="text-sm text-muted">{item.location}, Pakistan</p>
                        </div>
                    </motion.article>
                ))}
            </div>
        </div>
    </section>
);

export default Testimonial;
