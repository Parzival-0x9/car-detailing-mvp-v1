import React, { useEffect, useMemo, useState } from "react";

/**
 * Luxury Car Detailing – Single-File React App (Home Service Enabled)
 * -------------------------------------------------
 * ✅ Elegant, interactive, mobile-first
 * ✅ Services with live price calculator
 * ✅ Booking flow with availability & validation
 * ✅ LocalStorage persistence
 * ✅ Admin mini-dashboard (view, filter, export CSV, mark paid)
 * ✅ Print-friendly invoice/confirmation
 * ✅ Home Service: address, travel zones, travel fee
 */

// ---- Config ---------------------------------------------------------------
const BRAND = {
  name: "Olympus Detailing",
  tagline: "Where every finish feels first-class.",
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
    name: "Ceramic Coat (3-yr)",
    desc: "Paint prep, multi-stage polish, 3-year ceramic protection.",
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

// Home service travel zones
const MOBILE_ZONES = [
  { id: "A", label: "Zone A – within ~20km", fee: 25 },
  { id: "B", label: "Zone B – 20–35km", fee: 45 },
  { id: "C", label: "Zone C – 35–50km", fee: 65 },
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
function Card({ children, className }) {
  return (
    <div className={classNames("rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-2xl backdrop-blur p-6", className)}>
      {children}
    </div>
  );
}

function Button({ children, onClick, type = "button", className, disabled }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classNames(
        "px-5 py-3 rounded-2xl font-medium transition-all disabled:opacity-50",
        "bg-amber-500/90 hover:bg-amber-400 text-neutral-900 shadow-lg hover:shadow-xl",
        className
      )}
    >
      {children}
    </button>
  );
}

function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-6">
      {eyebrow && <div className="text-xs uppercase tracking-[0.2em] text-amber-400/80 mb-1">{eyebrow}</div>}
      <h2 className="text-2xl md:text-3xl font-semibold text-amber-50">{title}</h2>
      {subtitle && <p className="text-neutral-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function NoiseBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          "radial-gradient(1500px 600px at 10% -10%, rgba(251,191,36,0.08), transparent)," +
          "radial-gradient(1200px 500px at 90% -10%, rgba(251,191,36,0.05), transparent)," +
          "linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.9))",
        maskImage: "linear-gradient(0deg, black 60%, transparent)",
      }}
    />
  );
}

function Nav({ route, setRoute, admin, setAdmin }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");

  const enterAdmin = () => {
    if (pin === ADMIN_PIN) {
      setAdmin(true);
      setRoute("admin");
      setPin("");
      setOpen(false);
    } else alert("Incorrect PIN");
  };

  return (
    <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/70 border-b border-neutral-900">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow" />
          <div>
            <div className="font-semibold tracking-tight">{BRAND.name}</div>
            <div className="text-xs text-neutral-400 -mt-0.5">{BRAND.tagline}</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-3">
          {[
            ["home", "Home"],
            ["services", "Services"],
            ["book", "Book"],
            ["contact", "Contact"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRoute(key)}
              className={classNames(
                "px-4 py-2 rounded-xl text-sm",
                route === key ? "bg-neutral-800 text-amber-300" : "hover:bg-neutral-900"
              )}
            >
              {label}
            </button>
          ))}
          <div className="w-px h-6 bg-neutral-800 mx-2" />
          {admin ? (
            <button onClick={() => setRoute("admin")} className="px-4 py-2 rounded-xl text-sm bg-amber-500/20 text-amber-300 hover:bg-amber-500/30">Admin</button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Admin PIN"
                className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm w-28 focus:outline-none focus:ring focus:ring-amber-500/30"
              />
              <Button onClick={enterAdmin} className="text-sm py-2">Enter</Button>
            </div>
          )}
        </nav>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          <div className="i i-menu" />
        </button>
      </div>
      {open && (
        <div className="md:hidden px-4 pb-4 space-y-2 border-t border-neutral-900">
          {[
            ["home", "Home"],
            ["services", "Services"],
            ["book", "Book"],
            ["contact", "Contact"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setRoute(key);
                setOpen(false);
              }}
              className={classNames(
                "w-full text-left px-3 py-2 rounded-xl",
                route === key ? "bg-neutral-800 text-amber-300" : "hover:bg-neutral-900"
              )}
            >
              {label}
            </button>
          ))}
          {!admin && (
            <div className="flex items-center gap-2 pt-2">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Admin PIN"
                className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm w-full focus:outline-none focus:ring focus:ring-amber-500/30"
              />
              <Button onClick={enterAdmin} className="text-sm py-2">Enter</Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function Home({ setRoute }) {
  return (
    <div className="grid md:grid-cols-2 gap-6 items-center">
      <div className="space-y-6">
        <div>
          <div className="text-sm uppercase tracking-[0.25em] text-amber-400/80">Premium • Boutique • Mobile</div>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight mt-3">
            Elevate your car’s finish with
            <span className="text-amber-400"> impeccable care</span>.
          </h1>
          <p className="text-neutral-400 mt-4 max-w-prose">
            We bring a concierge detailing experience to your driveway or our studio. Book in minutes; arrive to that new-car glow.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setRoute("book")} className="">Book Now</Button>
          <button onClick={() => setRoute("services")} className="px-5 py-3 rounded-2xl font-medium border border-neutral-800 hover:bg-neutral-900">Explore Services</button>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {["Concierge Pickup", "Paint-Safe", "Satisfaction"].map((k) => (
            <Card key={k} className="py-5">
              <div className="text-amber-300 text-sm">{k}</div>
              <div className="text-xs text-neutral-400">Guaranteed</div>
            </Card>
          ))}
        </div>
      </div>
      <div className="relative">
        <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
          <div className="absolute inset-0" style={{
            background:
              "radial-gradient(400px 200px at 20% 30%, rgba(251,191,36,0.25), transparent)," +
              "radial-gradient(500px 300px at 80% 70%, rgba(251,191,36,0.15), transparent)"
          }} />
          <div className="absolute bottom-6 left-6 right-6">
            <Card className="bg-neutral-950/50 border-neutral-800">
              <div className="text-sm text-neutral-300">Next available: <span className="text-amber-300">Tomorrow</span></div>
              <div className="text-xs text-neutral-400">Limited slots — secure your time in under 60 seconds.</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Services() {
  return (
    <section className="space-y-6">
      <SectionTitle eyebrow="Our Services" title="Crafted packages for every finish" subtitle="Transparent pricing by vehicle size. Add enhancements as you wish." />
      <div className="grid md:grid-cols-3 gap-4">
        {SERVICES.map((s) => (
          <Card key={s.id}>
            <div className="text-lg font-semibold text-amber-100">{s.name}</div>
            <p className="text-sm text-neutral-400 mt-1">{s.desc}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {Object.entries(s.priceBySize).map(([size, price]) => (
                <div key={size} className="rounded-xl bg-neutral-950/40 border border-neutral-800 p-3">
                  <div className="text-xs uppercase tracking-wide text-neutral-400">{size}</div>
                  <div className="font-semibold">{currency(price)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-neutral-500">Approx. duration: {Math.round(s.durations/60)}h {s.durations%60? `${s.durations%60}m` : ""}</div>
          </Card>
        ))}
      </div>
      <Card>
        <div className="text-sm font-medium mb-2 text-amber-100">Enhancements</div>
        <div className="grid md:grid-cols-4 gap-3">
          {ADDONS.map((a) => (
            <div key={a.id} className="rounded-xl bg-neutral-950/40 border border-neutral-800 p-4">
              <div className="font-medium">{a.name}</div>
              <div className="text-neutral-400 text-sm">{currency(a.price)}</div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

function BookingFlow({ bookings, setBookings }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    customer: "",
    email: "",
    phone: "",
    vehicle: "",
    size: "medium",
    serviceId: SERVICES[1].id,
    addons: [],
    // Location
    locationType: "studio", // "studio" | "mobile"
    mobileZone: "A",
    street: "",
    suburb: "",
    postcode: "",
    // Schedule
    date: todayISO(),
    time: "09:00",
    notes: "",
    paid: false,
  });

  const selectedService = useMemo(
    () => SERVICES.find((s) => s.id === form.serviceId),
    [form.serviceId]
  );

  const basePrice = selectedService?.priceBySize?.[form.size] ?? 0;
  const addonsTotal = form.addons.map((id) => ADDONS.find((a) => a.id === id)?.price || 0).reduce((a, b) => a + b, 0);
  const travelFee = form.locationType === "mobile" ? (MOBILE_ZONES.find(z => z.id === form.mobileZone)?.fee || 0) : 0;
  const total = basePrice + addonsTotal + travelFee;

  const dayBookings = bookings.filter((b) => b.date === form.date);
  const takenTimes = new Set(dayBookings.map((b) => b.time));

  const timeOptions = useMemo(() => {
    const opts = [];
    for (let h = OPENING_HOUR; h < CLOSING_HOUR; h++) {
      ["00", "30"].forEach((m) => {
        const t = `${String(h).padStart(2, "0")}:${m}`;
        opts.push(t);
      });
    }
    return opts;
  }, []);

  const capacityReached = dayBookings.length >= SLOTS_PER_DAY;

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleAddon(id) {
    setForm((f) => ({
      ...f,
      addons: f.addons.includes(id) ? f.addons.filter((x) => x !== id) : [...f.addons, id],
    }));
  }

  function validate() {
    const errs = [];
    if (!form.customer.trim()) errs.push("Your full name is required.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.push("A valid email is required.");
    if (!/^[- +()0-9]{8,}$/.test(form.phone)) errs.push("A valid phone number is required.");
    if (!form.vehicle.trim()) errs.push("Vehicle make/model is required.");

    if (form.locationType === "mobile") {
      if (!form.street.trim()) errs.push("Street address is required for home service.");
      if (!form.suburb.trim()) errs.push("Suburb is required for home service.");
      if (!/^\d{4}$/.test(form.postcode)) errs.push("A 4-digit postcode is required for home service.");
    }

    if (capacityReached) errs.push("No availability on this day. Please pick another date.");
    if (takenTimes.has(form.time)) errs.push("Selected time is already booked.");
    return errs;
  }

  function submit() {
    const errs = validate();
    if (errs.length) return alert(errs.join("\n"));

    const booking = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...form, total, travelFee };
    setBookings((xs) => [...xs, booking]);
    setStep(3);
  }

  function printConfirm() {
    window.print();
  }

  return (
    <section className="space-y-6">
      <SectionTitle eyebrow="Book Now" title="Reserve your detail in under a minute" subtitle="Pick a service, choose a time, home or studio, and we’ll confirm instantly." />

      {/* Stepper */}
      <div className="flex items-center gap-3 text-sm">
        {[1, 2, 3].map((i) => (
          <div key={i} className={classNames("flex items-center gap-2", i !== 3 && "flex-1") }>
            <div className={classNames("h-8 w-8 rounded-full grid place-items-center border",
              step >= i ? "bg-amber-500 text-neutral-900 border-transparent" : "border-neutral-800")}>{i}</div>
            {i !== 3 && <div className={classNames("h-[2px] flex-1", step > i ? "bg-amber-500" : "bg-neutral-800")} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium mb-2 text-amber-100">Choose Service</div>
              <div className="space-y-2">
                {SERVICES.map((s) => (
                  <label key={s.id} className={classNames("block p-4 rounded-xl border cursor-pointer",
                    form.serviceId === s.id ? "border-amber-500 bg-amber-500/10" : "border-neutral-800 hover:bg-neutral-900")}
                  >
                    <input type="radio" name="service" className="hidden" checked={form.serviceId===s.id} onChange={() => update("serviceId", s.id)} />
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-neutral-400 max-w-prose">{s.desc}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-neutral-300">from {currency(s.priceBySize[form.size])}</div>
                        <div className="text-xs text-neutral-500">~{Math.round(s.durations/60)}h</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2 text-amber-100">Vehicle & Add-ons</div>
              <div className="grid gap-3">
                <input value={form.vehicle} onChange={(e)=>update("vehicle", e.target.value)} placeholder="Vehicle make & model (e.g., BMW M3)" className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3" />
                <select value={form.size} onChange={(e)=>update("size", e.target.value)} className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
                  <option value="small">Small / Coupe</option>
                  <option value="medium">Sedan / SUV</option>
                  <option value="large">Large / 4x4 / Van</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  {ADDONS.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2">
                      <input type="checkbox" checked={form.addons.includes(a.id)} onChange={()=>toggleAddon(a.id)} />
                      <span className="text-sm flex-1">{a.name}</span>
                      <span className="text-sm text-neutral-400">{currency(a.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Location selector */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium mb-2 text-amber-100">Service location</div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2">
                  <input type="radio" name="loc" checked={form.locationType==="studio"} onChange={()=>update("locationType","studio")} />
                  Studio (at our place)
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="loc" checked={form.locationType==="mobile"} onChange={()=>update("locationType","mobile")} />
                  Home service (we come to you)
                </label>
              </div>
              {form.locationType === "mobile" && (
                <div className="mt-3 p-4 rounded-xl bg-neutral-900 border border-neutral-800 grid gap-3">
                  <select value={form.mobileZone} onChange={(e)=>update("mobileZone", e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3">
                    {MOBILE_ZONES.map(z=> <option key={z.id} value={z.id}>{z.label} (+{currency(z.fee)})</option>)}
                  </select>
                  <input value={form.street} onChange={(e)=>update("street", e.target.value)} placeholder="Street address" className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3" />
                  <div className="grid grid-cols-3 gap-2">
                    <input value={form.suburb} onChange={(e)=>update("suburb", e.target.value)} placeholder="Suburb" className="col-span-2 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3" />
                    <input value={form.postcode} onChange={(e)=>update("postcode", e.target.value)} placeholder="Postcode" className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3" />
                  </div>
                  <div className="text-xs text-neutral-400">Zones are rough travel distances. For areas beyond Zone C (~50km), contact us for a custom quote.</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="text-sm text-neutral-300">Current total</div>
            <div className="text-xl font-semibold text-amber-300">{currency(total)}</div>
          </div>

          <div className="flex justify-end">
            <Button onClick={()=>setStep(2)}>Continue</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium mb-2 text-amber-100">Your Details</div>
              <div className="grid gap-3">
                <input value={form.customer} onChange={(e)=>update("customer", e.target.value)} placeholder="Full name" className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3" />
                <input value={form.email} onChange={(e)=>update("email", e.target.value)} placeholder="Email" className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3" />
                <input value={form.phone} onChange={(e)=>update("phone", e.target.value)} placeholder="Phone" className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3" />
                <textarea value={form.notes} onChange={(e)=>update("notes", e.target.value)} placeholder="Notes or access instructions (optional)" className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 min-h-[90px]" />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2 text-amber-100">Date & Time</div>
              <div className="grid gap-3">
                <input type="date" min={todayISO()} value={form.date} onChange={(e)=>update("date", e.target.value)} className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3" />
                <select value={form.time} onChange={(e)=>update("time", e.target.value)} className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
                  {capacityReached && <option>— No availability —</option>}
                  {!capacityReached && timeOptions.map((t) => (
                    <option key={t} value={t} disabled={takenTimes.has(t)}>
                      {t} {takenTimes.has(t) ? "(Booked)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
                We’ll confirm by email and SMS. You can reschedule up to 24h prior.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="text-sm text-neutral-300">Amount due on the day</div>
            <div className="text-xl font-semibold text-amber-300">{currency(total)}</div>
          </div>

          <div className="flex justify-between">
            <button onClick={()=>setStep(1)} className="px-5 py-3 rounded-2xl font-medium border border-neutral-800 hover:bg-neutral-900">Back</button>
            <Button onClick={submit}>Confirm Booking</Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-4">
          <div className="text-xl font-semibold text-amber-100">You’re booked ✨</div>
          <p className="text-neutral-300">We’ve saved your reservation. A confirmation will be sent to your email and phone (demo).</p>
          <div className="grid md:grid-cols-2 gap-4">
            <SummaryCard form={form} total={total} travelFee={travelFee} />
            <Card className="bg-neutral-950/60">
              <div className="text-sm font-medium text-amber-100 mb-2">What happens next</div>
              <ul className="text-sm text-neutral-300 list-disc pl-5 space-y-1">
                <li>We’ll arrive within your chosen time window.</li>
                <li>Please park in a shaded, accessible spot if possible.</li>
                <li>Payment on completion: card, cash, or bank transfer.</li>
              </ul>
              <div className="mt-4 flex gap-3">
                <Button onClick={printConfirm} className="">Print / Save PDF</Button>
              </div>
            </Card>
          </div>
        </Card>
      )}
    </section>
  );
}

function SummaryCard({ form, total, travelFee }) {
  const svc = SERVICES.find((s) => s.id === form.serviceId);
  return (
    <Card>
      <div className="text-sm font-medium text-amber-100 mb-2">Booking Summary</div>
      <div className="text-sm grid grid-cols-2 gap-y-2">
        <div className="text-neutral-400">Name</div><div>{form.customer}</div>
        <div className="text-neutral-400">Email</div><div>{form.email}</div>
        <div className="text-neutral-400">Phone</div><div>{form.phone}</div>
        <div className="text-neutral-400">Service</div><div>{svc?.name}</div>
        <div className="text-neutral-400">Vehicle</div><div>{form.vehicle}</div>
        <div className="text-neutral-400">Size</div><div className="uppercase">{form.size}</div>
        <div className="text-neutral-400">Location</div>
        <div>
          {form.locationType === "studio"
            ? "Studio"
            : `Home service • ${MOBILE_ZONES.find((z) => z.id === form.mobileZone)?.label}`}
        </div>
        {form.locationType === "mobile" && (
          <>
            <div className="text-neutral-400">Address</div>
            <div>{form.street}, {form.suburb} {form.postcode}</div>
          </>
        )}
        <div className="text-neutral-400">Date</div><div>{toISODate(form.date)}</div>
        <div className="text-neutral-400">Time</div><div>{form.time}</div>
        <div className="text-neutral-400">Enhancements</div>
        <div>{form.addons.length ? form.addons.map((id) => ADDONS.find((a) => a.id === id)?.name).join(", ") : "None"}</div>
      </div>
      <div className="mt-4 grid gap-2">
        {form.locationType === "mobile" && (
          <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-3">
            <div className="text-sm text-neutral-300">Travel fee</div>
            <div className="text-base font-semibold text-amber-300">{currency(travelFee)}</div>
          </div>
        )}
        <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-3">
          <div className="text-sm text-neutral-300">Total</div>
          <div className="text-lg font-semibold text-amber-300">{currency(total)}</div>
        </div>
      </div>
    </Card>
  );
}

function Contact() {
  return (
    <section className="space-y-6">
      <SectionTitle eyebrow="Contact" title="We’re here to help" subtitle="Reach out for custom packages, fleets, or studio bookings." />
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-neutral-400">Phone</div>
          <div className="font-medium">{BRAND.phone}</div>
        </Card>
        <Card>
          <div className="text-sm text-neutral-400">Email</div>
          <div className="font-medium">{BRAND.email}</div>
        </Card>
        <Card>
          <div className="text-sm text-neutral-400">Address</div>
          <div className="font-medium">{BRAND.address}</div>
        </Card>
      </div>
      <Card>
        <div className="text-sm font-medium text-amber-100 mb-2">Message us</div>
        <form className="grid md:grid-cols-2 gap-3">
          <input placeholder="Your name" className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3" />
          <input placeholder="Email" className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3" />
          <textarea placeholder="How can we help?" className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 min-h-[120px]" />
          <div className="md:col-span-2 flex justify-end">
            <Button>Send (demo)</Button>
          </div>
        </form>
      </Card>
    </section>
  );
}

function AdminDashboard({ admin, setAdmin, bookings, setBookings }) {
  const [q, setQ] = useState("");
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);

  const filtered = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((b) => (onlyUpcoming ? new Date(`${b.date}T${b.time}`) >= now : true))
      .filter((b) => [b.customer, b.email, b.phone, b.vehicle, b.street, b.suburb, b.postcode].join(" ").toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  }, [bookings, q, onlyUpcoming]);

  function togglePaid(id) {
    setBookings((xs) => xs.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b)));
  }

  function remove(id) {
    if (!confirm("Delete this booking?")) return;
    setBookings((xs) => xs.filter((b) => b.id !== id));
  }

  function exportCSV() {
    const headers = [
      "createdAt","date","time","customer","email","phone","vehicle","size","service","addons","locationType","mobileZone","street","suburb","postcode","notes","paid","travelFee","total"
    ];
    const rows = bookings.map((b) => [
      b.createdAt,b.date,b.time,b.customer,b.email,b.phone,b.vehicle,b.size,
      SERVICES.find((s)=>s.id===b.serviceId)?.name,
      b.addons.map((id)=>ADDONS.find(a=>a.id===id)?.name).join("; "),
      b.locationType, b.mobileZone || "", b.street || "", b.suburb || "", b.postcode || "",
      (b.notes||"").replaceAll("\n"," "),
      b.paid?"yes":"no",
      b.travelFee ?? 0,
      b.total
    ]);
    const csv = [headers.join(","), ...rows.map((r)=>r.map((v)=>`"${String(v??"").replaceAll('"','""')}"`).join(","))].join("\n");
    download(`bookings-${todayISO()}.csv`, csv);
  }

  if (!admin) {
    return (
      <Card>
        <div className="text-sm text-neutral-300">Admin access required. Enter the PIN in the header.</div>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle eyebrow="Admin" title="Bookings dashboard" subtitle="Lightweight controls for your day-to-day." />
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-900">Export CSV</button>
          <button onClick={()=>setAdmin(false)} className="px-4 py-2 rounded-xl border border-neutral-700 hover:bg-neutral-900">Lock</button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="flex gap-2 items-center">
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search name, email, phone, vehicle, or address" className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 w-72" />
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={onlyUpcoming} onChange={(e)=>setOnlyUpcoming(e.target.checked)} />
              Upcoming only
            </label>
          </div>
          <div className="text-sm text-neutral-400">Total bookings: {bookings.length}</div>
        </div>
      </Card>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <Card>
            <div className="text-neutral-400 text-sm">No bookings found.</div>
          </Card>
        )}
        {filtered.map((b) => (
          <Card key={b.id} className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
            <div className="text-sm grid grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-6">
              <div className="text-neutral-400">When</div>
              <div>{b.date} {b.time}</div>
              <div className="text-neutral-400">Customer</div>
              <div>{b.customer} • {b.phone}</div>
              <div className="text-neutral-400">Email</div>
              <div>{b.email}</div>
              <div className="text-neutral-400">Vehicle</div>
              <div>{b.vehicle} ({b.size.toUpperCase()})</div>
              <div className="text-neutral-400">Service</div>
              <div>{SERVICES.find((s)=>s.id===b.serviceId)?.name}</div>
              <div className="text-neutral-400">Location</div>
              <div>
                {b.locationType === "mobile"
                  ? `Home • Zone ${b.mobileZone} — ${b.street}, ${b.suburb} ${b.postcode}`
                  : "Studio"}
              </div>
              <div className="text-neutral-400">Enhancements</div>
              <div>{b.addons.length? b.addons.map((id)=>ADDONS.find(a=>a.id===id)?.name).join(", ") : "None"}</div>
              <div className="text-neutral-400">Total</div>
              <div>{currency(b.total)}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>togglePaid(b.id)} className={classNames("px-4 py-2 rounded-xl border", b.paid?"border-emerald-600 bg-emerald-600/20":"border-neutral-700 hover:bg-neutral-900")}>{b.paid?"Paid":"Mark Paid"}</button>
              <button onClick={()=>remove(b.id)} className="px-4 py-2 rounded-xl border border-red-700 text-red-300 hover:bg-red-900/20">Delete</button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-900">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-6 text-sm">
        <div>
          <div className="font-semibold">{BRAND.name}</div>
          <div className="text-neutral-400">{BRAND.tagline}</div>
        </div>
        <div className="text-neutral-400">
          <div>{BRAND.phone}</div>
          <div>{BRAND.email}</div>
          <div>{BRAND.address}</div>
        </div>
        <div className="text-neutral-400">
          <div>ABN 00 000 000 000</div>
          <div>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}

// Small Icon shim – (menu icon via CSS)
const styles = document.createElement("style");
styles.textContent = `.i{width:24px;height:24px;display:inline-block;position:relative}
.i-menu::before,.i-menu::after{content:"";position:absolute;left:4px;right:4px;height:2px;background:#a3a3a3;border-radius:2px}
.i-menu::before{top:7px}.i-menu::after{bottom:7px}
.i-menu{box-shadow:0 11px 0 #a3a3a3 inset;}`;
document.head.appendChild(styles);
