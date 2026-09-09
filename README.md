# ⚓ Isles of Hexara — 3D Real-Time Maritime Colonization

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Babylon.js](https://img.shields.io/badge/Babylon.js-7.0+-red.svg)](https://www.babylonjs.com/)
[![React](https://img.shields.io/badge/React-18+-cyan.svg)](https://react.dev/)
[![Deployment: Vercel](https://img.shields.io/badge/Deployment-Vercel-black.svg)](https://islesofhexara.vercel.app/)

**Isles of Hexara** is a next-generation, real-time 3D strategy board game inspired by the legendary **Klaus Teuber Catan 25th Anniversary Edition Game Rules & Almanac**. Built from the ground up with high-fidelity 3D graphics (Babylon.js), a deterministic rules engine (`@hexara/game-core`), and a desktop-first responsive UI.

---

## 🌟 Key Features

### 1. Authentic 25th Anniversary Catan Rules Engine
- **Setup Snake Draft**: 2-round initial placement (Round 1 clockwise, Round 2 counter-clockwise). The 2nd settlement automatically awards starting resource cards for each adjacent terrain hex.
- **Strict Distance Rule**: Verified across all 54 intersections and 72 coastal/inland paths.
- **Resource Production**: 2–12 dice rolls distribute resources to all bordering settlements (1) and cities (2), blocked when the robber is on that hex.
- **Robber on 7**: Discard checks for hands with $>7$ cards ($\lfloor \text{cards}/2 \rfloor$), repositioning the 3D Grim Reaper Robber, and card theft.
- **Domestic & Maritime Trading**: 4:1 bank default, 3:1 generic harbors, and 2:1 resource-specific harbors.
- **Building Costs**: Roads ($1\text{W}+1\text{B}$), Settlements ($1\text{W}+1\text{B}+1\text{S}+1\text{G}$), Cities ($3\text{O}+2\text{G}$), Dev Cards ($1\text{O}+1\text{S}+1\text{G}$).
- **Longest Road (5+) & Largest Army (3+)**: Graph DFS evaluation with dynamic 2 VP leadership swings.
- **Autonomous AI Bots**: Intelligent solo play bots (*Candamir*, *Louis*, *William*) with autonomous rolling, robber targeting, city upgrades, and trade responses.

### 2. High-Fidelity 3D Tabletop & Models (Babylon.js)
- **19-Hex Island Grid**: High-resolution procedural terrain tiles (Forest, Hills, Pasture, Fields, Mountains, Desert) and coastal water frames.
- **3D Hero Profile (Tanjiro GLB)**: Full 360° interactive turntable viewer showcase in the Player Profile.
- **3D Robber (Grim Reaper GLB)**: Golden-perspective angled 3D model placed on the active robber hex with dynamic hovering.
- **Perspective & Top-Down Cameras**: Switch seamlessly between cinematic 3D angled perspective and 2D tactical top-down view.
- **Full-Screen App Mode**: Dedicated one-click fullscreen toggle in the upper right corner for immersive phone and laptop gameplay.

### 3. Interactive In-Game Modals Suite
- **📊 Scoreboard & Dice Histogram**: Sums 2 through 12 frequency tracker with actual counts, percentages, official pip dots ($\bullet \bullet \bullet \bullet \bullet$), and theoretical odds comparison.
- **📖 Searchable Catan Almanac**: 25+ categorized sections covering the complete rulebook with live search filters.
- **💬 Chat & Game Chronicle Log**: Real-time player/AI messaging + automated chronicle of all tabletop moves.
- **😀 Express Emoji Reactions**: 12 themed hexagonal emoji buttons with floating tabletop animations.
- **⚙️ Settings & Audio/Visuals**: Audio mixers, board physics, camera sensitivity, and visual quality controls.

### 4. Desktop-First Responsive Retrofit
- **Seamless Adaptability**: Fully responsive across mobile phones (landscape/portrait), tablets, laptops, desktops, and ultrawide displays.
- **Mobile Portrait Orientation Guard**: Displays an orientation overlay during active matches without resetting state or reconnecting sockets.

---

## 🏗️ Architecture & Monorepo Structure

```
ISLES_OF_HEXARA/
├── apps/
│   ├── web/                     # React + Vite + Babylon.js 3D Frontend & UI
│   │   ├── public/models/       # 3D GLB Models (tanjiro.glb, grim_reaper.glb)
│   │   └── src/
│   │       ├── app/             # Lobby & Game Pages
│   │       ├── components/      # HUD, Modals, 3D Canvas, Buttons
│   │       ├── game/            # BabylonGame.ts Engine
│   │       └── store/           # Zustand Game State
│   └── server/                  # Node.js + Socket.IO Multiplayer Backend
└── packages/
    ├── game-core/               # Pure deterministic Catan rules engine & test suite
    ├── protocol/                # Client-server event schemas & payloads
    └── shared/                  # Constants, types, colors, and costs
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm or npm

### Installation & Local Setup

```bash
# Clone the repository
git clone https://github.com/your-username/isles-of-hexara.git
cd isles-of-hexara

# Install dependencies across monorepo
pnpm install

# Run the test suite
npm test

# Start the local development server
npm run dev
```

Visit `http://localhost:3000` (or `http://localhost:3001`) in your browser.

---

## 🧪 Testing

The core rules engine includes automated test suites validating all Catan game mechanics:

```bash
npm test
```

Tests verify:
- Board graph topology & 6/8 token spacing.
- Settlement distance rule & city upgrade piece recycling.
- Finite bank supply & 7-roll robber discards.
- Longest road DFS graph traversal with forks & cycles.
- Development cards, largest army, and victory declarations.

---

## 🌐 Deployment on Vercel

To deploy the web app on Vercel:

1. Link your GitHub repository to Vercel.
2. Set the **Root Directory** to `apps/web`.
3. Set the **Build Command** to:
   ```bash
   pnpm --filter @hexara/shared build && pnpm --filter @hexara/game-core build && pnpm --filter @hexara/protocol build && pnpm --filter @hexara/web build
   ```
4. Set the **Output Directory** to `dist`.
5. Deploy to `https://islesofhexara.vercel.app/`.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
All Catan trademarks and board game concepts are copyright Klaus Teuber / Catan GmbH.
