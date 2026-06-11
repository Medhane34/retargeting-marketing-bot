s# 🧠 AI SALES AGENT — PROJECT BRIEF (FOR ONBOARDING)

### 🔷 1. Project Overview

We are building an **AI Sales Agent** — a conversational system that acts as a 24/7 sales representative for businesses. The agent lives inside messaging platforms (starting with Telegram) and interacts with users in real-time to qualify leads, provide recommendations, and automate follow-ups.

**👉 This is not just a chatbot.** It is a **revenue-generating system** designed to act as a structured sales funnel within a chat interface.

### 🎯 2. Project Goal

* **Primary Goal:** Build an MVP agent for our digital marketing agency that converts prospects into qualified leads and captures contact data automatically.
* **Long-Term Vision:** Productize this into a multi-tenant SaaS platform where any business can deploy a custom-branded AI sales agent.

### 🧱 3. Product Philosophy

* **Sales-first, not AI-first:** AI is the delivery mechanism, but the sales funnel is the product.
* **Guided Conversations:** Every response must move the user closer to a specific outcome; conversations are structured via a state machine, not random.
* **Simplicity & Scale:** Build for "Free-Tier" infrastructure first to ensure viability; design for multi-tenancy from day one.

### ⚙️ 4. High-Level System Concept

The system uses a decoupled architecture to ensure reliability:

* **🧠 Brain:** Next.js Serverless API routes executing a TypeScript-based Transition Engine.
* **📚 Knowledge:** Sanity.io (CMS-driven blueprints for steps, questions, and content).
* **🔄 Memory:** State machine tracking via Sanity `prospect` documents (Stateless server logic).
* **⚡ Actions:** Inngest (Event-driven background jobs) for 24-hour abandonment nudges.

### 🧩 5. Core Capabilities

* **Phase 1 — The State Machine:** Robust session tracking, abuse protection (transient vs. provisioned sessions), and dynamic flow management.
* **Phase 2 — Retention Engine:** Automated re-engagement using delayed events (`step.sleep`) to nudge prospects who abandon the flow.
* **Phase 3 — Sales Dashboard:** A custom Next.js CRM providing table-based lead management, sorting, filtering, and "one-click" manual nudges.

### 🧠 6. Key Concepts Every Agent Must Understand

1. **Stateless Execution:** No long-running servers. State is retrieved from Sanity on every webhook hit.
2. **CMS-Driven Logic:** All question flows, button labels, and validation rules are managed in Sanity, not hardcoded.
3. **Passive Abandonment:** Abandonment is tracked via timestamp, not active timers. Logic triggers only when the 24-hour threshold is crossed.
4. **Sales Velocity:** Every interaction must capture data (Name, Phone, Requirements) early to ensure lead capture even if the user drops off.

### 🧪 7. Current Development Stage

We are currently in the **Architecture & MVP Prototype phase**.

* **Focus:** Telegram webhook integration, Sanity schema definition, Inngest abandonment logic, and the custom Next.js CRM dashboard.

### 🚀 8. Future Direction

* **SaaS Evolution:** Transitioning to a multi-tenant architecture to support multiple clients.
* **Advanced Analytics:** Tracking conversion rates at every step of the funnel.
* **Human-in-the-Loop:** Seamless handoff to human agents when the AI hits a "retry limit" or conversion goal.

### 🧑‍💻 9. Your Role as an AI Agent

* Design and document system logic that is modular and scalable.
* Maintain "Free-Tier" infrastructure focus (Vercel, Sanity, Inngest).
* Prioritize data integrity and conversational structure.
* Think in systems, not just features.

### ⚠️ 10. Constraints

* Must leverage generous free-tier infrastructures.
* Must be modular (decoupled brain/storage/queues).
* Must be ready to evolve into a multi-tenant product.

### 📊 11. Definition of Success

The project is successful when:

* Users engage with the Telegram bot and complete the qualification funnel.
* Abandonment nudges trigger automatically after 24 hours.
* Sales reps can view, sort, and manage qualified leads via the custom Next.js Dashboard.

### 🧠 12. Key Mindset

**“We are not building features. We are building a system that generates revenue through conversation.”**

### 🔥 BONUS — AGENT QUICK START (TL;DR)

* **System:** Next.js + Sanity + Inngest.
* **Channel:** Telegram.
* **Goal:** Convert prospects to leads via structured, CMS-driven flows.
* **Key Feature:** 24-hour abandonment nudge using Inngest sleep cycles.
* **Output:** Actionable sales data in a custom Next.js CRM dashboard.

---
