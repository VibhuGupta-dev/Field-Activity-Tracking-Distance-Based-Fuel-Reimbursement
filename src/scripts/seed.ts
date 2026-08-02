
import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Lead from "../models/Lead";
import DaySession from "../models/Daysession";
import Activity from "../models/Activity";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local before seeding");
}

const DEMO_PASSWORD = "password123";

function toDateKeyIST(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function seed() {
  await mongoose.connect(MONGODB_URI as string);
  console.log("Connected to MongoDB");

  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({}),
    DaySession.deleteMany({}),
    Activity.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const branchHead = await User.create({
    name: "Ramesh Iyer",
    email: "branchhead1@raha.com",
    passwordHash,
    role: "branch-head",
    reportsTo: null,
  });
  console.log("Created branch head:", branchHead.email);

  const associateSeed = [
    { name: "Aarav Sharma", email: "associate1@raha.com" },
    { name: "Priya Nair", email: "associate2@raha.com" },
    { name: "Karan Mehta", email: "associate3@raha.com" },
  ];

  const associates = await Promise.all(
    associateSeed.map((a) =>
      User.create({
        name: a.name,
        email: a.email,
        passwordHash,
        role: "sales-associate",
        reportsTo: branchHead._id,
      })
    )
  );
  console.log("Created associates:", associates.map((a) => a.email).join(", "));

 
  const leadSeed = [
    { name: "Kavita Textiles", contact: "kavita.textiles@example.com", location: { lat: 17.4483, lng: 78.3915 } },
    { name: "Reddy Constructions", contact: "9876543210", location: { lat: 17.4239, lng: 78.4738 } },
    { name: "Sri Balaji Traders", contact: "sribalaji@example.com", location: { lat: 17.385, lng: 78.4867 } },
    { name: "Deccan Auto Parts", contact: "9123456780", location: { lat: 17.4126, lng: 78.4482 } },
    { name: "Golconda Foods", contact: "golcondafoods@example.com", location: { lat: 17.3616, lng: 78.4747 } },
  ];

  const leads = await Lead.create(leadSeed);
  console.log("Created leads:", leads.map((l) => l.name).join(", "));

  
  const now = new Date();
  for (const associate of associates) {
    for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
      const dayDate = new Date(now);
      dayDate.setDate(dayDate.getDate() - dayOffset);
      dayDate.setHours(9, 0, 0, 0);

      const startLocation = leads[0].location;
      const startTimestamp = new Date(dayDate);
      const endLocation = leads[4].location;
      const endTimestamp = new Date(dayDate.getTime() + 8 * 60 * 60 * 1000);

      const visitedLeads = [leads[1], leads[2], leads[3]];

      const daySession = await DaySession.create({
        associate: associate._id,
        dateKey: toDateKeyIST(startTimestamp),
        status: "closed",
        startLocation,
        startTimestamp,
        endLocation,
        endTimestamp,
        totalDistanceKm: 0, 
        distanceProvider: "haversine",
      });

      let prevTimestamp = startTimestamp;
      const activityDocs = visitedLeads.map((lead) => {
        prevTimestamp = new Date(prevTimestamp.getTime() + 90 * 60 * 1000); 
        return {
          daySession: daySession._id,
          associate: associate._id,
          lead: lead._id,
          type: "in-person-meeting" as const,
          notes: `Met ${lead.name} regarding pending order.`,
          location: lead.location,
          timestamp: prevTimestamp,
        };
      });
      await Activity.insertMany(activityDocs);

      const routePoints = [startLocation, ...visitedLeads.map((l) => l.location), endLocation];
      let totalKm = 0;
      for (let i = 1; i < routePoints.length; i++) {
        totalKm += haversineKm(routePoints[i - 1], routePoints[i]);
      }
      daySession.totalDistanceKm = Math.round(totalKm * 100) / 100;
      await daySession.save();
    }
  }
  console.log("Seeded 3 days of historical activity per associate");

  console.log("\n✅ Done! Test credentials:");
  console.log(`  Branch Head -> ${branchHead.email} / ${DEMO_PASSWORD}`);
  console.log(`  Associate   -> ${associates[0].email} / ${DEMO_PASSWORD}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
