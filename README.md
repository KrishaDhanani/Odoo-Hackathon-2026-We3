# 🌍 GlobeTrotter – Personalized Travel Planning

> **Empowering Personalized Travel Planning**

GlobeTrotter is a personalized and interactive travel planning platform designed to simplify the complexity of planning multi-city trips.

It enables travelers to create customized itineraries, discover destinations and activities, manage travel dates, estimate expenses, visualize their journeys, and share travel plans with others.

## 🎯 Vision

The vision of GlobeTrotter is to transform the way people plan and experience travel by providing an intelligent, flexible, and collaborative travel planning experience.

The platform allows users to explore destinations, organize structured itineraries, make cost-effective decisions, visualize their journeys, and share their travel plans with a community.

## 🚨 Problem Statement

Planning a multi-city trip can become complicated when travelers need to manage:

* Multiple destinations
* Different travel dates
* Activities
* Travel expenses
* Daily schedules
* Budget limitations
* Trip sharing

GlobeTrotter addresses these challenges through a single user-friendly platform for organizing and managing complete travel plans.

## 💡 Our Solution

GlobeTrotter provides an end-to-end travel planning application where users can:

* Create customized multi-city itineraries
* Assign travel dates and activities
* Set and monitor budgets
* Discover cities and destinations
* Search for activities
* View cost breakdowns
* Visualize trips using calendars and timelines
* Share itineraries publicly or with friends

These capabilities are part of the specified application requirements.

## ✨ Key Features

### 🔐 1. Login / Signup

Users can create an account or log in to manage their personal travel plans.

**Features:**

* Email and password authentication
* Signup
* Login
* Forgot password
* Basic form validation

### 🏠 2. Dashboard

The dashboard acts as the central hub of the application.

**Features:**

* Welcome message
* Recent trips
* Upcoming trips
* Popular destinations
* Recommended destinations
* Budget highlights
* Plan New Trip

### ✈️ 3. Create Trip

Users can create a personalized trip by entering:

* Trip name
* Start date
* End date
* Trip description
* Optional cover photo

### 🧳 4. My Trips

Users can view and manage all their trips.

Each trip card can display:

* Trip name
* Date range
* Number of destinations
* View trip
* Edit trip
* Delete trip

### 🗺️ 5. Itinerary Builder

The itinerary builder allows users to construct their complete multi-city journey.

**Features:**

* Add travel stops
* Select cities
* Assign travel dates
* Add activities
* Reorder cities
* Build day-wise plans

The source specification identifies the itinerary builder as the interface for adding cities, dates, and activities to each stop.

### 📅 6. Itinerary View

Users can review their complete journey through:

* Day-wise itinerary
* City sections
* Activity blocks
* Activity time
* Activity cost
* Calendar view
* List view

### 🌎 7. City Search

Users can search for destinations and add them to their trips.

**Information includes:**

* City
* Country
* Cost index
* Popularity
* Region

### 🎯 8. Activity Search

Users can discover activities based on their interests.

**Categories may include:**

* Sightseeing
* Food
* Adventure
* Entertainment
* Culture

Users can filter activities based on type, cost, and duration.

### 💰 9. Trip Budget & Cost Breakdown

GlobeTrotter provides a financial overview of the trip.

**Cost categories:**

* 🚆 Transportation
* 🏨 Accommodation
* 🎯 Activities
* 🍽️ Meals

**Features:**

* Total estimated cost
* Cost breakdown
* Average cost per day
* Charts
* Budget alerts

The specification calls for pie/bar charts and alerts for over-budget days.

### 🕐 10. Trip Calendar / Timeline

Users can visualize their complete journey through a calendar or vertical timeline.

**Features:**

* Calendar view
* Day-wise activities
* Expandable days
* Drag-to-reorder activities
* Quick editing

### 🔗 11. Public / Shared Itinerary

Users can share their travel plans with friends or publicly.

**Features:**

* Public itinerary URL
* Read-only itinerary
* Trip summary
* Copy Trip
* Social media sharing

The shared itinerary can also allow other users to get inspired or copy a trip.

### 👤 12. User Profile & Settings

Users can manage their personal information and preferences.

**Features:**

* Name
* Profile photo
* Email
* Language preference
* Saved destinations
* Delete account
* Privacy controls

### 📊 13. Admin / Analytics Dashboard

An optional admin dashboard can provide insights into:

* Number of trips
* Popular cities
* Popular activities
* User engagement
* Platform usage
* User management

---

# 🛠️ Technology Stack

## Frontend

* React.js
* Vite
* JavaScript
* HTML5
* CSS3
* Tailwind CSS

## 3D & Animation

For an engaging hackathon experience, the platform can use:

* Three.js
* React Three Fiber
* React Three Drei
* GSAP

3D animations can be used for the GlobeTrotter landing page, destination visualization, interactive globe, and travel transitions.

## Backend

* Node.js
* Express.js
* REST API

## Database

* Relational Database
* MySQL / PostgreSQL

The project specification emphasizes the use of a relational database for storing users, itineraries, stops, activities, and estimated expenses.

---

# 📂 Project Structure

```text
GlobeTrotter/
│
├── public/
│   ├── images/
│   └── models/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── assets/
│   ├── context/
│   ├── services/
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
├── vite.config.js
├── README.md
└── .gitignore
```

---

# ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/globetrotter.git
```

### 2. Navigate to the project

```bash
cd globetrotter
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

---

# 🎨 3D Experience

GlobeTrotter can use interactive 3D elements to create a modern travel experience.

Possible 3D features include:

* 🌍 Interactive 3D Earth
* ✈️ Animated airplane
* 📍 3D destination markers
* 🗺️ Animated travel routes
* 🌐 Rotating globe
* ✨ Smooth page transitions
* 🧭 Interactive destination exploration

The 3D experience can be concentrated in the landing page so that the application remains fast and easy to use.

---

# 🔄 User Flow

```text
Login / Signup
      ↓
   Dashboard
      ↓
  Create Trip
      ↓
  Add Cities
      ↓
Add Activities
      ↓
Build Itinerary
      ↓
Set Budget
      ↓
View Calendar
      ↓
Review Trip
      ↓
Share Itinerary
```

---

# 🗄️ Database Concept

The application can use relational tables such as:

```text
Users
  │
  └── Trips
        │
        ├── Trip Stops
        │      │
        │      └── Cities
        │
        ├── Activities
        │
        └── Expenses
```

This structure supports user-specific itineraries, destinations, activities, and estimated expenses.

---

# 🚀 Future Scope

Future improvements can include:

* 🤖 AI-powered itinerary recommendations
* 🧠 Personalized destination suggestions
* 🌦️ Real-time weather information
* 💱 Live currency conversion
* 🚆 Real-time transportation information
* 🏨 Hotel recommendations
* 📱 Mobile application
* 🌐 Multi-language support
* ☁️ Cloud deployment
* 👥 Collaborative trip planning
* 📈 Advanced travel analytics

---

# 🏆 Hackathon Highlights

GlobeTrotter focuses on:

**Personalization + Interactivity + Budget Management + Visualization + Collaboration**

The platform is designed to make travel planning more organized, flexible, and enjoyable while giving users visibility into their complete journey.

---

# 👥 Team

| Name          | Role                    |
| ------------- | ----------------------- |
| Team Member 1 | Team Leader / Developer |
| Team Member 2 | Frontend Developer      |
| Team Member 3 | Backend Developer       |
| Team Member 4 | UI/UX & 3D Developer    |

---

# 📸 Screenshots

Add screenshots of the application here:

```text
screenshots/
├── landing-page.png
├── dashboard.png
├── create-trip.png
├── itinerary.png
├── budget.png
└── profile.png
```

---

# 📄 License

This project is developed as part of a hackathon and is intended for educational and demonstration purposes.

---

# ❤️ Acknowledgement

Built with passion by the **GlobeTrotter Hackathon Team**.

> **Plan smarter. Explore further. Travel better. 🌍✈️**
