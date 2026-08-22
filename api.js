// =====================================================
// GLOBETROTTER FRONTEND API
// =====================================================

const API_BASE =
    window.location.origin + "/api";

// =====================================================
// GENERIC API FUNCTION
// =====================================================

async function api(endpoint, options = {}) {

    const token =
        localStorage.getItem(
            "globetrotter_token"
        );

    const headers = {

        "Content-Type":
            "application/json",

        ...(options.headers || {})
    };

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;
    }

    const response =
        await fetch(
            API_BASE + endpoint,
            {
                ...options,
                headers
            }
        );

    const data =
        await response
            .json()
            .catch(() => ({}));

    if (!response.ok) {

        throw new Error(
            data.message ||
            "Something went wrong"
        );
    }

    return data;
}

// =====================================================
// AUTH
// =====================================================

async function registerUser(
    name,
    email,
    password
) {

    const data =
        await api(
            "/auth/register",
            {
                method: "POST",

                body:
                    JSON.stringify({
                        name,
                        email,
                        password
                    })
            }
        );

    localStorage.setItem(
        "globetrotter_token",
        data.token
    );

    localStorage.setItem(
        "globetrotter_user",
        JSON.stringify(data.user)
    );

    return data;
}

async function loginUser(
    email,
    password
) {

    const data =
        await api(
            "/auth/login",
            {
                method: "POST",

                body:
                    JSON.stringify({
                        email,
                        password
                    })
            }
        );

    localStorage.setItem(
        "globetrotter_token",
        data.token
    );

    localStorage.setItem(
        "globetrotter_user",
        JSON.stringify(data.user)
    );

    return data;
}

function logoutUser() {

    localStorage.removeItem(
        "globetrotter_token"
    );

    localStorage.removeItem(
        "globetrotter_user"
    );

    window.location.href =
        "index.html";
}

async function getCurrentUser() {

    return await api(
        "/auth/me"
    );
}

// =====================================================
// DASHBOARD
// =====================================================

async function getDashboard() {

    return await api(
        "/dashboard"
    );
}

// =====================================================
// TRIPS
// =====================================================

async function getTrips() {

    return await api(
        "/trips"
    );
}

async function getTrip(tripId) {

    return await api(
        `/trips/${tripId}`
    );
}

async function createTrip(tripData) {

    return await api(
        "/trips",
        {
            method: "POST",

            body:
                JSON.stringify(
                    tripData
                )
        }
    );
}

async function updateTrip(
    tripId,
    tripData
) {

    return await api(
        `/trips/${tripId}`,
        {
            method: "PUT",

            body:
                JSON.stringify(
                    tripData
                )
        }
    );
}

async function deleteTrip(
    tripId
) {

    return await api(
        `/trips/${tripId}`,
        {
            method: "DELETE"
        }
    );
}

// =====================================================
// ITINERARY
// =====================================================

async function getItinerary(
    tripId
) {

    return await api(
        `/trips/${tripId}/itinerary`
    );
}

async function addItineraryItem(
    tripId,
    item
) {

    return await api(
        `/trips/${tripId}/itinerary`,
        {
            method: "POST",

            body:
                JSON.stringify(item)
        }
    );
}

async function updateItineraryItem(
    itemId,
    item
) {

    return await api(
        `/itinerary/${itemId}`,
        {
            method: "PUT",

            body:
                JSON.stringify(item)
        }
    );
}

async function deleteItineraryItem(
    itemId
) {

    return await api(
        `/itinerary/${itemId}`,
        {
            method: "DELETE"
        }
    );
}

// =====================================================
// CITY SEARCH
// =====================================================

async function searchCities(
    query = "",
    category = ""
) {

    const params =
        new URLSearchParams();

    if (query) {

        params.set(
            "query",
            query
        );
    }

    if (category) {

        params.set(
            "category",
            category
        );
    }

    const queryString =
        params.toString();

    return await api(
        `/cities${
            queryString
                ? "?" + queryString
                : ""
        }`
    );
}

// =====================================================
// ACTIVITY SEARCH
// =====================================================

async function searchActivities(
    query = "",
    city = "",
    category = ""
) {

    const params =
        new URLSearchParams();

    if (query) {

        params.set(
            "query",
            query
        );
    }

    if (city) {

        params.set(
            "city",
            city
        );
    }

    if (category) {

        params.set(
            "category",
            category
        );
    }

    const queryString =
        params.toString();

    return await api(
        `/activities${
            queryString
                ? "?" + queryString
                : ""
        }`
    );
}

// =====================================================
// PROFILE
// =====================================================

async function getProfile() {

    return await api(
        "/profile"
    );
}

async function updateProfile(
    profileData
) {

    const data =
        await api(
            "/profile",
            {
                method: "PUT",

                body:
                    JSON.stringify(
                        profileData
                    )
            }
        );

    localStorage.setItem(
        "globetrotter_user",
        JSON.stringify(
            data.user
        )
    );

    return data;
}

// =====================================================
// CALENDAR
// =====================================================

async function getCalendar(
    month = ""
) {

    if (!month) {

        return await api(
            "/calendar"
        );
    }

    return await api(
        `/calendar?month=${
            encodeURIComponent(
                month
            )
        }`
    );
}

// =====================================================
// SHARE ITINERARY
// =====================================================

async function createShareLink(
    tripId
) {

    return await api(
        `/trips/${tripId}/share`,
        {
            method: "POST"
        }
    );
}

async function getSharedItinerary(
    token
) {

    return await api(
        `/shared/${encodeURIComponent(
            token
        )}`
    );
}

// =====================================================
// ADMIN
// =====================================================

async function getAdminAnalytics() {

    return await api(
        "/admin/analytics"
    );
}

// =====================================================
// HEALTH
// =====================================================

async function checkBackend() {

    return await api(
        "/health"
    );
}