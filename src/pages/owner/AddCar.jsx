import React, { useState } from "react";
import Title from "../../components/owner/Title";
import { assets, locationPlaceholder } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const EMPTY_CAR = {
    brand: "",
    model: "",
    year: "",
    pricePerDay: "",
    category: "",
    transmission: "",
    fuel_type: "",
    seating_capacity: "",
    location: "",
    description: "",
};

const AddCar = () => {
    const { axios, currency } = useAppContext();

    const [car, setCar] = useState(EMPTY_CAR);
    const [images, setImages] = useState([]); // max 10
    const [documents, setDocuments] = useState([]); // max 5
    const [isLoading, setIsLoading] = useState(false);

    const setField = (key, value) => setCar((prev) => ({ ...prev, [key]: value }));

    const onPickImages = (e) => {
        const files = Array.from(e.target.files || []);
        if (images.length + files.length > 10) {
            toast.error("Max 10 images");
            return;
        }
        setImages((prev) => [...prev, ...files]);
    };

    const onPickDocs = (e) => {
        const files = Array.from(e.target.files || []);
        if (documents.length + files.length > 5) {
            toast.error("Max 5 documents");
            return;
        }
        setDocuments((prev) => [...prev, ...files]);
    };

    const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));
    const removeDoc = (idx) => setDocuments((prev) => prev.filter((_, i) => i !== idx));

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        try {
            const formData = new FormData();
            Object.entries(car).forEach(([key, value]) => formData.append(key, value));
            images.forEach((file) => formData.append("images", file));
            documents.forEach((file) => formData.append("documents", file));

            const { data } = await axios.post("/api/car/add", formData);

            if (data.success) {
                toast.success(data.message || "Car added");
                setCar(EMPTY_CAR);
                setImages([]);
                setDocuments([]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="px-4 py-10 md:px-10 flex-1">
            <Title
                title="Add New Car"
                subTitle="Fill in details to list a new car. Cars require super admin approval before going live."
            />

            <form
                onSubmit={onSubmitHandler}
                className="flex flex-col gap-5 text-gray-500 text-sm mt-6 max-w-2xl"
            >
                {/* Images */}
                <div>
                    <p className="font-medium text-gray-700 mb-2">Car Images (up to 10)</p>
                    <div className="flex flex-wrap gap-3 items-center">
                        <label
                            htmlFor="car-images"
                            className="flex flex-col items-center justify-center h-20 w-28 border-2 border-dashed border-borderColor rounded cursor-pointer text-xs text-gray-500"
                        >
                            <img src={assets.upload_icon} alt="" className="h-6" />
                            Add image
                            <input
                                type="file"
                                id="car-images"
                                accept="image/*"
                                multiple
                                hidden
                                onChange={onPickImages}
                            />
                        </label>
                        {images.map((file, idx) => (
                            <div key={idx} className="relative h-20 w-28">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt=""
                                    className="h-full w-full object-cover rounded"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Documents */}
                <div>
                    <p className="font-medium text-gray-700 mb-2">
                        Supporting Documents (up to 5)
                    </p>
                    <div className="flex flex-wrap gap-3 items-center">
                        <label
                            htmlFor="car-docs"
                            className="flex flex-col items-center justify-center h-20 w-28 border-2 border-dashed border-borderColor rounded cursor-pointer text-xs text-gray-500"
                        >
                            <img src={assets.upload_icon} alt="" className="h-6" />
                            Add doc
                            <input
                                type="file"
                                id="car-docs"
                                multiple
                                hidden
                                onChange={onPickDocs}
                            />
                        </label>
                        {documents.map((file, idx) => (
                            <div
                                key={idx}
                                className="relative h-20 w-28 border border-borderColor rounded flex flex-col items-center justify-center text-xs text-gray-500 p-2"
                            >
                                <p className="truncate w-full text-center">{file.name}</p>
                                <button
                                    type="button"
                                    onClick={() => removeDoc(idx)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Brand & Model */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col w-full">
                        <label>Brand</label>
                        <input
                            type="text"
                            placeholder="e.g. BMW"
                            required
                            className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
                            value={car.brand}
                            onChange={(e) => setField("brand", e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Model</label>
                        <input
                            type="text"
                            placeholder="e.g. X5"
                            required
                            className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
                            value={car.model}
                            onChange={(e) => setField("model", e.target.value)}
                        />
                    </div>
                </div>

                {/* Year, Price, Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="flex flex-col w-full">
                        <label>Year</label>
                        <input
                            type="number"
                            placeholder="2025"
                            required
                            className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
                            value={car.year}
                            onChange={(e) => setField("year", e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Daily Price ({currency})</label>
                        <input
                            type="number"
                            placeholder="100"
                            required
                            className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
                            value={car.pricePerDay}
                            onChange={(e) => setField("pricePerDay", e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Category</label>
                        <select
                            required
                            value={car.category}
                            onChange={(e) => setField("category", e.target.value)}
                            className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
                        >
                            <option value="">Select a category</option>
                            <option value="Sedan">Sedan</option>
                            <option value="SUV">SUV</option>
                            <option value="Van">Van</option>
                            <option value="Hatchback">Hatchback</option>
                            <option value="Coupe">Coupe</option>
                            <option value="Truck">Truck</option>
                        </select>
                    </div>
                </div>

                {/* Transmission, Fuel, Seating */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="flex flex-col w-full">
                        <label>Transmission</label>
                        <select
                            required
                            value={car.transmission}
                            onChange={(e) => setField("transmission", e.target.value)}
                            className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
                        >
                            <option value="">Select</option>
                            <option value="Automatic">Automatic</option>
                            <option value="Manual">Manual</option>
                            <option value="Semi-Automatic">Semi-Automatic</option>
                        </select>
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Fuel Type</label>
                        <select
                            required
                            value={car.fuel_type}
                            onChange={(e) => setField("fuel_type", e.target.value)}
                            className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
                        >
                            <option value="">Select</option>
                            <option value="Gas">Gas</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Petrol">Petrol</option>
                            <option value="Electric">Electric</option>
                            <option value="Hybrid">Hybrid</option>
                        </select>
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Seating Capacity</label>
                        <input
                            type="number"
                            placeholder="4"
                            required
                            className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
                            value={car.seating_capacity}
                            onChange={(e) => setField("seating_capacity", e.target.value)}
                        />
                    </div>
                </div>

                {/* Location */}
                <div className="flex flex-col w-full">
                    <label>Location</label>
                    <input
                        type="text"
                        placeholder={locationPlaceholder}
                        required
                        className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
                        value={car.location}
                        onChange={(e) => setField("location", e.target.value)}
                    />
                </div>

                <div className="flex flex-col w-full">
                    <label>Description</label>
                    <textarea
                        rows={4}
                        required
                        placeholder="e.g. A luxurious SUV with a spacious interior and a powerful engine."
                        className="px-3 py-2 mt-1 border border-borderColor rounded-md outline-none"
                        value={car.description}
                        onChange={(e) => setField("description", e.target.value)}
                    />
                </div>

                <button
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2.5 mt-4 bg-primary text-white rounded-md font-medium w-max cursor-pointer disabled:opacity-60"
                >
                    <img src={assets.tick_icon} alt="" />
                    {isLoading ? "Listing…" : "List Your Car"}
                </button>
            </form>
        </div>
    );
};

export default AddCar;
