# Supersheets - Real-Time Collaborative Spreadsheet

Supersheets is a lightweight, real-time collaborative spreadsheet built for the Trademarkia Frontend Engineering Assignment. It mimics the core functionality of Google Sheets, heavily prioritizing real-time sync correctness, strict typing, and scalable conflict handling.

## 🚀 Live Demo
**https://trademark-pi.vercel.app/**

## 🛠 Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS + Lucide Icons
- **Backend/State:** Firebase Realtime Database
- **Authentication:** Firebase Auth (Google Sign-In)

## ✨ Core Features & Functionality
- **Document Dashboard:** Secure user authentication (Google Auth) with a persistent list of created spreadsheets, their owners, and last modified dates.
- **The Editor Grid:** A scrollable, fully editable grid with row/column headers. 
- **Formula Engine:** Custom recursive formula parser supporting `=SUM()` and basic arithmetic across cell references (e.g., `=A1+B2/2`). Includes **cycle detection** to prevent circular dependency crashes.
- **Real-Time Sync:** Instantaneous data synchronization across multiple concurrent client sessions.
- **Presence Indicators:** Top-bar avatars show active collaborators. The grid features real-time colored border highlights indicating exactly which cell another user is currently editing.
- **Write-State Indicator:** A header checkmark confirms when local changes have been successfully committed to the database.

## 🎁 Bonus Features Implemented
- **Cell Formatting:** Real-time synced Bold, Italic, and Text Color formatting parameters applied per individual cell.
- **Keyboard Navigation:** Native spreadsheet feel using Arrow keys, Tab, and Enter to traverse the grid.
- **Export to CSV:** Client-side generation of `.csv` files that dynamically bounds the used grid space and exports the *evaluated* results of formulas.

---

## 🏗 Architecture & Design Decisions

As per the assignment guidelines, this project prioritizes "how decisions are made" over raw feature depth.

### 1. State Management & Contention Handling
The most critical architectural decision revolves around the Firebase data model. Instead of storing the entire spreadsheet as a monolithic JSON block, data is stored at a highly granular, **per-cell level** (`/documents/{id}/cells/{row}_{col}`). 

**Why?**
- **Zero Contention:** If User A edits `A1` and User B edits `B2`, their network requests never conflict.
- **Conflict Resolution:** If both users edit `A1` at the exact same millisecond, Firebase's internal queue naturally resolves it using a scalable "last-write-wins" approach without needing complex Operational Transformation (OT) or CRDT algorithms for a lightweight demo.
- **Performance:** Appending/updating a single node is drastically faster and costs less bandwidth than transmitting the entire spreadsheet state on every keystroke.

### 2. What I Chose *Not* to Build
I intentionally opted **not** to build drag-and-drop column/row resizing or reordering.
- **Justification:** Manipulating the DOM layout dynamically introduces significant complexity and lag when syncing across remote clients, as every trailing cell's position must shift. By keeping the grid static, I guaranteed `O(1)` cell lookup and zero syncing delays, prioritizing the 'stripped to its bones' collaborative real-time requirement.

### 3. Client-Side Formula Evaluation
The formula parsing and CSV export are executed entirely on the client side. By leveraging the React hooks that subscribe to the RTDB, the client already possesses the full state of the sheet in memory. Evaluating formulas locally prevents unnecessary backend server load or Cloud Function cold starts.

---

## 💻 Local Development Setup

To run this project locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YourUsername/trademark.git
   cd trademark
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Firebase configuration details:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
   NEXT_PUBLIC_FIREBASE_DATABASE_URL="your-database-url"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the App:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.
