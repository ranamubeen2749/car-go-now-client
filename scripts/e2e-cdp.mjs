import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CDP_URL = process.env.E2E_CDP_URL || "http://127.0.0.1:9222";
const APP_URL = process.env.E2E_APP_URL || "http://127.0.0.1:5173";
const API_URL = process.env.E2E_API_URL || "http://localhost:3002";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "ranamubeen2749@gmail.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "test@123";
const STEP_DELAY = Number(process.env.E2E_STEP_DELAY_MS || 350);
const TEST_IMAGE =
    process.env.E2E_TEST_IMAGE ||
    "/home/walid-baharwal/Downloads/CarRental/CarRental-fullstack/client/src/assets/user_profile.png";
const HOME_TEXT = "Luxury cars on Rent";
const SERVER_DIR = fileURLToPath(new URL("../../server", import.meta.url));

const runId = Date.now().toString(36);
const password = "Test@1234";
let customerPassword = password;
const customer = {
    name: `E2E Customer ${runId}`,
    email: `e2e.customer.${runId}@example.com`,
};
const owner = {
    name: `E2E Owner ${runId}`,
    email: `e2e.owner.${runId}@example.com`,
    business: `E2E Rentals ${runId}`,
};
const car = {
    brand: "E2E Toyota",
    model: `Corolla ${runId}`,
};
const driver = {
    name: `E2E Driver ${runId}`,
    license: `E2E-LIC-${runId}`,
};
const independentDriver = {
    name: `E2E Independent Driver ${runId}`,
    email: `e2e.independent-driver.${runId}@example.com`,
    license: `E2E-IND-LIC-${runId}`,
};

const targets = await fetch(`${CDP_URL}/json`).then((response) => response.json());
const target = targets.find(
    (item) => item.type === "page" && item.url.startsWith("http")
);
if (!target) throw new Error(`No Chrome page found at ${CDP_URL}`);

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const requests = new Map();
const traffic = [];
const checks = [];
let nextId = 1;

socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
        const call = pending.get(message.id);
        if (!call) return;
        pending.delete(message.id);
        message.error ? call.reject(message.error) : call.resolve(message.result);
        return;
    }
    if (message.method === "Network.requestWillBeSent") {
        requests.set(message.params.requestId, message.params.request);
    }
    if (message.method === "Network.responseReceived") {
        const request = requests.get(message.params.requestId);
        if (request?.url.includes("/api/") && request.method !== "OPTIONS") {
            const url = new URL(request.url);
            traffic.push({
                method: request.method,
                path: url.pathname,
                search: url.searchParams.get("search") || undefined,
                status: message.params.response.status,
            });
        }
    }
};

await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
});

const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, {
            resolve,
            reject: (error) =>
                reject(new Error(`${method}: ${JSON.stringify(error)}`)),
        });
        socket.send(JSON.stringify({ id, method, params }));
    });

const evaluate = async (expression, returnByValue = true) => {
    const result = await send("Runtime.evaluate", {
        expression: returnByValue
            ? `(async () => JSON.stringify(await (${expression})))()`
            : expression,
        awaitPromise: true,
        returnByValue,
    });
    if (result.exceptionDetails) {
        throw new Error(
            result.exceptionDetails.exception?.description ||
                result.exceptionDetails.text
        );
    }
    if (!returnByValue) return result.result;
    return result.result.value === undefined
        ? undefined
        : JSON.parse(result.result.value);
};

const pause = () =>
    new Promise((resolve) => setTimeout(resolve, Math.max(0, STEP_DELAY)));

const waitFor = async (expression, timeout = 20000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
        if (await evaluate(`Boolean(${expression})`)) return;
        await new Promise((resolve) => setTimeout(resolve, 150));
    }
    throw new Error(`Timed out waiting for: ${expression}`);
};

const waitUntil = async (callback, timeout = 30000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
        const value = await callback();
        if (value) return value;
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error("Timed out waiting for saved server state");
};

const check = (name, condition, details = "") => {
    checks.push({ name, passed: Boolean(condition), details });
    if (!condition) throw new Error(`${name}${details ? `: ${details}` : ""}`);
    console.log(`✓ ${name}`);
};

const navigate = async (path, text) => {
    await evaluate(`(() => {
        history.pushState({}, "", ${JSON.stringify(path)});
        dispatchEvent(new PopStateEvent("popstate"));
    })()`);
    await waitFor(
        `location.pathname + location.search === ${JSON.stringify(path)}`
    );
    await waitFor(`document.body.innerText.includes(${JSON.stringify(text)})`);
    await pause();
};

const setValues = async (selector, values) =>
    evaluate(`(() => {
        const elements = [...document.querySelectorAll(${JSON.stringify(selector)})];
        const values = ${JSON.stringify(values)};
        if (elements.length < values.length) {
            throw new Error("Expected " + values.length + " controls, found " + elements.length);
        }
        elements.slice(0, values.length).forEach((element, index) => {
            const prototype = element instanceof HTMLSelectElement
                ? HTMLSelectElement.prototype
                : element instanceof HTMLTextAreaElement
                ? HTMLTextAreaElement.prototype
                : HTMLInputElement.prototype;
            Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, values[index]);
            element.dispatchEvent(new Event(
                element instanceof HTMLSelectElement ? "change" : "input",
                { bubbles: true }
            ));
        });
    })()`);

const setSearchValues = async (values) =>
    evaluate(`(() => {
        const input = document.querySelector('input[type="search"]');
        const setValue = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value"
        ).set;
        ${JSON.stringify(values)}.forEach((value) => {
            setValue.call(input, value);
            input.dispatchEvent(new Event("input", { bubbles: true }));
        });
    })()`);

const clickText = async (text, selector = "button", container = "body") => {
    await evaluate(`(() => {
        const root = document.querySelector(${JSON.stringify(container)});
        const element = [...root.querySelectorAll(${JSON.stringify(selector)})]
            .find((item) => item.textContent.trim() === ${JSON.stringify(text)});
        if (!element) throw new Error(${JSON.stringify(`Missing ${selector}: ${text}`)});
        element.click();
    })()`);
    await pause();
};

const clickRowAction = async (needle, action, acceptConfirm = false) => {
    await waitFor(`[...document.querySelectorAll("tr")].some((row) =>
        row.innerText.includes(${JSON.stringify(needle)}) &&
        [...row.querySelectorAll("button")].some((button) =>
            button.textContent.trim() === ${JSON.stringify(action)}
        )
    )`);
    await evaluate(`(() => {
        if (${JSON.stringify(acceptConfirm)}) window.confirm = () => true;
        const row = [...document.querySelectorAll("tr")]
            .find((item) => item.innerText.includes(${JSON.stringify(needle)}));
        if (!row) throw new Error(${JSON.stringify(`Missing row: ${needle}`)});
        const button = [...row.querySelectorAll("button")]
            .find((item) => item.textContent.trim() === ${JSON.stringify(action)});
        if (!button) throw new Error(${JSON.stringify(`Missing ${action} for ${needle}`)});
        button.click();
    })()`);
    await pause();
};

const setFile = async (selector, file = TEST_IMAGE) => {
    await waitFor(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
    const object = await evaluate(
        `document.querySelector(${JSON.stringify(selector)})`,
        false
    );
    if (!object.objectId) throw new Error(`Missing file input: ${selector}`);
    await send("DOM.setFileInputFiles", {
        files: [file],
        objectId: object.objectId,
    });
    await evaluate(`document.querySelector(${JSON.stringify(selector)})
        .dispatchEvent(new Event("change", { bubbles: true }))`);
    await pause();
};

const readApi = (path, token) =>
    evaluate(`(async () => {
        const response = await fetch(${JSON.stringify(`${API_URL}${path}`)}, {
            headers: ${JSON.stringify(token ? { Authorization: token } : {})}
        });
        return { status: response.status, data: await response.json() };
    })()`);

const findAdminPage = async (path, collection, predicate, token) => {
    let page = 1;
    while (true) {
        const response = await readApi(`${path}?page=${page}&limit=20`, token);
        if (response.data[collection]?.some(predicate)) return page;
        if (page >= (response.data.pagination?.totalPages || 1)) {
            throw new Error(`Missing admin record in ${path}`);
        }
        page += 1;
    }
};

const setTestBookingState = (action, type, bookingId) =>
    JSON.parse(
        execFileSync(
            process.execPath,
            [
                "--env-file=.env",
                "scripts/e2e-state.mjs",
                action,
                type,
                bookingId,
            ],
            { cwd: SERVER_DIR, encoding: "utf8" }
        )
    );

const setTestPasswordResetToken = (userId, resetToken) =>
    JSON.parse(
        execFileSync(
            process.execPath,
            [
                "--env-file=.env",
                "scripts/e2e-state.mjs",
                "password-reset-token",
                "user",
                userId,
                resetToken,
            ],
            { cwd: SERVER_DIR, encoding: "utf8" }
        )
    );

const token = () => evaluate(`localStorage.getItem("token")`);

const logout = async () => {
    await clickText("Logout");
    await waitFor(`location.pathname === "/" && !localStorage.getItem("token")`);
    await waitFor(
        `[...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Login")`
    );
    check(
        "Logout clears browser session",
        await evaluate(
            `[...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Login")`
        )
    );
};

const openAuth = async (signup = false) => {
    if ((await evaluate(`location.pathname`)) !== "/") {
        await navigate("/", HOME_TEXT);
    }
    await clickText("Login");
    await waitFor(`document.querySelector('input[type="email"]')`);
    if (signup) {
        await clickText("Sign up", "span");
        await waitFor(
            `[...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Create Account")`
        );
    }
};

const login = async (email, loginPassword, expectedPath, expectedText) => {
    await navigate("/", HOME_TEXT);
    await openAuth();
    await setValues('form input[type="email"], form input[type="password"]', [
        email,
        loginPassword,
    ]);
    await evaluate(`document.querySelector("form").requestSubmit()`);
    await waitFor(`location.pathname === ${JSON.stringify(expectedPath)}`);
    await waitFor(`document.body.innerText.includes(${JSON.stringify(expectedText)})`);
    await waitFor(`Boolean(localStorage.getItem("token"))`);
    await waitFor(
        `[...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Logout")`
    );
    check(`${expectedText} login through UI`, Boolean(await token()));
    await pause();
};

await send("Runtime.enable");
await send("Network.enable");
await send("Page.enable");
await send("DOM.enable");

try {
    await evaluate(`localStorage.clear()`);
    await send("Page.navigate", { url: APP_URL });
    await waitFor(`document.readyState === "complete"`);
    await waitFor(`document.body.innerText.includes(${JSON.stringify(HOME_TEXT)})`);
    check("Frontend and backend are live", (await readApi("/api/car/listings")).data.success);

    if (process.env.E2E_SEARCH_SMOKE === "1") {
        check(
            "Logged-out navigation hides My Bookings",
            !(await evaluate(
                `[...document.querySelectorAll("nav a")].some((link) => link.textContent.trim() === "My Bookings")`
            ))
        );
        await evaluate(`document.querySelector('input[type="search"]').focus()`);
        await pause();
        const focusStyle = await evaluate(`(() => {
            const input = document.querySelector('input[type="search"]');
            const wrapperStyle = getComputedStyle(input.closest("label"));
            return {
                outline: getComputedStyle(input).outlineStyle,
                boxShadow: wrapperStyle.boxShadow,
                borderColor: wrapperStyle.borderColor,
                focusWithin: input.closest("label").matches(":focus-within"),
            };
        })()`);
        check(
            "Search uses one clean focus ring",
            focusStyle.outline === "none" &&
                focusStyle.boxShadow.includes("rgba(29, 78, 216, 0.1)") &&
                focusStyle.borderColor === "rgb(29, 78, 216)",
            JSON.stringify(focusStyle)
        );

        const searchTrafficStart = traffic.length;
        await setSearchValues(["E2", "E2E", "E2E Toyota"]);
        await waitUntil(
            () =>
                traffic
                    .slice(searchTrafficStart)
                    .some(
                        (request) =>
                            request.path === "/api/car/listings" &&
                            request.search
                    ),
            10000
        );
        await waitFor(`document.body.innerText.includes("E2E Toyota")`);
        const searchRequests = traffic
            .slice(searchTrafficStart)
            .filter(
                (request) =>
                    request.path === "/api/car/listings" &&
                    request.search
            );
        check(
            "Car search is debounced into one server request",
            searchRequests.length === 1 &&
                searchRequests[0].search === "E2E Toyota",
            JSON.stringify(searchRequests)
        );
        console.log(JSON.stringify({ success: true, checks }, null, 2));
        socket.close();
        process.exit(0);
    }

    await openAuth(true);
    await clickText("Business");
    await setValues("form input", [
        owner.name,
        owner.email,
        password,
        owner.business,
        "03001234567",
        "Lahore",
        "1 E2E Test Street",
        "Pakistan",
    ]);
    await evaluate(`document.querySelector("form").requestSubmit()`);
    await waitFor(`location.pathname === "/owner"`);
    await waitFor(`document.body.innerText.includes("Business Dashboard")`);
    const ownerToken = await token();
    check("Business owner registered through UI", Boolean(ownerToken));

    await navigate("/owner/bank-details", "Bank Details");
    await setValues("form input", [
        "E2E Test Bank",
        `E2E-${runId}`,
        owner.name,
    ]);
    await evaluate(`document.querySelector("form").requestSubmit()`);
    await waitUntil(async () => {
        const profile = await readApi("/api/business/profile", ownerToken);
        return profile.data.business?.bank_name === "E2E Test Bank";
    });
    check("Business bank details saved through UI", true);

    await navigate("/owner/add-car", "Add New Car");
    await setFile("#car-images");
    await setFile("#car-docs");
    await setValues('form input:not([type="file"])', [
        car.brand,
        car.model,
        "2025",
        "125",
        "5",
        "Lahore",
    ]);
    await setValues("form select", ["Sedan", "Automatic", "Petrol"]);
    await setValues("form textarea", ["Manual browser E2E car listing"]);
    await evaluate(`document.querySelector("form").requestSubmit()`);
    const createdCar = await waitUntil(async () => {
        const cars = await readApi("/api/car/business-cars", ownerToken);
        const item = cars.data.cars?.find((entry) => entry.model === car.model);
        return item?.attachments.some(
            (attachment) => attachment.category === "car_image"
        ) &&
            item.attachments.some(
                (attachment) => attachment.category === "car_document"
            )
            ? item
            : null;
    }, 60000);
    check(
        "Car image and private document uploaded through UI",
        createdCar.attachments.some((item) => item.category === "car_image") &&
            createdCar.attachments.some((item) => item.category === "car_document")
    );

    await navigate("/owner/business-drivers", "Business Drivers");
    await clickText("+ Add Driver");
    await waitFor(`document.body.innerText.includes("Add Driver")`);
    await setValues(".fixed input:not([type=file])", [
        driver.name,
        "03007654321",
        driver.license,
    ]);
    await setFile(".fixed input[type=file]");
    await clickText("Save", "button", ".fixed");
    const createdDriver = await waitUntil(async () => {
        const drivers = await readApi("/api/business-driver/list", ownerToken);
        const item = drivers.data.drivers?.find(
            (entry) => entry.name === driver.name
        );
        return item?.licenseDocuments?.length ? item : null;
    }, 60000);
    check(
        "Business driver and license uploaded through UI",
        createdDriver.licenseDocuments?.length > 0
    );

    await evaluate(`document.documentElement.dataset.e2eReload = "owner"`);
    await send("Page.reload", { ignoreCache: true });
    await waitFor(`document.documentElement.dataset.e2eReload !== "owner"`);
    await waitFor(`document.readyState === "complete"`);
    await waitFor(`document.body.innerText.includes("Business Drivers")`);
    await waitFor(
        `[...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Logout")`
    );
    check("Business-owner session survives refresh", Boolean(await token()));
    await logout();

    await openAuth(true);
    await clickText("Customer");
    await setValues("form input", [customer.name, customer.email, password]);
    await evaluate(`document.querySelector("form").requestSubmit()`);
    await waitFor(`location.pathname === "/"`);
    await waitFor(`Boolean(localStorage.getItem("token"))`);
    await waitFor(
        `[...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Logout")`
    );
    const customerToken = await token();
    check("Customer registered through UI", Boolean(customerToken));

    await navigate("/account/license", "My Driving License");
    await setFile('form input[type="file"]');
    await evaluate(`document.querySelector("form").requestSubmit()`);
    await waitUntil(async () => {
        const licenses = await readApi("/api/user/license/my-licenses", customerToken);
        return licenses.data.attachments?.length > 0;
    }, 60000);
    check("Customer license uploaded through UI", true);
    const customerData = (await readApi("/api/user/data", customerToken)).data.user;
    await logout();

    await openAuth();
    await clickText("Forgot password?");
    await waitFor(`document.body.innerText.includes("Send Reset Link")`);
    await setValues('form input[type="email"]', [customer.email]);
    await evaluate(`document.querySelector("form").requestSubmit()`);
    await waitFor(`document.body.innerText.includes("If an account exists for that email")`);
    await waitFor(`document.body.innerText.includes("Login")`);
    check("Forgot-password request works through UI without SMTP credentials", true);

    const resetToken = `e2e-reset-${runId}`;
    customerPassword = "Reset@1234";
    setTestPasswordResetToken(customerData._id, resetToken);
    await navigate(`/reset-password/${resetToken}`, "Reset Password");
    await setValues('main form input[type="password"]', [
        customerPassword,
        customerPassword,
    ]);
    await evaluate(`document.querySelector("main form").requestSubmit()`);
    await waitFor(`location.pathname === "/"`);
    await waitFor(`document.body.innerText.includes("Password reset successfully")`);
    check("Password reset works through the real page and API", true);
    await login(customer.email, customerPassword, "/", HOME_TEXT);
    await logout();

    await login(ADMIN_EMAIL, ADMIN_PASSWORD, "/admin", "Admin Dashboard");
    const adminToken = await token();
    check(
        "Admin logout and notification controls are visible",
        await evaluate(`(
            [...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Logout") &&
            Boolean(document.querySelector('button[title="Notifications"]'))
        )`)
    );
    await evaluate(`document.documentElement.dataset.e2eReload = "admin"`);
    await send("Page.reload", { ignoreCache: true });
    await waitFor(`document.documentElement.dataset.e2eReload !== "admin"`);
    await waitFor(`document.readyState === "complete"`);
    await waitFor(`document.body.innerText.includes("Admin Dashboard")`);
    await waitFor(
        `[...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Logout")`
    );
    check("Super-admin session survives refresh", Boolean(await token()));

    await navigate("/admin/verifications/renter-licenses", customer.email);
    await clickRowAction(customer.email, "Verify");
    await waitUntil(async () => {
        const users = await readApi(
            "/api/admin/users?currentRole=customer&limit=50",
            adminToken
        );
        return users.data.users?.find(
            (item) => item._id === customerData._id && item.isVerified
        );
    });
    check("Admin approved customer license through UI", true);

    await navigate("/admin/verifications/business-drivers", driver.name);
    await clickRowAction(driver.name, "Approve");
    await waitUntil(async () => {
        const drivers = await readApi(
            "/api/admin/business-drivers?verification_status=approved&limit=50",
            adminToken
        );
        return drivers.data.drivers?.some(
            (item) => item._id === createdDriver._id
        );
    });
    check("Admin approved business driver through UI", true);

    await navigate("/admin/verifications/cars", car.model);
    await clickRowAction(car.model, "Approve");
    await waitUntil(async () => {
        const cars = await readApi(
            "/api/admin/cars?verification_status=approved&limit=50",
            adminToken
        );
        return cars.data.cars?.some((item) => item._id === createdCar._id);
    });
    check("Admin approved car through UI", true);

    const publicCar = (await readApi(`/api/car/${createdCar._id}`)).data;
    check(
        "Public car detail hides registration documents",
        publicCar.success &&
            publicCar.attachments.length > 0 &&
            publicCar.attachments.every(
                (item) => item.category === "car_image"
            )
    );
    await logout();

    await waitFor(`document.body.innerText.includes(${JSON.stringify(HOME_TEXT)})`);
    const searchTrafficStart = traffic.length;
    await setSearchValues(["E2E", "E2E Toyota", car.model]);
    await waitUntil(
        async () =>
            traffic
                .slice(searchTrafficStart)
                .some(
                    request =>
                        request.path === "/api/car/listings" &&
                        request.search === car.model
                ),
        5000
    );
    await waitFor(
        `document.body.innerText.includes(${JSON.stringify(car.model)})`
    );
    const searchRequests = traffic
        .slice(searchTrafficStart)
        .filter(
            (request) =>
                request.path === "/api/car/listings" &&
                request.search
        );
    check(
        "Car search is debounced into one server request",
        searchRequests.length === 1 &&
            searchRequests[0].search === car.model,
        JSON.stringify(searchRequests)
    );

    await login(customer.email, customerPassword, "/", HOME_TEXT);
    const approvedCustomer = (await readApi("/api/user/data", customerToken)).data.user;
    check(
        "Customer approval status persisted",
        approvedCustomer.isVerified &&
            approvedCustomer.verificationStatus === "approved"
    );

    await navigate(`/car-details/${createdCar._id}`, car.model);
    const pickup = new Date();
    pickup.setUTCDate(pickup.getUTCDate() + 40);
    const returned = new Date(pickup);
    returned.setUTCDate(returned.getUTCDate() + 2);
    const date = (value) => value.toISOString().slice(0, 10);
    const carCollisionStart = new Date(returned);
    carCollisionStart.setUTCDate(carCollisionStart.getUTCDate() + 20);
    const carCollisionEnd = new Date(carCollisionStart);
    carCollisionEnd.setUTCDate(carCollisionEnd.getUTCDate() + 1);
    const carCollisionResults = await evaluate(`Promise.all(
        [1, 2].map(async () => {
            const response = await fetch(${JSON.stringify(
                `${API_URL}/api/bookings/car/create`
            )}, {
                method: "POST",
                headers: {
                    Authorization: localStorage.getItem("token"),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(${JSON.stringify({
                    carId: createdCar._id,
                    withDriver: true,
                    pickupDate: date(carCollisionStart),
                    returnDate: date(carCollisionEnd),
                    pickupTime: "09:00 AM",
                    paymentMethod: "cash",
                    description: "Concurrent car booking guard",
                })})
            });
            return response.json();
        })
    )`);
    check(
        "Concurrent car requests create exactly one booking",
        carCollisionResults.filter((result) => result.success).length === 1
    );

    const expiryStart = new Date(carCollisionEnd);
    expiryStart.setUTCDate(expiryStart.getUTCDate() + 20);
    const expiryEnd = new Date(expiryStart);
    expiryEnd.setUTCDate(expiryEnd.getUTCDate() + 1);
    await clickText("With driver");
    await clickText("Prepaid (bank transfer)");
    await setValues("#pickup-date, #return-date", [
        date(expiryStart),
        date(expiryEnd),
    ]);
    await setValues('input[placeholder="e.g. 09:00 AM"]', ["11:00 AM"]);
    await setValues("form textarea", ["Expiring prepaid reservation"]);
    await clickText("Book Now");
    await waitFor(`document.body.innerText.includes("Complete your payment")`);
    await clickText("I'll upload later", "button", ".fixed");
    await waitFor(`location.pathname === "/my-bookings"`);
    const expiringBooking = await waitUntil(async () => {
        const bookings = await readApi(
            "/api/bookings/car/my-bookings",
            customerToken
        );
        return bookings.data.bookings?.find(
            (item) => item.description === "Expiring prepaid reservation"
        );
    });
    setTestBookingState("expire", "car", expiringBooking._id);

    await navigate(`/car-details/${createdCar._id}`, car.model);
    await clickText("With driver");
    await clickText("Cash on pickup");
    await setValues("#pickup-date, #return-date", [
        date(expiryStart),
        date(expiryEnd),
    ]);
    await setValues('input[placeholder="e.g. 09:00 AM"]', ["11:00 AM"]);
    await setValues("form textarea", ["Replacement after payment expiry"]);
    await clickText("Book Now");
    await waitFor(`location.pathname === "/my-bookings"`);
    await waitUntil(async () => {
        const bookings = await readApi(
            "/api/bookings/car/my-bookings",
            customerToken
        );
        const expired = bookings.data.bookings?.find(
            (item) => item._id === expiringBooking._id
        );
        const replacement = bookings.data.bookings?.find(
            (item) => item.description === "Replacement after payment expiry"
        );
        return expired?.status === "cancelled" && replacement?.status === "pending";
    });
    check("Expired unpaid reservation releases its dates", true);

    await navigate(`/car-details/${createdCar._id}`, car.model);
    await clickText("With driver");
    await clickText("Prepaid (bank transfer)");
    await setValues("#pickup-date, #return-date", [date(pickup), date(returned)]);
    await setValues('input[placeholder="e.g. 09:00 AM"]', ["10:00 AM"]);
    await setValues("form textarea", ["Manual prepaid browser booking"]);
    await clickText("Book Now");
    await waitFor(`document.body.innerText.includes("Complete your payment")`);
    check(
        "Payment deadline rendered from server response",
        await evaluate(
            `document.body.innerText.includes("After that, this reservation expires")`
        )
    );
    await setFile('.fixed input[type="file"]');
    await clickText("Upload", "button", ".fixed");
    await waitFor(`location.pathname === "/my-bookings"`);
    const prepaidBooking = await waitUntil(async () => {
        const bookings = await readApi(
            "/api/bookings/car/my-bookings",
            customerToken
        );
        return bookings.data.bookings?.find(
            (item) => item.description === "Manual prepaid browser booking"
        );
    });
    check(
        "Payment screenshot uploaded through UI",
        prepaidBooking.paymentStatus === "pending_verification" &&
            Boolean(prepaidBooking.payment_proof?.url)
    );
    await logout();

    await login(ADMIN_EMAIL, ADMIN_PASSWORD, "/admin", "Admin Dashboard");
    await navigate(
        "/admin/verifications/booking-payments",
        customer.email
    );
    check(
        "Admin payment screenshot is visible",
        await evaluate(`Boolean(document.querySelector('img[alt="proof"]'))`)
    );
    await clickRowAction(customer.email, "Verify", true);
    await waitUntil(async () => {
        const bookings = await readApi(
            "/api/admin/bookings?bookingType=car&status=pending&limit=50",
            adminToken
        );
        return bookings.data.bookings?.find(
            (item) =>
                item._id === prepaidBooking._id &&
                item.paymentStatus === "paid"
        );
    });
    check("Admin verified booking payment through UI", true);
    await logout();

    await login(owner.email, password, "/owner", "Business Dashboard");
    await navigate("/owner/manage-bookings", customer.email);
    await clickRowAction(customer.email, "Confirm");
    await waitFor(`document.body.innerText.includes("Confirm Booking")`);
    await waitFor(
        `[...document.querySelectorAll(".fixed select option")].some((item) => item.textContent.includes(${JSON.stringify(
            driver.name
        )}))`
    );
    await evaluate(`(() => {
        const select = document.querySelector(".fixed select");
        const option = [...select.options].find((item) => item.textContent.includes(${JSON.stringify(
            driver.name
        )}));
        if (!option) throw new Error("Approved driver missing from confirmation modal");
        Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")
            .set.call(select, option.value);
        select.dispatchEvent(new Event("change", { bubbles: true }));
    })()`);
    await clickText("Confirm", "button", ".fixed");
    await waitUntil(async () => {
        const bookings = await readApi("/api/bookings/owner", ownerToken);
        return bookings.data.bookings?.find(
            (item) =>
                item._id === prepaidBooking._id &&
                item.status === "confirmed" &&
                item.businessDriver?._id === createdDriver._id
        );
    });
    check("Owner assigned approved driver and confirmed through UI", true);

    await waitFor(
        `[...document.querySelectorAll("tr")].some((row) => row.innerText.includes(${JSON.stringify(
            customer.email
        )}) && row.innerText.includes("confirmed"))`
    );
    await clickRowAction(customer.email, "Picked up");
    await waitUntil(async () => {
        const bookings = await readApi("/api/bookings/owner", ownerToken);
        return bookings.data.bookings?.find(
            (item) => item._id === prepaidBooking._id && item.pickedUpAt
        );
    });
    await clickRowAction(customer.email, "Complete");
    await waitUntil(async () => {
        const bookings = await readApi("/api/bookings/owner", ownerToken);
        return bookings.data.bookings?.find(
            (item) =>
                item._id === prepaidBooking._id && item.status === "completed"
        );
    });
    check("Owner completed booking lifecycle through UI", true);
    setTestBookingState("backdate", "car", prepaidBooking._id);

    await evaluate(`[...document.querySelectorAll('button[title="Notifications"]')]
        .find((button) => button.offsetParent !== null).click()`);
    await waitFor(`document.body.innerText.includes("Notifications")`);
    await waitFor(
        `document.querySelectorAll('button[title="Delete"]').length > 0`
    );
    check(
        "Owner notification records render",
        await evaluate(
            `document.querySelectorAll('button[title="Delete"]').length > 0`
        )
    );
    await logout();

    await login(customer.email, customerPassword, "/", HOME_TEXT);
    await navigate("/my-bookings", car.model);
    await clickText("Leave review");
    await waitFor(`document.body.innerText.includes("Leave a review")`);
    await setValues(".fixed textarea", ["Manual browser E2E review"]);
    await evaluate(`document.querySelector('.fixed input[type="checkbox"]')?.click()`);
    await clickText("Submit", "button", ".fixed");
    await waitUntil(async () => {
        const reviews = await readApi(`/api/reviews/car/${createdCar._id}`);
        return reviews.data.reviews?.some(
            (item) => item.comment === "Manual browser E2E review"
        );
    });
    check("Customer submitted completed-booking review through UI", true);
    await waitFor(`document.body.innerText.includes("Review submitted")`);
    const reviewedCarBooking = await waitUntil(async () => {
        const bookings = await readApi(
            "/api/bookings/car/my-bookings",
            customerToken
        );
        return bookings.data.bookings?.find(
            item => item._id === prepaidBooking._id && item.reviewed
        );
    });
    check("Reviewed car booking stays marked after refresh", Boolean(reviewedCarBooking));

    await navigate(`/car-details/${createdCar._id}`, car.model);
    await waitFor(`document.body.innerText.includes("Manual browser E2E review")`);
    check("Car detail displays submitted reviews", true);
    await waitFor(`document.body.innerText.includes("Date availability")`);
    const carAvailability = (
        await readApi(`/api/bookings/car/${createdCar._id}/availability`)
    ).data;
    check(
        "Public car availability returns date ranges without booking details",
        carAvailability.success &&
            carAvailability.inclusive === true &&
            carAvailability.unavailableRanges.some(
                range =>
                    range.startDate === date(pickup) &&
                    range.endDate === date(returned) &&
                    Object.keys(range).length === 2
            )
    );
    await setValues("#pickup-date, #return-date", [
        date(pickup),
        date(returned),
    ]);
    await waitFor(
        `document.body.innerText.includes("overlap an existing booking")`
    );
    check(
        "Car booking form blocks an unavailable date range",
        await evaluate(
            `[...document.querySelectorAll("button")].find((button) => button.textContent.trim() === "Book Now")?.disabled`
        )
    );

    const cashPickup = new Date(returned);
    cashPickup.setUTCDate(cashPickup.getUTCDate() + 5);
    const cashReturn = new Date(cashPickup);
    cashReturn.setUTCDate(cashReturn.getUTCDate() + 1);
    await clickText("Self-drive");
    await clickText("Cash on pickup");
    await setValues("#pickup-date, #return-date", [
        date(cashPickup),
        date(cashReturn),
    ]);
    await waitFor(`document.body.innerText.includes("selected dates are available")`);
    await setValues("form textarea", ["Manual self-drive cancellation"]);
    await clickText("Book Now");
    await waitFor(`location.pathname === "/my-bookings"`);
    const cashBooking = await waitUntil(async () => {
        const bookings = await readApi(
            "/api/bookings/car/my-bookings",
            customerToken
        );
        return bookings.data.bookings?.find(
            (item) => item.description === "Manual self-drive cancellation"
        );
    });
    await waitFor(
        `[...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Cancel")`
    );
    await evaluate(`window.confirm = () => true`);
    await clickText("Cancel");
    await waitUntil(async () => {
        const bookings = await readApi(
            "/api/bookings/car/my-bookings",
            customerToken
        );
        return bookings.data.bookings?.find(
            (item) =>
                item._id === cashBooking._id && item.status === "cancelled"
        );
    });
    check("Verified customer self-drive booking and cancellation through UI", true);

    const rejectionPickup = new Date(cashReturn);
    rejectionPickup.setUTCDate(rejectionPickup.getUTCDate() + 5);
    const rejectionReturn = new Date(rejectionPickup);
    rejectionReturn.setUTCDate(rejectionReturn.getUTCDate() + 1);
    await navigate(`/car-details/${createdCar._id}`, car.model);
    await clickText("Self-drive");
    await clickText("Cash on pickup");
    await setValues("#pickup-date, #return-date", [
        date(rejectionPickup),
        date(rejectionReturn),
    ]);
    await waitFor(`document.body.innerText.includes("selected dates are available")`);
    await setValues("form textarea", ["Customer note preserved after rejection"]);
    await clickText("Book Now");
    await waitFor(`location.pathname === "/my-bookings"`);
    const rejectionBooking = await waitUntil(async () => {
        const bookings = await readApi(
            "/api/bookings/car/my-bookings",
            customerToken
        );
        return bookings.data.bookings?.find(
            item => item.description === "Customer note preserved after rejection"
        );
    });
    await logout();

    await login(owner.email, password, "/owner", "Business Dashboard");
    await navigate("/owner/manage-bookings", "Manage Bookings");
    await clickRowAction(customer.email, "Reject");
    await setValues(".fixed textarea", ["Vehicle unavailable after inspection"]);
    await clickText("Reject", "button", ".fixed");
    await waitUntil(async () => {
        const bookings = await readApi("/api/bookings/owner", ownerToken);
        return bookings.data.bookings?.find(
            item =>
                item._id === rejectionBooking._id &&
                item.status === "rejected" &&
                item.rejectionReason === "Vehicle unavailable after inspection" &&
                item.description === "Customer note preserved after rejection"
        );
    });
    check("Owner rejection preserves notes and stores a dedicated reason", true);
    await logout();

    await login(customer.email, customerPassword, "/", HOME_TEXT);
    await navigate("/my-bookings", car.model);
    await waitFor(
        `document.body.innerText.includes("Vehicle unavailable after inspection")`
    );
    check("Customer booking card displays the rejection reason", true);

    await evaluate(`[...document.querySelectorAll('button[title="Notifications"]')]
        .find((button) => button.offsetParent !== null).click()`);
    await waitFor(`document.body.innerText.includes("Notifications")`);
    await waitFor(
        `document.querySelectorAll('button[title="Delete"]').length > 0`
    );
    check(
        "Customer notification records render",
        await evaluate(
            `document.querySelectorAll('button[title="Delete"]').length > 0`
        )
    );
    await logout();

    await openAuth(true);
    await clickText("Driver");
    await setValues("form input", [
        independentDriver.name,
        independentDriver.email,
        password,
        "03001112222",
        "Lahore",
        independentDriver.license,
        "175",
    ]);
    await setValues("form textarea", [
        "Independent driver created through the visible browser E2E flow",
    ]);
    await evaluate(`document.querySelector("form").requestSubmit()`);
    await waitFor(`location.pathname === "/driver"`);
    await waitFor(`document.body.innerText.includes("Driver Dashboard")`);
    const independentDriverToken = await token();
    check(
        "Independent-driver account registered separately through UI",
        Boolean(independentDriverToken)
    );

    await navigate("/driver/bank-details", "Bank Details");
    await setValues("form input", [
        "E2E Driver Bank",
        `E2E-DRIVER-${runId}`,
        independentDriver.name,
    ]);
    await evaluate(`document.querySelector("form").requestSubmit()`);
    const independentDriverProfile = await waitUntil(async () => {
        const profile = await readApi(
            "/api/driver/profile",
            independentDriverToken
        );
        return profile.data.driver?.bank_name === "E2E Driver Bank"
            ? profile.data.driver
            : null;
    });
    check("Independent-driver bank details saved through UI", true);

    await evaluate(`document.documentElement.dataset.e2eReload = "driver"`);
    await send("Page.reload", { ignoreCache: true });
    await waitFor(`document.documentElement.dataset.e2eReload !== "driver"`);
    await waitFor(`document.readyState === "complete"`);
    await waitFor(`document.body.innerText.includes("Bank Details")`);
    check("Independent-driver session survives refresh", Boolean(await token()));
    await logout();

    await login(ADMIN_EMAIL, ADMIN_PASSWORD, "/admin", "Admin Dashboard");
    await navigate(
        "/admin/verifications/independent-drivers",
        independentDriver.email
    );
    await clickRowAction(independentDriver.email, "Approve");
    await waitUntil(async () => {
        const drivers = await readApi(
            "/api/admin/drivers?verification_status=approved&limit=50",
            adminToken
        );
        return drivers.data.drivers?.some(
            (item) => item._id === independentDriverProfile._id
        );
    });
    check("Admin approved independent-driver account through UI", true);
    const publicDrivers = await readApi("/api/driver/listings?limit=100");
    check(
        "Approved independent driver appears in public listings",
        publicDrivers.data.drivers?.some(
            (item) => item._id === independentDriverProfile._id
        )
    );
    await logout();

    await login(customer.email, customerPassword, "/", HOME_TEXT);
    await navigate(
        `/driver-details/${independentDriverProfile._id}`,
        independentDriver.name
    );
    const driverStart = new Date();
    driverStart.setUTCDate(driverStart.getUTCDate() + 55);
    const driverEnd = new Date(driverStart);
    driverEnd.setUTCDate(driverEnd.getUTCDate() + 2);
    const driverCollisionStart = new Date(driverEnd);
    driverCollisionStart.setUTCDate(driverCollisionStart.getUTCDate() + 10);
    const driverCollisionEnd = new Date(driverCollisionStart);
    driverCollisionEnd.setUTCDate(driverCollisionEnd.getUTCDate() + 1);
    const driverCollisionResults = await evaluate(`Promise.all(
        [1, 2].map(async () => {
            const response = await fetch(${JSON.stringify(
                `${API_URL}/api/bookings/driver/create`
            )}, {
                method: "POST",
                headers: {
                    Authorization: localStorage.getItem("token"),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(${JSON.stringify({
                    driverId: independentDriverProfile._id,
                    startDate: date(driverCollisionStart),
                    endDate: date(driverCollisionEnd),
                    paymentMethod: "cash",
                    description: "Concurrent independent-driver booking guard",
                })})
            });
            return response.json();
        })
    )`);
    check(
        "Concurrent independent-driver requests create exactly one booking",
        driverCollisionResults.filter((result) => result.success).length === 1
    );
    await clickText("Prepaid");
    await setValues('input[type="date"]', [
        date(driverStart),
        date(driverEnd),
    ]);
    await setValues("form textarea", [
        "Manual prepaid independent-driver booking",
    ]);
    await clickText("Hire Driver");
    await waitFor(`document.body.innerText.includes("Complete your payment")`);
    check(
        "Independent-driver payment deadline rendered",
        await evaluate(
            `document.body.innerText.includes("After that, this reservation expires")`
        )
    );
    await setFile('.fixed input[type="file"]');
    await clickText("Upload", "button", ".fixed");
    await waitFor(`location.pathname === "/my-bookings"`);
    await waitFor(
        `[...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Driver Bookings")`
    );
    await clickText("Driver Bookings");
    await waitFor(
        `document.body.innerText.includes(${JSON.stringify(independentDriver.name)})`
    );
    const independentDriverBooking = await waitUntil(async () => {
        const bookings = await readApi(
            "/api/bookings/driver/my-bookings",
            customerToken
        );
        return bookings.data.bookings?.find(
            (item) =>
                item.description ===
                "Manual prepaid independent-driver booking"
        );
    });
    check(
        "Independent-driver payment screenshot uploaded through UI",
        independentDriverBooking.paymentStatus === "pending_verification" &&
            Boolean(independentDriverBooking.payment_proof?.url)
    );
    await logout();

    await login(ADMIN_EMAIL, ADMIN_PASSWORD, "/admin", "Admin Dashboard");
    await navigate("/admin/verifications/booking-payments", "Booking Payments");
    await clickText("driver bookings");
    await waitFor(
        `document.body.innerText.includes(${JSON.stringify(customer.email)})`
    );
    check(
        "Admin can see independent-driver payment proof",
        await evaluate(`Boolean(document.querySelector('img[alt="proof"]'))`)
    );
    await clickRowAction(customer.email, "Verify", true);
    await waitUntil(async () => {
        const bookings = await readApi(
            "/api/admin/bookings?bookingType=driver&status=pending&limit=50",
            adminToken
        );
        return bookings.data.bookings?.find(
            (item) =>
                item._id === independentDriverBooking._id &&
                item.paymentStatus === "paid"
        );
    });
    check("Admin verified independent-driver payment through UI", true);
    await logout();

    await login(
        independentDriver.email,
        password,
        "/driver",
        "Driver Dashboard"
    );
    await navigate("/driver/bookings", customer.email);
    await clickRowAction(customer.email, "Confirm");
    await waitUntil(async () => {
        const bookings = await readApi(
            "/api/bookings/driver-manage",
            independentDriverToken
        );
        return bookings.data.bookings?.find(
            (item) =>
                item._id === independentDriverBooking._id &&
                item.status === "confirmed"
        );
    });
    await waitFor(
        `[...document.querySelectorAll("tr")].some((row) =>
            row.innerText.includes(${JSON.stringify(customer.email)}) &&
            [...row.querySelectorAll("button")].some((button) =>
                button.textContent.trim() === "Complete"
            )
        )`
    );
    await clickRowAction(customer.email, "Complete");
    await waitUntil(async () => {
        const bookings = await readApi(
            "/api/bookings/driver-manage",
            independentDriverToken
        );
        return bookings.data.bookings?.find(
            (item) =>
                item._id === independentDriverBooking._id &&
                item.status === "completed"
        );
    });
    check("Independent driver completed hire lifecycle through UI", true);

    await navigate("/driver", "Driver Dashboard");
    const driverDashboard = await waitUntil(async () => {
        const dashboard = await readApi(
            "/api/driver/dashboard",
            independentDriverToken
        );
        return dashboard.data.dashboard?.bookings?.completed > 0
            ? dashboard.data.dashboard
            : null;
    });
    check(
        "Independent-driver dashboard recognizes completed revenue",
        driverDashboard.revenue.total === independentDriverBooking.price
    );
    setTestBookingState(
        "backdate",
        "driver",
        independentDriverBooking._id
    );
    await evaluate(`[...document.querySelectorAll('button[title="Notifications"]')]
        .find((button) => button.offsetParent !== null).click()`);
    await waitFor(`document.body.innerText.includes("Notifications")`);
    await waitFor(`document.querySelectorAll('button[title="Delete"]').length > 0`);
    check("Independent-driver notifications render", true);
    await logout();

    await login(customer.email, customerPassword, "/", HOME_TEXT);
    await navigate(
        "/my-bookings",
        "View and manage all your car and driver bookings"
    );
    await waitFor(
        `[...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Driver Bookings")`
    );
    await clickText("Driver Bookings");
    await waitFor(
        `document.body.innerText.includes(${JSON.stringify(independentDriver.name)})`
    );
    await clickText("Leave review");
    await waitFor(`document.body.innerText.includes("Leave a review")`);
    await setValues(".fixed textarea", [
        "Manual browser independent-driver review",
    ]);
    await clickText("Submit", "button", ".fixed");
    await waitUntil(async () => {
        const reviews = await readApi(
            `/api/reviews/driver/${independentDriverProfile._id}`
        );
        return reviews.data.reviews?.some(
            (item) =>
                item.comment === "Manual browser independent-driver review"
        );
    });
    check("Customer reviewed independent driver through UI", true);
    await waitFor(`document.body.innerText.includes("Review submitted")`);
    const reviewedDriverBooking = await waitUntil(async () => {
        const bookings = await readApi(
            "/api/bookings/driver/my-bookings",
            customerToken
        );
        return bookings.data.bookings?.find(
            item => item._id === independentDriverBooking._id && item.reviewed
        );
    });
    check(
        "Reviewed driver booking stays marked after refresh",
        Boolean(reviewedDriverBooking)
    );
    await navigate(
        `/driver-details/${independentDriverProfile._id}`,
        independentDriver.name
    );
    await waitFor(
        `document.body.innerText.includes("Manual browser independent-driver review")`
    );
    check("Driver detail displays submitted reviews", true);
    await waitFor(`document.body.innerText.includes("Date availability")`);
    const driverAvailability = (
        await readApi(
            `/api/bookings/driver/${independentDriverProfile._id}/availability`
        )
    ).data;
    check(
        "Public driver availability returns date ranges without booking details",
        driverAvailability.success &&
            driverAvailability.inclusive === true &&
            driverAvailability.unavailableRanges.some(
                range =>
                    range.startDate === date(driverStart) &&
                    range.endDate === date(driverEnd) &&
                    Object.keys(range).length === 2
            )
    );
    await logout();

    await login(ADMIN_EMAIL, ADMIN_PASSWORD, "/admin", "Admin Dashboard");
    for (const [path, title] of [
        ["/admin/businesses", "Businesses"],
        ["/admin/cars", "Cars"],
        ["/admin/users?currentRole=customer", "Users"],
        ["/admin/bookings", "Bookings"],
        ["/admin/fees", "Platform Fees"],
        ["/admin/settings", "Platform Settings"],
    ]) {
        await navigate(path, title);
        check(`${title} admin screen loads`, true);
    }
    await navigate("/admin/users?currentRole=customer", "Users");
    check(
        "Canonical currentRole filter selected in UI",
        await evaluate(`document.querySelector("select")?.value === "customer"`)
    );

    await navigate("/admin/fees", "Platform Fees");
    await evaluate(`window.confirm = () => true`);
    await clickText("Generate fees");
    await waitFor(
        `[...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Generate fees")`,
        120000
    );
    const generationResults = await evaluate(`Promise.all(
        [1, 2].map(async () => {
            const response = await fetch(${JSON.stringify(
                `${API_URL}/api/admin/fees/generate`
            )}, {
                method: "POST",
                headers: { Authorization: localStorage.getItem("token") }
            });
            return response.json();
        })
    )`);
    check(
        "Concurrent fee generation requests both complete",
        generationResults.every((result) => result.success)
    );
    const feesResponse = await readApi("/api/admin/fees?limit=50", adminToken);
    const feeKeys = (feesResponse.data.fees || []).map((fee) => {
        const entity =
            fee.business?._id ||
            fee.business ||
            fee.independentDriver?._id ||
            fee.independentDriver;
        return `${fee.entity_type}:${entity}:${fee.period}`;
    });
    check(
        "Concurrent fee generation creates no duplicate entity-period records",
        feeKeys.length === new Set(feeKeys).size
    );
    const businessFee = (feesResponse.data.fees || []).find(
        (fee) =>
            (fee.business?._id || fee.business) ===
            (createdCar.business?._id || createdCar.business)
    );
    const driverFee = (feesResponse.data.fees || []).find(
        (fee) =>
            (fee.independentDriver?._id || fee.independentDriver) ===
            independentDriverProfile._id
    );
    check(
        "Closed-period business and driver fees generated",
        Boolean(businessFee && driverFee)
    );
    check(
        "Generated fee deadlines belong to closed historical periods",
        [businessFee, driverFee].every(
            (fee) => new Date(fee.dueAt).getTime() < Date.now()
        )
    );
    await logout();

    await login(owner.email, password, "/owner", "Business Dashboard");
    await navigate("/owner/fees", businessFee.period);
    await clickRowAction(businessFee.period, "Upload proof");
    await setFile('.fixed input[type="file"]');
    await clickText("Upload", "button", ".fixed");
    await waitUntil(async () => {
        const fees = await readApi("/api/business/fees", ownerToken);
        return fees.data.fees?.find(
            (fee) =>
                fee._id === businessFee._id &&
                fee.payment_status === "pending_verification" &&
                fee.proof_attachment?.url
        );
    }, 60000);
    check("Business uploaded platform-fee proof through UI", true);
    await logout();

    await login(
        independentDriver.email,
        password,
        "/driver",
        "Driver Dashboard"
    );
    await navigate("/driver/fees", driverFee.period);
    await clickRowAction(driverFee.period, "Upload proof");
    await setFile('.fixed input[type="file"]');
    await clickText("Upload", "button", ".fixed");
    await waitUntil(async () => {
        const fees = await readApi("/api/driver/fees", independentDriverToken);
        return fees.data.fees?.find(
            (fee) =>
                fee._id === driverFee._id &&
                fee.payment_status === "pending_verification" &&
                fee.proof_attachment?.url
        );
    }, 60000);
    check("Independent driver uploaded platform-fee proof through UI", true);
    await logout();

    await login(ADMIN_EMAIL, ADMIN_PASSWORD, "/admin", "Admin Dashboard");
    await navigate("/admin/fees", owner.business);
    check(
        "Admin platform-fee proofs are visible",
        await evaluate(
            `[...document.querySelectorAll("button")].filter((button) => button.textContent.trim() === "View proof").length >= 2`
        )
    );
    await clickRowAction(owner.business, "Verify", true);
    await waitUntil(async () => {
        const fees = await readApi("/api/admin/fees?limit=50", adminToken);
        return fees.data.fees?.find(
            (fee) =>
                fee._id === businessFee._id &&
                fee.payment_status === "paid"
        );
    });
    await waitFor(
        `[...document.querySelectorAll("tr")].some((row) =>
            row.innerText.includes(${JSON.stringify(independentDriver.name)}) &&
            [...row.querySelectorAll("button")].some((button) =>
                button.textContent.trim() === "Verify"
            )
        )`
    );
    await clickRowAction(independentDriver.name, "Verify", true);
    await waitUntil(async () => {
        const fees = await readApi("/api/admin/fees?limit=50", adminToken);
        return fees.data.fees?.find(
            (fee) =>
                fee._id === driverFee._id &&
                fee.payment_status === "paid"
        );
    });
    check("Admin verified business and driver platform fees through UI", true);

    const businessPage = await findAdminPage(
        "/api/admin/businesses",
        "businesses",
        (item) => item.name === owner.business,
        adminToken
    );
    await navigate(`/admin/businesses?page=${businessPage}`, owner.business);
    await clickRowAction(owner.business, "Block");
    await setValues(".fixed textarea", ["E2E business block check"]);
    await clickText("Block", "button", ".fixed");
    await waitUntil(async () => {
        const businesses = await readApi("/api/admin/businesses?limit=50", adminToken);
        return businesses.data.businesses?.find(
            (item) => item.name === owner.business && item.status === "blocked"
        );
    });
    const blockedCarAvailability = (
        await readApi(`/api/bookings/car/${createdCar._id}/availability`)
    ).data;
    check(
        "Blocked business car availability is private",
        blockedCarAvailability.success === false
    );
    await waitFor(
        `[...document.querySelectorAll("tr")].some((row) =>
            row.innerText.includes(${JSON.stringify(owner.business)}) &&
            [...row.querySelectorAll("button")].some((button) =>
                button.textContent.trim() === "Unblock"
            )
        )`
    );
    await clickRowAction(owner.business, "Unblock");
    await waitUntil(async () => {
        const businesses = await readApi("/api/admin/businesses?limit=50", adminToken);
        return businesses.data.businesses?.find(
            (item) => item.name === owner.business && item.status === "active"
        );
    });
    check("Admin blocked and unblocked a business through UI", true);

    const driverPage = await findAdminPage(
        "/api/admin/drivers",
        "drivers",
        (item) => item._id === independentDriverProfile._id,
        adminToken
    );
    await navigate(`/admin/drivers?page=${driverPage}`, independentDriver.name);
    await clickRowAction(independentDriver.name, "Block");
    await setValues(".fixed textarea", ["E2E driver block check"]);
    await clickText("Block", "button", ".fixed");
    await waitUntil(async () => {
        const drivers = await readApi("/api/admin/drivers?limit=50", adminToken);
        return drivers.data.drivers?.find(
            (item) =>
                item._id === independentDriverProfile._id &&
                item.status === "inactive"
        );
    });
    await waitFor(
        `[...document.querySelectorAll("tr")].some((row) =>
            row.innerText.includes(${JSON.stringify(independentDriver.name)}) &&
            [...row.querySelectorAll("button")].some((button) =>
                button.textContent.trim() === "Unblock"
            )
        )`
    );
    await clickRowAction(independentDriver.name, "Unblock");
    await waitUntil(async () => {
        const drivers = await readApi("/api/admin/drivers?limit=50", adminToken);
        return drivers.data.drivers?.find(
            (item) =>
                item._id === independentDriverProfile._id &&
                item.status === "active"
        );
    });
    check("Admin blocked and unblocked an independent driver through UI", true);

    const carPage = await findAdminPage(
        "/api/admin/cars",
        "cars",
        (item) => item._id === createdCar._id,
        adminToken
    );
    await navigate(`/admin/cars?page=${carPage}`, car.model);
    await clickRowAction(car.model, "Reject");
    await setValues(".fixed textarea", ["E2E car rejection check"]);
    await clickText("Reject", "button", ".fixed");
    await waitUntil(async () => {
        const cars = await readApi("/api/admin/cars?limit=50", adminToken);
        return cars.data.cars?.find(
            (item) =>
                item._id === createdCar._id &&
                item.verification_status === "rejected"
        );
    });
    check("Admin rejected a car through UI", true);

    await send("Emulation.setDeviceMetricsOverride", {
        width: 390,
        height: 844,
        deviceScaleFactor: 1,
        mobile: true,
    });
    await navigate("/admin", "Admin Dashboard");
    check(
        "Admin dashboard renders without horizontal page overflow on mobile",
        await evaluate(`document.documentElement.scrollWidth <= innerWidth + 1`)
    );
    await send("Emulation.clearDeviceMetricsOverride");
    await logout();

    check(
        "All browser API requests returned below 400",
        traffic.every((request) => request.status < 400),
        JSON.stringify(traffic.filter((request) => request.status >= 400))
    );

    console.log(
        JSON.stringify(
            {
                success: true,
                runId,
                created: {
                    customer: customer.email,
                    owner: owner.email,
                    car: createdCar._id,
                    businessDriver: createdDriver._id,
                    booking: prepaidBooking._id,
                    independentDriver: independentDriverProfile._id,
                    independentDriverBooking: independentDriverBooking._id,
                },
                checks,
                traffic,
            },
            null,
            2
        )
    );
} catch (error) {
    console.error(
        JSON.stringify(
            {
                success: false,
                runId,
                error: error.message,
                checks,
                failedTraffic: traffic.filter((request) => request.status >= 400),
            },
            null,
            2
        )
    );
    process.exitCode = 1;
} finally {
    socket.close();
}
