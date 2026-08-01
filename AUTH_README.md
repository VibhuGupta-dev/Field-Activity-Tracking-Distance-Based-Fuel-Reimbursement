# Auth Backend — Setup

## 1. Install packages
```bash
npm install mongoose bcryptjs jose zod
npm install -D @types/bcryptjs
```
(`jose` aur `zod` already TS types ke saath aate hain, alag se `@types` nahi chahiye.)

## 2. Env vars
`.env.local.example` ko copy karke `.env.local` bana lo aur values fill karo:
- `MONGODB_URI` — Atlas connection string
- `JWT_SECRET` — koi bhi long random string (e.g. `openssl rand -base64 32`)

## 3. File map
```
src/
  lib/
    db/connect.ts        -> mongoose cached connection
    auth/password.ts      -> bcryptjs hash/compare
    auth/jwt.ts            -> jose sign/verify (edge-safe, middleware mein bhi chalta hai)
    auth/cookies.ts        -> cookie name + options (single source of truth)
    auth/getSession.ts     -> server-side helper: cookies() se session nikalta hai
  models/User.ts           -> role enum: "sales-associate" | "branch-head"
  app/api/auth/
    signup/route.ts
    login/route.ts
    logout/route.ts
    me/route.ts            -> GET current session (frontend refresh pe use karo)
  middleware.ts             -> role-based route protection, UI + API dono pe
```

## 4. Role handling
- Signup body: `{ name, email, password, role?, branchHeadId? }`
- `role` na bhejo to default `"sales-associate"` set hota hai (zod default).
- Agar `role: "branch-head"` bhejoge to koi extra field nahi chahiye.
- Agar `role: "sales-associate"` bhejoge aur `branchHeadId` diya, to us branch head
  ke against `reportsTo` set ho jata hai (validate karta hai ki wo id actually kisi
  branch-head ki hai).

## 5. Access control (assessment ka critical requirement)
`middleware.ts` sirf UI routes (`/associate`, `/branch-head`) nahi, balki unke
matching API prefixes (`/api/associate/*`, `/api/branch-head/*`) ko bhi cookie
check karke role verify karta hai — matlab associate seedha
`curl /api/branch-head/...` bhi maare to 403 milega, UI bypass karke bhi nahi ghusega.

Jab tum branch-head/associate ke actual data routes banaoge
(`/api/associate/day`, `/api/branch-head/team` etc.), unhe isi prefix ke andar
rakhna — middleware automatically cover kar lega. Route handler ke andar bhi
`getSession()` se dobara verify kar lena (defense in depth), kyunki middleware
sirf route-level gate hai, row-level ownership check (e.g. "ye day session
isi associate ka hai") tumhe route handler mein khud likhna hoga.

## 6. Cookie
- Name: `raha_token`
- `httpOnly: true` — JS se access nahi hoga (XSS-safe), isliye frontend mein ab
  `localStorage.setItem("token", ...)` ki zaroorat nahi — cookie automatically
  browser se server tak jaati hai.
- `secure` sirf production mein (Vercel pe https hoga to automatically true).
- `sameSite: "lax"` — CSRF ke against reasonable default.

## 7. Frontend changes needed
Tumhare current login/signup pages `localStorage` mein token store kar rahe hain
— ab zaroorat nahi, cookie khud handle ho jayega. Signup page mein ek bug bhi hai:
form `/api/auth/login` ko POST kar raha hai, `/api/auth/signup` ko nahi — aur
`role` field bhej hi nahi raha. Bata do agar signup/login pages bhi fix karne hain.

## 8. Extra packages needed for this round
```bash
npm install -D tsx
```
(`dotenv` already `next` ke saath transitively aata hai, par agar seed script
run karte waqt "Cannot find module 'dotenv'" error aaye to `npm install dotenv`
alag se kar lena.)

`package.json` mein ek script add kar do:
```json
"scripts": {
  "seed": "tsx src/scripts/seed.ts"
}
```

## 9. Associate APIs
| Method | Route | Body / Query |
|---|---|---|
| POST | `/api/associate/day/start` | `{ lat, lng, accuracyMeters? }` |
| POST | `/api/associate/activity` | `{ leadId, notes, location: {...} }` |
| POST | `/api/associate/day/end` | `{ lat, lng, accuracyMeters? }` |
| GET | `/api/associate/day?date=YYYY-MM-DD` | optional, default aaj |

## 10. Branch Head APIs
| Method | Route | Query |
|---|---|---|
| GET | `/api/branch-head/team?date=YYYY-MM-DD` | team activity + per-associate distance |
| GET | `/api/branch-head/search?name=...` | associate search + history |
| GET | `/api/branch-head/export?month=YYYY-MM` | CSV download |

## 11. Shared
| Method | Route | Kaam |
|---|---|---|
| GET | `/api/leads` | Sabhi leads (associate ke dropdown ke liye) |

## 12. Seed script
```bash
npm run seed
```
Banata hai: 1 branch head (`branchhead1@raha.com`), 3 associates
(`associate1/2/3@raha.com`), sab ka password `password123`, 5 leads
(Hyderabad coordinates), aur pichle 3 din ka demo activity har associate
ke liye — monthly export turant test ho sake.

**DESTRUCTIVE**: chalne se pehle Users/Leads/DaySessions/Activities poori
tarah clear kar deta hai. Dev DB pe hi chalana.

## 13. Distance calculation — design note
`src/lib/distance/` ek `DistanceProvider` interface ke against likha gaya
hai (`src/lib/distance/types.ts`). Abhi sirf Haversine (`haversine.ts`)
implement hai — free, no API key, seedha lat/lng ke beech straight-line
distance. Provider `src/lib/distance/index.ts` mein `DISTANCE_PROVIDER`
env var se select hota hai (default `"haversine"`).

**Assumption/limitation (as required by the assessment)**: Haversine
straight-line distance deta hai, actual road distance nahi — isliye fuel
reimbursement figure real driven distance se kam (under-report) hoga. Jab
OSRM/Mapbox/OpenRouteService add karna ho, `distance/index.ts` mein ek naya
`case` aur provider file add karo — routes, models, kuch bhi aur change
nahi karna padega.

Points hamesha **timestamp order** mein sort karke distance nikalte hain
(insertion order nahi) — `DaySession.startTimestamp → Activity.timestamp
(sorted) → DaySession.endTimestamp`.

## 14. Edge cases handled
- Start Day twice → 409 (app-level check + DB partial unique index, race-safe)
- Activity bina Start Day / End Day ke baad → 400 (koi open session nahi)
- End Day bina Start Day ke → 404
- Do consecutive identical GPS points → Haversine formula khud 0 return
  karta hai, koi crash nahi
- Location permission denied / no GPS fix → frontend mein clear error message
  (`getCurrentLocation()` reject karta hai, UI usse catch karke dikhata hai)
- Din midnight cross kare → `dateKey` hamesha `startTimestamp` se derive
  hota hai (IST), poora session lifecycle mein consistent rehta hai
- Day started but never ended → silently "open" reh jaata hai, branch-head
  view mein "open" status ke saath dikhta hai (crash nahi hota)
- Access control → associate sirf apna data dekh sakta hai (`/api/associate/*`
  hamesha `session.userId` se filter karta hai), branch-head sirf apni team
  ka data dekh sakta hai (`reportsTo: session.userId` filter). Middleware +
  har route handler dono jagah enforce hota hai (defense in depth).

## 15. Known gaps (bataane layak cheezein agar interview mein poochein)
- Routing-API-based road distance abhi implement nahi hai (Haversine fallback
  use ho raha hai) — README mein explicitly note kiya gaya hai jaisa
  assessment maangta hai.
- Map view (route ka path dikhana) nahi bana — bonus item hai.
- Basic tests (distance calculation ke liye) abhi nahi likhe — bonus item hai.
- Mobile-responsive polish minimal hai (Tailwind ka default responsive
  behavior use ho raha hai, dedicated mobile layout nahi banaya).
