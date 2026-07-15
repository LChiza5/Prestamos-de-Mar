# Préstamos de Mar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React + Vite PWA, backed by Firebase (Firestore + Auth), for Oldemar to track clients, loans (with manual 6/8/10% interest), payments, and a standalone loan-payoff calculator — working fully offline on phone/tablet/computer.

**Architecture:** Single-user app (Oldemar only). Firestore holds `clients/{id}/loans/{id}/payments/{id}`. Firestore's built-in offline persistence handles the no-signal requirement, so no manual sync engine is needed. All money math (interest/principal split, payoff simulation) lives in small pure functions that are unit-tested in isolation; Firebase wiring and screens are verified manually in the browser.

**Tech Stack:** React 18, Vite, vite-plugin-pwa, Firebase (Firestore + Auth), html-to-image, Vitest.

---

## Design notes carried over from the spec

- **No `runTransaction` for payments.** Firestore transactions require live connectivity — they do not work offline. Since Oldemar is the only writer, there's no concurrent-write conflict to guard against, so `addPayment` computes the new balance from the already-loaded loan object and writes with a plain `updateDoc`, which Firestore's offline queue does support.
- **Interest never depends on elapsed time.** Every payment splits as `interest = rate% × amount`, `principal = amount − interest`, confirmed by the client with worked numeric examples. "Days since last payment" is shown as a read-only reminder, not used in any calculation.
- Money values carry 2 decimals everywhere (`round2`), to avoid the client misreading a big colón amount.

---

### Task 1: Scaffold the Vite + React project

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/styles/global.css`
- Create: `.gitignore`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "prestamos-de-mar",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "firebase": "^10.12.0",
    "html-to-image": "^1.11.11",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.3.1",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Write `.gitignore`**

```
node_modules
dist
.env
```

- [ ] **Step 3: Write `index.html`**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Préstamos de Mar</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Write `src/styles/global.css`**

```css
:root {
  --bg: #0f172a;
  --card-bg: #1e293b;
  --accent: #0ea5e9;
  --text: #e2e8f0;
  --danger: #ef4444;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
}

.app-nav {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: var(--card-bg);
}

.app-content {
  padding: 16px;
  max-width: 640px;
  margin: 0 auto;
}

.card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.input, select {
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 8px;
  border: 1px solid #334155;
  background: #0f172a;
  color: var(--text);
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  cursor: pointer;
}

.btn-danger {
  background: var(--danger);
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  text-decoration: underline;
  padding: 4px 0;
}

.client-row {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #334155;
  cursor: pointer;
}

.rating-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
}

.rating-green { background: #22c55e; color: #052e12; }
.rating-yellow { background: #facc15; color: #422006; }
.rating-red { background: #ef4444; color: #450a0a; }

.stat {
  display: flex;
  justify-content: space-between;
}

.muted {
  color: #94a3b8;
  font-size: 14px;
}

.error {
  color: var(--danger);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: var(--card-bg);
  padding: 24px;
  border-radius: 12px;
  width: 320px;
}

.receipt-card {
  background: white;
  color: #0f172a;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 16px;
}

.full-screen-center {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 5: Write `src/main.jsx`**

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: `node_modules` created, no errors.

- [ ] **Step 7: Commit**

```bash
git add package.json .gitignore index.html src/main.jsx src/styles/global.css
git commit -m "Scaffold Vite + React project"
```

---

### Task 2: Create the Firebase project and wire it up

This task is where you (Oldemar's developer) create the actual Firebase project under your own Google account. Follow these steps exactly once — they are not code, they're manual actions in the browser.

- [ ] **Step 1: Create the Firebase project**

1. Go to https://console.firebase.google.com/ (logged in with your own Google account).
2. Click **"Agregar proyecto"**.
3. Name it `prestamos-de-mar` (or similar) — this creates a project separate from your parents' Firebase project.
4. Disable Google Analytics for this project (not needed) and finish creation.

- [ ] **Step 2: Enable Firestore**

1. In the left sidebar, click **"Firestore Database"**.
2. Click **"Crear base de datos"**.
3. Choose **"Modo de producción"** (we'll write our own security rules in Task 6).
4. Pick a region close to Costa Rica (e.g. `us-central` or `southamerica-east1`).

- [ ] **Step 3: Enable Email/Password authentication**

1. In the left sidebar, click **"Authentication"** → **"Comenzar"**.
2. Under **"Sign-in method"**, enable **"Correo electrónico/contraseña"**.

- [ ] **Step 4: Create Oldemar's single user account**

1. Still in **Authentication**, go to the **"Users"** tab.
2. Click **"Agregar usuario"**.
3. Email: `oldemar@prestamosdemar.local` (fake domain — Oldemar never sees this, he only ever types a plain username in the app's login screen, per the Login screen built in Task 7).
4. Set a password you'll remember (this is the real password Oldemar will type in).

- [ ] **Step 5: Register a Web App and copy the config**

1. In **Project settings** (gear icon) → **"Tus apps"** → click the **`</>`** (web) icon.
2. Name it `prestamos-de-mar-web`, skip Firebase Hosting for now.
3. Copy the `firebaseConfig` values shown (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

- [ ] **Step 6: Create local env files**

Create `.env.example` (committed, no real values):

```
VITE_API_KEY=
VITE_AUTH_DOMAIN=
VITE_PROJECT_ID=
VITE_STORAGE_BUCKET=
VITE_MESSAGING_SENDER_ID=
VITE_APP_ID=
```

Create `.env` (NOT committed — already in `.gitignore` from Task 1) with the real values copied from Step 5.

- [ ] **Step 7: Write `src/firebase.js`**

```js
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

enableIndexedDbPersistence(db).catch((err) => {
  console.warn("No se pudo activar la persistencia offline:", err.code);
});
```

- [ ] **Step 8: Write `vite.config.js`** (base version, PWA plugin added in Task 15)

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 9: Verify the connection**

Run: `npm run dev`
Open the printed local URL in a browser, open devtools console.
Expected: no Firebase initialization errors in the console.

- [ ] **Step 10: Commit**

```bash
git add .env.example vite.config.js src/firebase.js
git commit -m "Wire up Firebase (Firestore + Auth)"
```

---

### Task 3: Money utilities (TDD)

**Files:**
- Create: `src/utils/money.js`
- Test: `src/utils/money.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// src/utils/money.test.js
import { describe, it, expect } from "vitest";
import { round2, formatMoney, parseMoney } from "./money";

describe("round2", () => {
  it("rounds to 2 decimals", () => {
    expect(round2(10.005)).toBe(10.01);
    expect(round2(10.004)).toBe(10);
  });
});

describe("formatMoney", () => {
  it("formats with thousands separator and 2 decimals", () => {
    expect(formatMoney(1000)).toBe("1.000,00");
    expect(formatMoney(1000000.5)).toBe("1.000.000,50");
  });
});

describe("parseMoney", () => {
  it("parses a plain number string", () => {
    expect(parseMoney("1000.50")).toBe(1000.5);
  });

  it("returns 0 for empty or invalid input", () => {
    expect(parseMoney("")).toBe(0);
    expect(parseMoney("abc")).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — `Cannot find module './money'` (file doesn't exist yet).

- [ ] **Step 3: Write `src/utils/money.js`**

```js
export function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Formatted by hand (not Intl's "es-CR" locale) because ICU data for
// thousands-separator characters varies across Node/browser builds -
// this guarantees the same "1.000,00" output everywhere.
export function formatMoney(value) {
  const [integerPart, decimalPart] = round2(value).toFixed(2).split(".");
  const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withThousands},${decimalPart}`;
}

export function parseMoney(text) {
  if (!text) return 0;
  const normalized = String(text).replace(/[^\d.]/g, "");
  const value = parseFloat(normalized);
  return Number.isNaN(value) ? 0 : round2(value);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS (all `money.test.js` cases green).

- [ ] **Step 5: Commit**

```bash
git add src/utils/money.js src/utils/money.test.js
git commit -m "Add money formatting/parsing utilities"
```

---

### Task 4: Text sanitization utility (TDD)

**Files:**
- Create: `src/utils/sanitize.js`
- Test: `src/utils/sanitize.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/utils/sanitize.test.js
import { describe, it, expect } from "vitest";
import { sanitizeText } from "./sanitize";

describe("sanitizeText", () => {
  it("strips dangerous characters and trims whitespace", () => {
    expect(sanitizeText("  Juan<script> ")).toBe("Juanscript");
    expect(sanitizeText("María José")).toBe("María José");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test`
Expected: FAIL — `Cannot find module './sanitize'`.

- [ ] **Step 3: Write `src/utils/sanitize.js`**

```js
export function sanitizeText(text) {
  return text.replace(/[<>/"'`;()]/g, "").trim();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/sanitize.js src/utils/sanitize.test.js
git commit -m "Add text sanitization utility"
```

---

### Task 5: Interest engine (TDD) — the core business logic

**Files:**
- Create: `src/services/interestEngine.js`
- Test: `src/services/interestEngine.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// src/services/interestEngine.test.js
import { describe, it, expect } from "vitest";
import { splitPayment, simulateLoanPayoff } from "./interestEngine";

describe("splitPayment", () => {
  it("splits a payment into interest and principal by rate percent", () => {
    // Confirmed by the client: of a ₡150,000 payment at 10%, ₡15,000 is
    // interest and the rest (₡135,000) pays down the principal.
    expect(splitPayment(150000, 10)).toEqual({
      interestPortion: 15000,
      principalPortion: 135000,
    });
  });

  it("works the same regardless of how much time has passed", () => {
    // The rule never depends on elapsed days — same formula every time.
    expect(splitPayment(100000, 8)).toEqual({
      interestPortion: 8000,
      principalPortion: 92000,
    });
  });
});

describe("simulateLoanPayoff", () => {
  it("throws for a non-positive monthly payment", () => {
    expect(() => simulateLoanPayoff(1000000, 10, 0)).toThrow();
    expect(() => simulateLoanPayoff(1000000, 10, -500)).toThrow();
  });

  it("computes months to payoff and total interest for an even split", () => {
    // Principal 900,000 at 10%: each 100,000 payment nets 90,000 to principal.
    // 900,000 / 90,000 = exactly 10 months, 10,000 interest each = 100,000 total.
    const result = simulateLoanPayoff(900000, 10, 100000);
    expect(result.months).toBe(10);
    expect(result.totalInterestPaid).toBe(100000);
  });

  it("handles a final partial payment", () => {
    // 950,000 at 10%, 100,000/month: each regular payment nets 90,000 to
    // principal. 10 regular payments cover 900,000, leaving 50,000, which
    // needs one more (smaller, partial) payment - 11 months total.
    const result = simulateLoanPayoff(950000, 10, 100000);
    expect(result.months).toBe(11);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — `Cannot find module './interestEngine'`.

- [ ] **Step 3: Write `src/services/interestEngine.js`**

```js
import { round2 } from "../utils/money";

export function splitPayment(amount, ratePercent) {
  const interestPortion = round2(amount * (ratePercent / 100));
  const principalPortion = round2(amount - interestPortion);
  return { interestPortion, principalPortion };
}

export function simulateLoanPayoff(principal, ratePercent, monthlyPayment) {
  if (monthlyPayment <= 0) {
    throw new Error("La cuota mensual debe ser un número positivo");
  }

  const rate = ratePercent / 100;
  let balance = round2(principal);
  let months = 0;
  let totalInterestPaid = 0;

  while (balance > 0) {
    const principalPortionOfFullPayment = round2(monthlyPayment * (1 - rate));
    const isFinalPayment = principalPortionOfFullPayment >= balance;
    const payment = isFinalPayment ? round2(balance / (1 - rate)) : monthlyPayment;

    const { interestPortion, principalPortion } = splitPayment(payment, ratePercent);
    totalInterestPaid = round2(totalInterestPaid + interestPortion);
    balance = round2(balance - principalPortion);
    months += 1;
  }

  return { months, totalInterestPaid };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS (all `interestEngine.test.js` cases green).

- [ ] **Step 5: Commit**

```bash
git add src/services/interestEngine.js src/services/interestEngine.test.js
git commit -m "Add interest engine: payment split and payoff simulator"
```

---

### Task 6: Firestore security rules

**Files:**
- Create: `firestore.rules`

- [ ] **Step 1: Write `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOldemar() {
      return request.auth != null
        && request.auth.token.email == "oldemar@prestamosdemar.local";
    }

    match /clients/{clientId} {
      allow read, write: if isOldemar();

      match /loans/{loanId} {
        allow read, write: if isOldemar();

        match /payments/{paymentId} {
          allow read, write: if isOldemar();
        }
      }
    }
  }
}
```

- [ ] **Step 2: Publish the rules**

1. Firebase Console → Firestore Database → **"Reglas"** tab.
2. Paste the contents of `firestore.rules` and click **"Publicar"**.

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "Add Firestore security rules restricting access to Oldemar's account"
```

---

### Task 7: Auth hook and Login screen

**Files:**
- Create: `src/hooks/useAuth.js`
- Create: `src/components/Login/LoginScreen.jsx`
- Create: `src/components/Login/LoginScreen.css`

- [ ] **Step 1: Write `src/hooks/useAuth.js`**

```js
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (username, password) => {
    const email = `${username.toLowerCase()}@prestamosdemar.local`;
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => signOut(auth);

  return { user, loading, login, logout };
}
```

- [ ] **Step 2: Write `src/components/Login/LoginScreen.css`**

```css
.login-container {
  display: flex;
  min-height: 100vh;
}

.login-side {
  flex: 1;
  background-image: url("/bg-login.jpg");
  background-size: cover;
  background-position: center;
}

.login-box {
  width: 360px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  background: #0f172a;
}

@media (max-width: 700px) {
  .login-side {
    display: none;
  }
}
```

- [ ] **Step 3: Write `src/components/Login/LoginScreen.jsx`**

```jsx
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import "./LoginScreen.css";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login(username, password);
    } catch (error) {
      alert("Credenciales incorrectas");
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-side" />
      <div className="login-box">
        <h1>Préstamos de Mar</h1>
        <input
          className="input"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn" onClick={handleLogin}>
          Entrar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open the app.
Expected: login screen renders; entering the real username/password from Task 2 Step 4 logs in (you'll see a blank page since `App.jsx` doesn't route yet — that's expected, wired up in Task 14).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAuth.js src/components/Login
git commit -m "Add auth hook and login screen"
```

---

### Task 8: Clients service and screen

**Files:**
- Create: `src/services/clientsService.js`
- Create: `src/components/Clients/RatingBadge.jsx`
- Create: `src/components/Clients/ClientsListScreen.jsx`

- [ ] **Step 1: Write `src/services/clientsService.js`**

```js
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const clientsCol = collection(db, "clients");

export async function createClient(name, rating) {
  const docRef = await addDoc(clientsCol, {
    name,
    rating,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function listClients() {
  const q = query(clientsCol, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateClientRating(clientId, rating) {
  await updateDoc(doc(db, "clients", clientId), { rating });
}
```

- [ ] **Step 2: Write `src/components/Clients/RatingBadge.jsx`**

```jsx
const LABELS = { green: "Bueno", yellow: "Más o menos", red: "Malo" };

export default function RatingBadge({ rating }) {
  return (
    <span className={`rating-badge rating-${rating}`}>{LABELS[rating]}</span>
  );
}
```

- [ ] **Step 3: Write `src/components/Clients/ClientsListScreen.jsx`**

```jsx
import { useEffect, useState } from "react";
import { createClient, listClients } from "../../services/clientsService";
import { sanitizeText } from "../../utils/sanitize";
import RatingBadge from "./RatingBadge";

export default function ClientsListScreen({ onSelectClient }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [rating, setRating] = useState("green");
  const [loadingData, setLoadingData] = useState(true);

  const refresh = () => listClients().then(setClients);

  useEffect(() => {
    refresh().finally(() => setLoadingData(false));
  }, []);

  const handleAddClient = async () => {
    const safeName = sanitizeText(name);
    if (!safeName) {
      alert("Escribe un nombre válido");
      return;
    }
    await createClient(safeName, rating);
    setName("");
    setRating("green");
    refresh();
  };

  if (loadingData) {
    return <p>Cargando clientes...</p>;
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="card">
        <h3>Agregar cliente</h3>
        <input
          className="input"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="green">Bueno</option>
          <option value="yellow">Más o menos</option>
          <option value="red">Malo</option>
        </select>
        <button className="btn" onClick={handleAddClient}>
          Agregar cliente
        </button>
      </div>

      <input
        className="input"
        placeholder="Buscar cliente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card">
        <h3>Clientes ({filtered.length})</h3>
        {filtered.map((client) => (
          <div
            key={client.id}
            className="client-row"
            onClick={() => onSelectClient(client)}
          >
            <span>{client.name}</span>
            <RatingBadge rating={client.rating} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/services/clientsService.js src/components/Clients
git commit -m "Add clients service and clients list screen"
```

---

### Task 9: Loans service

**Files:**
- Create: `src/services/loansService.js`

- [ ] **Step 1: Write `src/services/loansService.js`**

```js
import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { splitPayment } from "./interestEngine";
import { round2 } from "../utils/money";

function loansCol(clientId) {
  return collection(db, "clients", clientId, "loans");
}

function paymentsCol(clientId, loanId) {
  return collection(db, "clients", clientId, "loans", loanId, "payments");
}

export async function createLoan(clientId, principal, rate) {
  const docRef = await addDoc(loansCol(clientId), {
    principal: round2(principal),
    rate,
    remainingBalance: round2(principal),
    totalInterestEarned: 0,
    status: "active",
    startDate: serverTimestamp(),
  });
  return docRef.id;
}

export async function listLoansForClient(clientId) {
  const q = query(loansCol(clientId), orderBy("startDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listAllLoans() {
  const snapshot = await getDocs(collectionGroup(db, "loans"));
  return snapshot.docs.map((d) => ({
    id: d.id,
    clientId: d.ref.parent.parent.id,
    ...d.data(),
  }));
}

// Firestore transactions require live connectivity, but registering an abono
// must keep working offline (rural signal gaps). So the new balance is
// computed from the already-loaded `currentLoan` object and written with a
// plain updateDoc, which Firestore's offline write queue does support.
export async function addPayment(clientId, loanId, amount, currentLoan) {
  if (amount > currentLoan.remainingBalance) {
    throw new Error("El abono no puede ser mayor a la deuda pendiente");
  }

  const { interestPortion, principalPortion } = splitPayment(
    amount,
    currentLoan.rate
  );
  const newBalance = round2(currentLoan.remainingBalance - principalPortion);
  const newTotalInterest = round2(
    currentLoan.totalInterestEarned + interestPortion
  );

  const loanRef = doc(db, "clients", clientId, "loans", loanId);
  await updateDoc(loanRef, {
    remainingBalance: newBalance,
    totalInterestEarned: newTotalInterest,
    status: newBalance <= 0 ? "paid" : "active",
  });

  await addDoc(paymentsCol(clientId, loanId), {
    amount: round2(amount),
    interestPortion,
    principalPortion,
    date: serverTimestamp(),
  });

  return { interestPortion, principalPortion, newBalance };
}

export async function listPaymentsForLoan(clientId, loanId) {
  const q = query(paymentsCol(clientId, loanId), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/loansService.js
git commit -m "Add loans service: create loan, register payment, list loans"
```

---

### Task 10: Client detail screen (loans, add loan, register payment, history)

**Files:**
- Create: `src/components/ClientDetail/AddLoanForm.jsx`
- Create: `src/components/ClientDetail/LoanCard.jsx`
- Create: `src/components/ClientDetail/ClientDetailScreen.jsx`

- [ ] **Step 1: Write `src/components/ClientDetail/AddLoanForm.jsx`**

```jsx
import { useState } from "react";
import { parseMoney } from "../../utils/money";

export default function AddLoanForm({ onCreateLoan }) {
  const [amountText, setAmountText] = useState("");
  const [rate, setRate] = useState(6);

  const handleSubmit = async () => {
    const principal = parseMoney(amountText);
    if (principal <= 0) {
      alert("Ingresa un monto válido");
      return;
    }
    await onCreateLoan(principal, rate);
    setAmountText("");
    setRate(6);
  };

  return (
    <div className="card">
      <h3>Nuevo préstamo</h3>
      <input
        className="input"
        placeholder="Monto (ej: 100000.00)"
        value={amountText}
        onChange={(e) => setAmountText(e.target.value)}
      />
      <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
        <option value={6}>6%</option>
        <option value={8}>8%</option>
        <option value={10}>10%</option>
      </select>
      <button className="btn" onClick={handleSubmit}>
        Crear préstamo
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/ClientDetail/LoanCard.jsx`**

```jsx
import { useEffect, useState } from "react";
import { addPayment, listPaymentsForLoan } from "../../services/loansService";
import { formatMoney, parseMoney } from "../../utils/money";

function daysSince(dateValue) {
  if (!dateValue) return null;
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export default function LoanCard({ clientId, loan, onPaymentRegistered }) {
  const [payments, setPayments] = useState([]);
  const [amountText, setAmountText] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const refreshPayments = () =>
    listPaymentsForLoan(clientId, loan.id).then(setPayments);

  useEffect(() => {
    if (showHistory) refreshPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory]);

  const lastPaymentDate = payments[0]?.date ?? loan.startDate;

  const handlePay = async () => {
    const amount = parseMoney(amountText);
    if (amount <= 0) {
      alert("Ingresa un monto válido");
      return;
    }
    try {
      await addPayment(clientId, loan.id, amount, loan);
      setAmountText("");
      if (showHistory) refreshPayments();
      onPaymentRegistered();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="card">
      <p>
        <strong>Préstamo:</strong> ₡{formatMoney(loan.principal)} al {loan.rate}%
      </p>
      <p>
        <strong>Deuda actual:</strong> ₡{formatMoney(loan.remainingBalance)} —{" "}
        {loan.status === "paid" ? "Pagado" : "Activo"}
      </p>
      <p className="muted">
        Días desde el último abono: {daysSince(lastPaymentDate) ?? "N/A"}
      </p>

      {loan.status === "active" && (
        <div>
          <input
            className="input"
            placeholder="Monto a abonar"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
          />
          <button className="btn" onClick={handlePay}>
            Registrar abono
          </button>
        </div>
      )}

      <button className="link-btn" onClick={() => setShowHistory((v) => !v)}>
        {showHistory ? "Ocultar historial" : "Ver historial de abonos"}
      </button>

      {showHistory && (
        <div>
          {payments.length === 0 && <p>No hay abonos aún</p>}
          {payments.map((p) => (
            <div key={p.id} className="muted">
              ₡{formatMoney(p.amount)} (interés ₡{formatMoney(p.interestPortion)},
              capital ₡{formatMoney(p.principalPortion)})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/ClientDetail/ClientDetailScreen.jsx`**

```jsx
import { useEffect, useState } from "react";
import { createLoan, listLoansForClient } from "../../services/loansService";
import AddLoanForm from "./AddLoanForm";
import LoanCard from "./LoanCard";

export default function ClientDetailScreen({ clientId, clientName }) {
  const [loans, setLoans] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const refresh = () => listLoansForClient(clientId).then(setLoans);

  useEffect(() => {
    refresh().finally(() => setLoadingData(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const handleCreateLoan = async (principal, rate) => {
    await createLoan(clientId, principal, rate);
    refresh();
  };

  if (loadingData) {
    return <p>Cargando préstamos...</p>;
  }

  return (
    <div>
      <h2>{clientName}</h2>

      <AddLoanForm onCreateLoan={handleCreateLoan} />

      {loans.map((loan) => (
        <LoanCard
          key={loan.id}
          clientId={clientId}
          loan={loan}
          onPaymentRegistered={refresh}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ClientDetail
git commit -m "Add client detail screen: loans, add loan, register payment"
```

---

### Task 11: Receipt generator ("comprobante")

**Files:**
- Create: `src/components/Receipt/generateReceiptImage.js`
- Create: `src/components/Receipt/ReceiptModal.jsx`
- Modify: `src/components/ClientDetail/ClientDetailScreen.jsx`

- [ ] **Step 1: Write `src/components/Receipt/generateReceiptImage.js`**

```js
import { toPng } from "html-to-image";

export async function shareOrDownloadImage(node, filename) {
  const dataUrl = await toPng(node);

  if (navigator.canShare && navigator.share) {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
```

- [ ] **Step 2: Write `src/components/Receipt/ReceiptModal.jsx`**

```jsx
import { useRef } from "react";
import { formatMoney } from "../../utils/money";
import { shareOrDownloadImage } from "./generateReceiptImage";

export default function ReceiptModal({ clientName, totalDebt, onClose }) {
  const cardRef = useRef(null);

  const handleShare = async () => {
    await shareOrDownloadImage(cardRef.current, `comprobante-${clientName}.png`);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="receipt-card" ref={cardRef}>
          <h3>Préstamos de Mar</h3>
          <p>{clientName}</p>
          <p>Deuda actual: ₡{formatMoney(totalDebt)}</p>
        </div>

        <button className="btn" onClick={handleShare}>
          Compartir comprobante
        </button>
        <button className="btn btn-danger" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire the receipt button into `ClientDetailScreen.jsx`**

Modify `src/components/ClientDetail/ClientDetailScreen.jsx`:

```jsx
import { useEffect, useState } from "react";
import { createLoan, listLoansForClient } from "../../services/loansService";
import AddLoanForm from "./AddLoanForm";
import LoanCard from "./LoanCard";
import ReceiptModal from "../Receipt/ReceiptModal";

export default function ClientDetailScreen({ clientId, clientName }) {
  const [loans, setLoans] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);

  const refresh = () => listLoansForClient(clientId).then(setLoans);

  useEffect(() => {
    refresh().finally(() => setLoadingData(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const handleCreateLoan = async (principal, rate) => {
    await createLoan(clientId, principal, rate);
    refresh();
  };

  if (loadingData) {
    return <p>Cargando préstamos...</p>;
  }

  const totalDebt = loans
    .filter((loan) => loan.status === "active")
    .reduce((sum, loan) => sum + loan.remainingBalance, 0);

  return (
    <div>
      <h2>{clientName}</h2>
      <button className="btn" onClick={() => setShowReceipt(true)}>
        Generar comprobante
      </button>

      <AddLoanForm onCreateLoan={handleCreateLoan} />

      {loans.map((loan) => (
        <LoanCard
          key={loan.id}
          clientId={clientId}
          loan={loan}
          onPaymentRegistered={refresh}
        />
      ))}

      {showReceipt && (
        <ReceiptModal
          clientName={clientName}
          totalDebt={totalDebt}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open a client with an active loan, click "Generar comprobante".
Expected: a card with name and debt renders; "Compartir comprobante" downloads a PNG (desktop) or opens the native share sheet (mobile browser).

- [ ] **Step 5: Commit**

```bash
git add src/components/Receipt src/components/ClientDetail/ClientDetailScreen.jsx
git commit -m "Add shareable receipt generator"
```

---

### Task 12: Dashboard screen

**Files:**
- Create: `src/components/Dashboard/DashboardScreen.jsx`

- [ ] **Step 1: Write `src/components/Dashboard/DashboardScreen.jsx`**

```jsx
import { useEffect, useState } from "react";
import { listAllLoans } from "../../services/loansService";
import { formatMoney } from "../../utils/money";

export default function DashboardScreen() {
  const [loans, setLoans] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    listAllLoans()
      .then(setLoans)
      .finally(() => setLoadingData(false));
  }, []);

  if (loadingData) {
    return <p>Cargando resumen...</p>;
  }

  const totalActiveDebt = loans
    .filter((loan) => loan.status === "active")
    .reduce((sum, loan) => sum + loan.remainingBalance, 0);

  const totalInterestEarned = loans.reduce(
    (sum, loan) => sum + loan.totalInterestEarned,
    0
  );

  return (
    <div className="card">
      <h2>Resumen general</h2>
      <p className="stat">
        <span>Dinero prestado activo:</span>
        <strong>₡{formatMoney(totalActiveDebt)}</strong>
      </p>
      <p className="stat">
        <span>Interés total ganado:</span>
        <strong>₡{formatMoney(totalInterestEarned)}</strong>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Dashboard
git commit -m "Add dashboard screen with aggregate totals"
```

---

### Task 13: Loan simulator screen

**Files:**
- Create: `src/components/Simulator/SimulatorScreen.jsx`

- [ ] **Step 1: Write `src/components/Simulator/SimulatorScreen.jsx`**

```jsx
import { useState } from "react";
import { simulateLoanPayoff } from "../../services/interestEngine";
import { parseMoney, formatMoney } from "../../utils/money";

export default function SimulatorScreen() {
  const [amountText, setAmountText] = useState("");
  const [rate, setRate] = useState(6);
  const [paymentText, setPaymentText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCalculate = () => {
    const principal = parseMoney(amountText);
    const monthlyPayment = parseMoney(paymentText);

    if (principal <= 0 || monthlyPayment <= 0) {
      setError("Ingresa un monto de préstamo y una cuota mensual válidos");
      setResult(null);
      return;
    }

    setError("");
    setResult(simulateLoanPayoff(principal, rate, monthlyPayment));
  };

  return (
    <div className="card">
      <h2>Simulador de cuotas</h2>
      <p className="muted">
        Esta calculadora es solo una estimación, no afecta ningún dato real.
      </p>

      <input
        className="input"
        placeholder="Monto del préstamo"
        value={amountText}
        onChange={(e) => setAmountText(e.target.value)}
      />
      <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
        <option value={6}>6%</option>
        <option value={8}>8%</option>
        <option value={10}>10%</option>
      </select>
      <input
        className="input"
        placeholder="Cuota mensual hipotética"
        value={paymentText}
        onChange={(e) => setPaymentText(e.target.value)}
      />
      <button className="btn" onClick={handleCalculate}>
        Calcular
      </button>

      {error && <p className="error">{error}</p>}

      {result && (
        <div>
          <p>Meses estimados para pagar: {result.months}</p>
          <p>Interés total estimado: ₡{formatMoney(result.totalInterestPaid)}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Simulator
git commit -m "Add standalone loan payoff simulator screen"
```

---

### Task 14: App shell — wire login gating and navigation together

**Files:**
- Modify: `src/App.jsx` (create if not present)

- [ ] **Step 1: Write `src/App.jsx`**

```jsx
import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import LoginScreen from "./components/Login/LoginScreen";
import DashboardScreen from "./components/Dashboard/DashboardScreen";
import ClientsListScreen from "./components/Clients/ClientsListScreen";
import ClientDetailScreen from "./components/ClientDetail/ClientDetailScreen";
import SimulatorScreen from "./components/Simulator/SimulatorScreen";

export default function App() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState("dashboard");
  const [selectedClient, setSelectedClient] = useState(null);

  if (loading) {
    return <div className="full-screen-center">Cargando...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  const openClient = (client) => {
    setSelectedClient(client);
    setView("clientDetail");
  };

  return (
    <div>
      <nav className="app-nav">
        <button className="btn" onClick={() => setView("dashboard")}>
          Resumen
        </button>
        <button className="btn" onClick={() => setView("clients")}>
          Clientes
        </button>
        <button className="btn" onClick={() => setView("simulator")}>
          Simulador
        </button>
        <button className="btn btn-danger" onClick={logout}>
          Cerrar sesión
        </button>
      </nav>

      <main className="app-content">
        {view === "dashboard" && <DashboardScreen />}
        {view === "clients" && <ClientsListScreen onSelectClient={openClient} />}
        {view === "clientDetail" && selectedClient && (
          <ClientDetailScreen
            clientId={selectedClient.id}
            clientName={selectedClient.name}
          />
        )}
        {view === "simulator" && <SimulatorScreen />}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`.
Expected: logging in with Oldemar's credentials (Task 2 Step 4) shows the nav bar and Dashboard; clicking "Clientes" lets you add a client and open its detail; clicking a client goes to `ClientDetailScreen`; "Simulador" and "Resumen" both load without console errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "Wire up login gating and screen navigation"
```

---

### Task 15: PWA manifest, icon, and offline verification

**Files:**
- Create: `public/icon.svg`
- Modify: `vite.config.js`

- [ ] **Step 1: Write `public/icon.svg`** (placeholder — swap for Oldemar's real branding once ready, see spec's "Fuera de alcance")

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="16" fill="#0f172a"/>
  <path d="M0 65 Q25 55 50 65 T100 65 V100 H0 Z" fill="#0ea5e9"/>
  <circle cx="50" cy="35" r="18" fill="#facc15"/>
  <text x="50" y="41" font-size="18" text-anchor="middle" fill="#78350f" font-family="Arial, sans-serif">₡</text>
</svg>
```

- [ ] **Step 2: Update `vite.config.js` to add the PWA plugin**

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Préstamos de Mar",
        short_name: "Préstamos de Mar",
        description: "Control de préstamos y clientes",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    }),
  ],
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 3: Verify the production build and offline behavior**

Run: `npm run build && npm run preview`
Open the printed local URL in a browser.
Expected: devtools → Application tab shows a registered service worker; devtools → Network tab, set to "Offline", then reload the page — the app still loads (shell + previously-viewed cached data) instead of showing a browser error page.

- [ ] **Step 4: Commit**

```bash
git add public/icon.svg vite.config.js
git commit -m "Add PWA manifest, placeholder icon, and offline support"
```

---

### Task 16: Manual end-to-end verification checklist

No new files — this is a final pass through the real user flow before handing off to Oldemar.

- [ ] **Step 1: Multi-loan client flow**

1. Create a client "Juan Pérez", rating verde.
2. Add two loans: ₡500,000 at 6%, and ₡300,000 at 10%.
3. Register a ₡50,000 payment against the first loan.
4. Expected: first loan's `remainingBalance` drops by `50000 - 50000*0.06 = 47000` → shows ₡453,000.00; second loan is untouched.

- [ ] **Step 2: Loan payoff**

1. On a small test loan (e.g. ₡10,000 at 6%), keep registering payments until `remainingBalance` reaches ₡0.00.
2. Expected: the loan's status flips to "Pagado" and the payment form disappears (per the `loan.status === "active"` check in `LoanCard.jsx`).

- [ ] **Step 3: Offline write + resync**

1. With the app open and a client loaded, switch devtools Network to "Offline".
2. Register a payment.
3. Expected: UI updates immediately (optimistic local write from Firestore's cache).
4. Switch Network back to "Online".
5. Refresh the Firebase console's Firestore data view.
6. Expected: the offline payment appears in Firestore once synced.

- [ ] **Step 4: Dashboard totals**

1. Open "Resumen" after Steps 1–2.
2. Expected: "Dinero prestado activo" matches the sum of all active loans' `remainingBalance`; "Interés total ganado" matches the sum of all `totalInterestEarned`.

- [ ] **Step 5: Simulator sanity check**

1. Open "Simulador", enter monto 900000, tasa 10%, cuota 100000.
2. Expected: "Meses estimados para pagar: 10", "Interés total estimado: ₡100.000,00" (matches the `simulateLoanPayoff` unit test in Task 5).

- [ ] **Step 6: Commit** (only if this pass required fixes)

```bash
git add -A
git commit -m "Fix issues found during end-to-end verification"
```
