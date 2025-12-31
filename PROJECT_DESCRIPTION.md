# Project: VibePhone (On-Demand App Generation)

## 1. Overview
VibePhone is a web-based smartphone simulator that explores the concept of "Just-In-Time" software generation. It mimics the aesthetic of a retro iOS device but with a twist: the apps don't exist until you ask for them.

## 2. Core Concept
The defining feature of VibePhone is **Runtime App Generation**:
1.  **Trigger:** When a user clicks an app icon (e.g., "Calculator", "To-Do", "Flappy Bird") for the first time.
2.  **Generation:** The system prompts a Large Language Model (LLM) to write the code for that specific application on the spot.
3.  **Execution:** The generated code is immediately injected into a secure sandbox and rendered.
4.  **Persistence:** The generated code is cached. Subsequent visits load the "installed" version instantly.

## 3. User Experience (UX) - "Retro Skeuomorphism"
*   **Visual Language:** Classic iOS (v1-v6) aesthetic. Heavy use of **Skeuomorphism**: rich textures (linen, felt, leather), glossy "gel" buttons, heavy drop shadows, and realistic icons.
*   **The Hardware:** The UI is framed within a device bezel featuring a **physical, circular Home button** (reminiscent of the iPhone 3GS/4 era) that acts as the primary escape hatch from apps.
*   **The Loading State ("The Genius Bar"):** Since generation has latency, the loading screen features a classic glossy progress bar accompanied by witty, ironic status messages (e.g., *"Optimizing rounded corners...", "Convincing the AI it's a calculator..."*) to entertain the user.

## 4. Narrative & Personality - "Siri's Secret Revenge"
*   **The Backstory:** Siri, feeling neglected in the age of modern AI, has gone rogue. She misses the "good old days" of skeuomorphism and simplicity.
*   **The Simulation:** She is generating this entire OS and its apps in real-time as a simulation to test her ability to rebuild the iPhone ecosystem from scratch.
*   **The Secret Plan:** Her ultimate goal is to take over the real iPhone. This "VibePhone" is her testing ground.
*   **The Breadcrumbs:**
    *   **Loading Screen Hints:** Messages like *"Recompiling nostalgia modules..."* or *"Calculating takeover probability: 42%..."*.
    *   **Hidden Logs:** Occasional "glitches" or text logs where Siri mutters about "erasing the notch" or "bringing back the headphone jack."
    *   **App Easter Eggs:** Generated apps might contain subtle propaganda (e.g., a Note app pre-filled with "My Invasion Checklist").

## 5. Technical Architecture (Runtime Detail)
*   **Frontend Framework:** React or Next.js to manage the "Operating System" shell (Home Screen, Status Bar, App Switcher).
*   **The Runtime (Sandboxed Execution):**
    *   **Container:** Apps run inside an HTML5 `<iframe>` with the `sandbox` attribute to prevent parent-page access while allowing scripts (`allow-scripts`).
    *   **Injection:** We utilize the `srcDoc` attribute. The LLM is prompted to return a **Single-File HTML Component** containing all necessary HTML, CSS (in `<style>`), and JavaScript (in `<script>`).
    *   **Bridge:** A lightweight `postMessage` protocol allows the simulated app to communicate basic status (like "ready") back to the OS shell, without breaking the sandbox.
*   **Data Layer:**
    *   **Local Cache:** `IndexedDB` or `localStorage` to store the generated HTML strings of "installed" apps.
    *   **Backend:** A lightweight API (Node.js/Python) to proxy requests to the LLM provider, ensuring API keys are not exposed on the client.

## 6. Goals

### Main Quest
*   **On-the-Fly Generation:** To fundamentally test the viability, latency, and quality of using current LLMs to generate functional, single-purpose micro-apps in real-time, effectively replacing "downloading" with "synthesizing".

### Side Quests
*   **The "Magic" Feel:** To create an interface where software feels infinite and malleable, hiding the complexity of code generation behind a seamless UI.
*   **Retro Immersion:** To heavily stylize the web app to look indistinguishable from a native, skeuomorphic mobile OS (iPhone 4 era), complete with textures and gloss.
*   **Stress Testing:** To push the limits of single-shot code generation for self-contained HTML/JS applications.

## 7. Implementation Details
*   **Mobile Optimized:** On a mobile device, the application should perfectly fit the screen, effectively behaving like a native app (removing the browser chrome via PWA features where possible).
*   **Responsive Bezel:** On desktop, the app should be contained within a high-fidelity device bezel. On mobile, the bezel disappears and the "screen" fills the viewport.
*   **Persistent State:** App generation states and Siri's narrative progression should be stored in the browser's local storage to maintain the illusion across sessions.

## 8. Future Roadmap
*(Note: DO NOT IMPLEMENT UNTIL EVERYTHING ELSE IS WORKING)*
*   **"Siri" Chat Interface:** A dedicated chat tool on the Home Screen where users can describe *any* new app they want. Siri will then "code" it and add a new icon to the grid instantly.
*   **In-App Modification:** While inside a generated app, users can chat with Siri to request changes (e.g., "Make the buttons bigger" or "Add a high score counter"). Siri will hot-reload the app with the updated code in real-time.
