const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "globetrotter-secret-key";

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// =====================================================
// DATABASE - JSON FILE
// =====================================================

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultDB = {
    users: [],
    trips: [],
    itinerary_items: [],
    saved_places: [],
    shared_itineraries: [],
    cities: [],
    activities: [],

    counters: {
        users: 1,
        trips: 1,
        itinerary_items: 1,
        saved_places: 1,
        shared_itineraries: 1,
        cities: 1,
        activities: 1
    }
};

function loadDB() {

    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(
            DB_FILE,
            JSON.stringify(defaultDB, null, 2)
        );

        return JSON.parse(JSON.stringify(defaultDB));
    }

    try {

        const data = JSON.parse(
            fs.readFileSync(DB_FILE, "utf8")
        );

        return {
            ...defaultDB,
            ...data,

            counters: {
                ...defaultDB.counters,
                ...(data.counters || {})
            }
        };

    } catch (error) {

        console.log("Database reset.");

        fs.writeFileSync(
            DB_FILE,
            JSON.stringify(defaultDB, null, 2)
        );

        return JSON.parse(JSON.stringify(defaultDB));
    }
}

let db = loadDB();

function saveDB() {

    fs.writeFileSync(
        DB_FILE,
        JSON.stringify(db, null, 2)
    );
}

function nextId(type) {

    const id = db.counters[type];

    db.counters[type]++;

    saveDB();

    return id;
}

function now() {
    return new Date().toISOString();
}

// =====================================================
// USER HELPERS
// =====================================================

function publicUser(user) {

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        bio: user.bio || "",
        created_at: user.created_at
    };
}

function createToken(user) {

    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },

        JWT_SECRET,

        {
            expiresIn: "7d"
        }
    );
}

// =====================================================
// AUTH MIDDLEWARE
// =====================================================

function auth(req, res, next) {

    const header =
        req.headers.authorization || "";

    const token =
        header.startsWith("Bearer ")
            ? header.substring(7)
            : "";

    if (!token) {

        return res.status(401).json({
            message: "Authentication required"
        });
    }

    try {

        req.user = jwt.verify(
            token,
            JWT_SECRET
        );

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

function adminOnly(req, res, next) {

    if (req.user.role !== "admin") {

        return res.status(403).json({
            message: "Admin access required"
        });
    }

    next();
}

// =====================================================
// ADMIN ACCOUNT
// =====================================================

const ADMIN_EMAIL =
    process.env.ADMIN_EMAIL ||
    "admin@globetrotter.local";

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD ||
    "Admin@12345";

if (!db.users.some(
    user => user.email === ADMIN_EMAIL
)) {

    const admin = {

        id: nextId("users"),

        name: "GlobeTrotter Admin",

        email: ADMIN_EMAIL,

        password_hash:
            bcrypt.hashSync(
                ADMIN_PASSWORD,
                10
            ),

        role: "admin",

        avatar: "",

        bio: "Hackathon administrator",

        created_at: now()
    };

    db.users.push(admin);

    saveDB();
}

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {

    res.json({

        success: true,

        message:
            "GlobeTrotter backend is running",

        node: process.version,

        database: "JSON",

        time: now()
    });
});

// =====================================================
// REGISTER
// =====================================================

app.post("/api/auth/register", (req, res) => {

    const {
        name,
        email,
        password
    } = req.body;

    if (!name || !email || !password) {

        return res.status(400).json({
            message:
                "Name, email and password are required"
        });
    }

    if (String(password).length < 6) {

        return res.status(400).json({
            message:
                "Password must contain at least 6 characters"
        });
    }

    const normalizedEmail =
        String(email)
            .trim()
            .toLowerCase();

    const exists =
        db.users.some(
            user =>
                user.email === normalizedEmail
        );

    if (exists) {

        return res.status(409).json({
            message:
                "Email already registered"
        });
    }

    const user = {

        id: nextId("users"),

        name: String(name).trim(),

        email: normalizedEmail,

        password_hash:
            bcrypt.hashSync(
                String(password),
                10
            ),

        role: "user",

        avatar: "",

        bio: "",

        created_at: now()
    };

    db.users.push(user);

    saveDB();

    res.status(201).json({

        success: true,

        message: "Account created",

        token: createToken(user),

        user: publicUser(user)
    });
});

// =====================================================
// LOGIN
// =====================================================

app.post("/api/auth/login", (req, res) => {

    const email =
        String(req.body.email || "")
            .trim()
            .toLowerCase();

    const password =
        String(req.body.password || "");

    const user =
        db.users.find(
            u => u.email === email
        );

    if (
        !user ||
        !bcrypt.compareSync(
            password,
            user.password_hash
        )
    ) {

        return res.status(401).json({
            message:
                "Invalid email or password"
        });
    }

    res.json({

        success: true,

        message: "Login successful",

        token: createToken(user),

        user: publicUser(user)
    });
});

// =====================================================
// CURRENT USER
// =====================================================

app.get("/api/auth/me", auth, (req, res) => {

    const user =
        db.users.find(
            u => u.id === req.user.id
        );

    if (!user) {

        return res.status(404).json({
            message: "User not found"
        });
    }

    res.json({
        user: publicUser(user)
    });
});

// =====================================================
// DASHBOARD
// =====================================================

app.get("/api/dashboard", auth, (req, res) => {

    const trips =
        db.trips.filter(
            trip =>
                trip.user_id === req.user.id
        );

    const upcomingTrips =
        trips.filter(
            trip =>
                trip.start_date &&
                new Date(trip.start_date) >=
                new Date()
        ).length;

    const budget =
        trips.reduce(
            (sum, trip) =>
                sum + Number(trip.budget || 0),
            0
        );

    const tripIds =
        new Set(
            trips.map(
                trip => trip.id
            )
        );

    const cities =
        new Set(
            db.itinerary_items
                .filter(
                    item =>
                        tripIds.has(
                            item.trip_id
                        ) &&
                        item.location
                )
                .map(
                    item => item.location
                )
        );

    res.json({

        stats: {

            totalTrips:
                trips.length,

            upcomingTrips,

            plannedBudget:
                budget,

            citiesExplored:
                cities.size
        },

        trips:
            trips
                .sort(
                    (a, b) =>
                        String(a.start_date || "")
                            .localeCompare(
                                String(
                                    b.start_date || ""
                                )
                            )
                )
                .slice(0, 5)
    });
});

// =====================================================
// TRIPS - GET ALL
// =====================================================

app.get("/api/trips", auth, (req, res) => {

    const trips =
        db.trips
            .filter(
                trip =>
                    trip.user_id === req.user.id
            )
            .sort(
                (a, b) =>
                    String(a.start_date || "")
                        .localeCompare(
                            String(
                                b.start_date || ""
                            )
                        )
            );

    res.json({
        trips
    });
});

// =====================================================
// GET SINGLE TRIP
// =====================================================

app.get("/api/trips/:id", auth, (req, res) => {

    const trip =
        db.trips.find(
            t =>
                Number(t.id) ===
                Number(req.params.id) &&

                t.user_id ===
                req.user.id
        );

    if (!trip) {

        return res.status(404).json({
            message: "Trip not found"
        });
    }

    const items =
        db.itinerary_items.filter(
            item =>
                item.trip_id === trip.id
        );

    res.json({

        trip,

        items
    });
});

// =====================================================
// CREATE TRIP
// =====================================================

app.post("/api/trips", auth, (req, res) => {

    if (!req.body.title) {

        return res.status(400).json({
            message:
                "Trip title is required"
        });
    }

    const trip = {

        id: nextId("trips"),

        user_id: req.user.id,

        title: req.body.title,

        description:
            req.body.description || "",

        start_date:
            req.body.start_date || null,

        end_date:
            req.body.end_date || null,

        budget:
            Number(req.body.budget || 0),

        currency:
            req.body.currency || "INR",

        status:
            req.body.status || "planned",

        cover_emoji:
            req.body.cover_emoji || "🌍",

        created_at: now(),

        updated_at: now()
    };

    db.trips.push(trip);

    saveDB();

    res.status(201).json({

        success: true,

        message: "Trip created",

        trip
    });
});

// =====================================================
// UPDATE TRIP
// =====================================================

app.put("/api/trips/:id", auth, (req, res) => {

    const trip =
        db.trips.find(
            t =>
                Number(t.id) ===
                Number(req.params.id) &&

                t.user_id ===
                req.user.id
        );

    if (!trip) {

        return res.status(404).json({
            message: "Trip not found"
        });
    }

    const fields = [

        "title",

        "description",

        "start_date",

        "end_date",

        "currency",

        "status",

        "cover_emoji"
    ];

    fields.forEach(field => {

        if (
            req.body[field] !== undefined
        ) {

            trip[field] =
                req.body[field];
        }
    });

    if (
        req.body.budget !== undefined
    ) {

        trip.budget =
            Number(req.body.budget);
    }

    trip.updated_at = now();

    saveDB();

    res.json({

        success: true,

        message: "Trip updated",

        trip
    });
});

// =====================================================
// DELETE TRIP
// =====================================================

app.delete("/api/trips/:id", auth, (req, res) => {

    const trip =
        db.trips.find(
            t =>
                Number(t.id) ===
                Number(req.params.id) &&

                t.user_id ===
                req.user.id
        );

    if (!trip) {

        return res.status(404).json({
            message: "Trip not found"
        });
    }

    db.trips =
        db.trips.filter(
            t => t.id !== trip.id
        );

    db.itinerary_items =
        db.itinerary_items.filter(
            item =>
                item.trip_id !== trip.id
        );

    db.shared_itineraries =
        db.shared_itineraries.filter(
            share =>
                share.trip_id !== trip.id
        );

    saveDB();

    res.json({
        success: true,
        message: "Trip deleted"
    });
});

// =====================================================
// GET ITINERARY
// =====================================================

app.get(
    "/api/trips/:id/itinerary",
    auth,
    (req, res) => {

        const trip =
            db.trips.find(
                t =>
                    Number(t.id) ===
                    Number(req.params.id) &&

                    t.user_id ===
                    req.user.id
            );

        if (!trip) {

            return res.status(404).json({
                message: "Trip not found"
            });
        }

        const items =
            db.itinerary_items.filter(
                item =>
                    item.trip_id ===
                    trip.id
            );

        res.json({

            trip,

            items
        });
    }
);

// =====================================================
// ADD ITINERARY ITEM
// =====================================================

app.post(
    "/api/trips/:id/itinerary",
    auth,
    (req, res) => {

        const trip =
            db.trips.find(
                t =>
                    Number(t.id) ===
                    Number(req.params.id) &&

                    t.user_id ===
                    req.user.id
            );

        if (!trip) {

            return res.status(404).json({
                message: "Trip not found"
            });
        }

        if (!req.body.title) {

            return res.status(400).json({
                message:
                    "Itinerary title is required"
            });
        }

        const item = {

            id:
                nextId(
                    "itinerary_items"
                ),

            trip_id:
                trip.id,

            day_number:
                Number(
                    req.body.day_number || 1
                ),

            item_date:
                req.body.item_date || null,

            time:
                req.body.time || "",

            title:
                req.body.title,

            type:
                req.body.type ||
                "activity",

            location:
                req.body.location || "",

            notes:
                req.body.notes || "",

            cost:
                Number(
                    req.body.cost || 0
                ),

            created_at: now()
        };

        db.itinerary_items.push(item);

        saveDB();

        res.status(201).json({

            success: true,

            message:
                "Itinerary item added",

            item
        });
    }
);

// =====================================================
// UPDATE ITINERARY ITEM
// =====================================================

app.put(
    "/api/itinerary/:id",
    auth,
    (req, res) => {

        const item =
            db.itinerary_items.find(
                i =>
                    i.id ===
                    Number(req.params.id)
            );

        if (!item) {

            return res.status(404).json({
                message:
                    "Itinerary item not found"
            });
        }

        const trip =
            db.trips.find(
                t =>
                    t.id ===
                    item.trip_id &&
                    t.user_id ===
                    req.user.id
            );

        if (!trip) {

            return res.status(403).json({
                message: "Access denied"
            });
        }

        const fields = [

            "day_number",

            "item_date",

            "time",

            "title",

            "type",

            "location",

            "notes",

            "cost"
        ];

        fields.forEach(field => {

            if (
                req.body[field] !== undefined
            ) {

                if (
                    field === "cost" ||
                    field === "day_number"
                ) {

                    item[field] =
                        Number(
                            req.body[field]
                        );

                } else {

                    item[field] =
                        req.body[field];
                }
            }
        });

        saveDB();

        res.json({

            success: true,

            message:
                "Itinerary item updated",

            item
        });
    }
);

// =====================================================
// DELETE ITINERARY ITEM
// =====================================================

app.delete(
    "/api/itinerary/:id",
    auth,
    (req, res) => {

        const index =
            db.itinerary_items.findIndex(
                item =>
                    item.id ===
                    Number(req.params.id)
            );

        if (index === -1) {

            return res.status(404).json({
                message:
                    "Itinerary item not found"
            });
        }

        const item =
            db.itinerary_items[index];

        const trip =
            db.trips.find(
                t =>
                    t.id ===
                    item.trip_id &&
                    t.user_id ===
                    req.user.id
            );

        if (!trip) {

            return res.status(403).json({
                message: "Access denied"
            });
        }

        db.itinerary_items.splice(
            index,
            1
        );

        saveDB();

        res.json({

            success: true,

            message:
                "Itinerary item deleted"
        });
    }
);

// =====================================================
// CITIES
// =====================================================

app.get("/api/cities", (req, res) => {

    const query =
        String(
            req.query.query || ""
        ).toLowerCase();

    const category =
        String(
            req.query.category || ""
        ).toLowerCase();

    let result = db.cities;

    if (query) {

        result =
            result.filter(city =>

                `${city.name}
                 ${city.country}
                 ${city.category}`
                    .toLowerCase()
                    .includes(query)
            );
    }

    if (category) {

        result =
            result.filter(
                city =>
                    city.category
                        .toLowerCase() ===
                    category
            );
    }

    res.json({
        cities: result
    });
});

app.post("/api/cities", auth, (req, res) => {

    if (!req.body.name) {

        return res.status(400).json({
            message: "City name is required"
        });
    }

    const city = {

        id: nextId("cities"),

        name: String(req.body.name).trim(),

        country: req.body.country || "",

        category: req.body.category || "Other",

        rating: Number(req.body.rating || 0),

        emoji: req.body.emoji || "📍",

        created_by: req.user.id,

        created_at: now()
    };

    db.cities.push(city);

    saveDB();

    res.status(201).json({

        success: true,

        message: "City added",

        city
    });
});

// =====================================================
// ACTIVITIES
// =====================================================

app.get(
    "/api/activities",
    (req, res) => {

        const query =
            String(
                req.query.query || ""
            ).toLowerCase();

        const city =
            String(
                req.query.city || ""
            ).toLowerCase();

        const category =
            String(
                req.query.category || ""
            ).toLowerCase();

        let result = db.activities;

        if (query) {

            result =
                result.filter(activity =>

                    `${activity.name}
                     ${activity.city}
                     ${activity.category}`
                        .toLowerCase()
                        .includes(query)
                );
        }

        if (city) {

            result =
                result.filter(
                    activity =>
                        activity.city
                            .toLowerCase() ===
                        city
                );
        }

        if (category) {

            result =
                result.filter(
                    activity =>
                        activity.category
                            .toLowerCase() ===
                        category
                );
        }

        res.json({
            activities: result
        });
    }
);

app.post(
    "/api/activities",
    auth,
    (req, res) => {

        if (!req.body.name) {

            return res.status(400).json({
                message: "Activity name is required"
            });
        }

        const activity = {

            id: nextId("activities"),

            name: String(req.body.name).trim(),

            city: req.body.city || "",

            category: req.body.category || "Other",

            cost: Number(req.body.cost || 0),

            emoji: req.body.emoji || "📌",

            created_by: req.user.id,

            created_at: now()
        };

        db.activities.push(activity);

        saveDB();

        res.status(201).json({

            success: true,

            message: "Activity added",

            activity
        });
    }
);

// =====================================================
// PROFILE
// =====================================================

app.get(
    "/api/profile",
    auth,
    (req, res) => {

        const user =
            db.users.find(
                u =>
                    u.id ===
                    req.user.id
            );

        res.json({
            user:
                publicUser(user)
        });
    }
);

app.put(
    "/api/profile",
    auth,
    (req, res) => {

        const user =
            db.users.find(
                u =>
                    u.id ===
                    req.user.id
            );

        if (req.body.name !== undefined) {

            user.name =
                req.body.name;
        }

        if (req.body.bio !== undefined) {

            user.bio =
                req.body.bio;
        }

        if (req.body.avatar !== undefined) {

            user.avatar =
                req.body.avatar;
        }

        saveDB();

        res.json({

            success: true,

            message:
                "Profile updated",

            user:
                publicUser(user)
        });
    }
);

// =====================================================
// CALENDAR
// =====================================================

app.get(
    "/api/calendar",
    auth,
    (req, res) => {

        const month =
            String(
                req.query.month || ""
            );

        let events =
            db.trips.filter(
                trip =>
                    trip.user_id ===
                    req.user.id
            );

        if (
            /^\d{4}-\d{2}$/.test(month)
        ) {

            events =
                events.filter(
                    trip =>

                        String(
                            trip.start_date || ""
                        ).startsWith(month)

                        ||

                        String(
                            trip.end_date || ""
                        ).startsWith(month)
                );
        }

        res.json({
            events
        });
    }
);

// =====================================================
// CREATE SHARE LINK
// =====================================================

function makeShareToken() {

    return (
        Math.random()
            .toString(36)
            .substring(2) +

        Date.now()
            .toString(36)
    );
}

app.post(
    "/api/trips/:id/share",
    auth,
    (req, res) => {

        const trip =
            db.trips.find(
                t =>
                    t.id ===
                    Number(req.params.id) &&

                    t.user_id ===
                    req.user.id
            );

        if (!trip) {

            return res.status(404).json({
                message: "Trip not found"
            });
        }

        const token =
            makeShareToken();

        db.shared_itineraries.push({

            id:
                nextId(
                    "shared_itineraries"
                ),

            trip_id:
                trip.id,

            token,

            created_at: now()
        });

        saveDB();

        res.status(201).json({

            success: true,

            token,

            url:
                `/shared-itinerary.html?share=${token}`
        });
    }
);

// =====================================================
// PUBLIC SHARED ITINERARY
// =====================================================

app.get(
    "/api/shared/:token",
    (req, res) => {

        const share =
            db.shared_itineraries.find(
                item =>
                    item.token ===
                    req.params.token
            );

        if (!share) {

            return res.status(404).json({
                message:
                    "Shared itinerary not found"
            });
        }

        const trip =
            db.trips.find(
                t =>
                    t.id ===
                    share.trip_id
            );

        if (!trip) {

            return res.status(404).json({
                message:
                    "Trip not found"
            });
        }

        const items =
            db.itinerary_items.filter(
                item =>
                    item.trip_id ===
                    trip.id
            );

        res.json({

            trip,

            items
        });
    }
);

// =====================================================
// ADMIN ANALYTICS
// =====================================================

app.get(
    "/api/admin/analytics",
    auth,
    adminOnly,
    (req, res) => {

        const trips =
            db.trips;

        const items =
            db.itinerary_items;

        const usersByRole = {};

        db.users.forEach(user => {

            usersByRole[user.role] =
                (
                    usersByRole[user.role] ||
                    0
                ) + 1;
        });

        const tripsByStatus = {};

        trips.forEach(trip => {

            tripsByStatus[trip.status] =
                (
                    tripsByStatus[trip.status] ||
                    0
                ) + 1;
        });

        const cityCounts = {};

        items.forEach(item => {

            if (!item.location) return;

            cityCounts[item.location] =
                (
                    cityCounts[item.location] ||
                    0
                ) + 1;
        });

        const topCities =
            Object.entries(cityCounts)

                .sort(
                    (a, b) =>
                        b[1] - a[1]
                )

                .slice(0, 10)

                .map(
                    ([city, visits]) => ({
                        city,
                        visits
                    })
                );

        res.json({

            totals: {

                users:
                    db.users.length,

                trips:
                    trips.length,

                itineraryItems:
                    items.length,

                budget:
                    trips.reduce(
                        (sum, trip) =>
                            sum +
                            Number(
                                trip.budget || 0
                            ),

                        0
                    )
            },

            usersByRole:

                Object.entries(
                    usersByRole
                ).map(
                    ([role, count]) => ({
                        role,
                        count
                    })
                ),

            tripsByStatus:

                Object.entries(
                    tripsByStatus
                ).map(
                    ([status, count]) => ({
                        status,
                        count
                    })
                ),

            topCities
        });
    }
);

// =====================================================
// API 404
// =====================================================

app.use("/api", (req, res) => {

    res.status(404).json({

        message:
            "API route not found"
    });
});

// =====================================================
// SERVE HTML / CSS / JS
// =====================================================

app.use(
    express.static(__dirname)
);

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );
});

// =====================================================
// START SERVER
// =====================================================

app.listen(
    PORT,
    () => {

        console.log("");

        console.log(
            "=============================================="
        );

        console.log(
            " GlobeTrotter Backend Started"
        );

        console.log(
            ` http://localhost:${PORT}`
        );

        console.log(
            "=============================================="
        );

        console.log("");

        console.log(
            "Admin Login:"
        );

        console.log(
            `Email: ${ADMIN_EMAIL}`
        );

        console.log(
            `Password: ${ADMIN_PASSWORD}`
        );

        console.log("");
    }
);