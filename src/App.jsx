import React, { useEffect, useMemo, useState } from "react";

/**
 * Luxury Car Detailing – Single‑File React App
 * -------------------------------------------------
 * ✅ Elegant, interactive, mobile‑first
 * ✅ Services with live price calculator
 * ✅ Booking flow with availability & validation
 * ✅ LocalStorage persistence
 * ✅ Admin mini‑dashboard (view, filter, export CSV, mark paid)
 * ✅ Print‑friendly invoice/confirmation
 *
 * Notes
 * - This is a single‑file MVP meant to be dropped into any React/Tailwind setup.
 * - No backend; bookings are stored in localStorage (replace later with an API).
 * - Admin access uses a demo PIN: 2468 (change in ADMIN_PIN).
 */

// ---- Config ---------------------------------------------------------------
const BRAND = {
  name: "Olympus Detailing",
  tagline: "Where every finish feels first‑class.",
  phone: "+61 400 000 999",
  email: "bookings@olympus-detailing.au",
  address: "11 Athena Ave, Brisbane QLD",
};

const ADMIN_PIN = "2468"; // ⚠️ Demo only. Replace with real auth later.

const SERVICES = [
  {
    id: "express",
    name: "Express Detail",
    desc: "Exterior wash, quick interior spruce, tyre shine.",
    durations: 60,
    priceBySize: { small: 89, medium: 109, large: 129 },
  },
  {
    id: "signature",
    name: "Signature Detail",
    desc: "Deep interior clean, foam wash, clay, machine polish (light).",
    durations: 150,
    priceBySize: { small: 249, medium: 289, large: 329 },
  },
  {
    id: "ceramic",
    name: "Ceramic Coat (3‑yr)",
    desc: "Paint prep, multi‑stage polish, 3‑year ceramic protection.",
    durations: 300,
    priceBySize: { small: 899, medium: 1099, large: 1299 },
  },
];

const ADDONS = [
  { id: "pet", name: "Pet Hair Removal", price: 40 },
  { id: "engine", name: "Engine Bay Detail", price: 60 },
  { id: "headlights", name: "Headlight Restoration", price: 80 },
  { id: "interior", name: "Leather Clean & Protect", price: 70 },
];

const SLOTS_PER_DAY = 6; // simplistic capacity model
const OPENING_HOUR = 9; // 9AM
const CLOSING_HOUR = 17; // 5PM

// ---- Utilities ------------------------------------------------------------
const currency = (n) => new Intl.NumberFormat(undefined, { style: "currency", currency: "AUD" }).format(n);
const todayISO = () => new Date().toISOString().slice(0, 10);
const toISODate = (d) => new Date(d).toISOString().slice(0, 10);

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function download(filename, text) {
  const el = document.createElement("a");
  el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  el.setAttribute("download", filename);
  el.style.display = "none";
  document.body.appendChild(el);
  el.click();
  document.body.removeChild(el);
}

// ---- Storage --------------------------------------------------------------
const STORAGE_KEY = "olympus_bookings_v1";

function useLocalBookings() {
  const [bookings, setBookings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings)), [bookings]);
  return [bookings, setBookings];
}

// ---- App ------------------------------------------------------------------
export default function App() {
  const [route, setRoute] = useState("home");
  const [bookings, setBookings] = useLocalBookings();
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    document.title = `${BRAND.name} — Luxury Car Detailing`;
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <NoiseBg />
      <Nav route={route} setRoute={setRoute} admin={admin} setAdmin={setAdmin} />
      <main className="max-w-6xl mx-auto px-4 pb-24 pt-8">
        {route === "home" && <Home setRoute={setRoute} />}
        {route === "services" && <Services />}
        {route === "book" && (
          <BookingFlow bookings={bookings} setBookings={setBookings} />
        )}
        {route === "contact" && <Contact />}
        {route === "admin" && <AdminDashboard admin={admin} setAdmin={setAdmin} bookings={bookings} setBookings={setBookings} />}
      </main>
      <Footer />
    </div>
  );
}

// ---- UI Primitives --------------------------------------------------------
...
// (The rest of the code continues as in the canvas — trimmed here for brevity)
