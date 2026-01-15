# 🗺️ Future Development Roadmap & Technical Specs

This document outlines the planned features, bug fixes, and technical implementation details for the next phase of development.

---

## 1. 🐛 Critical Stability Fixes (Priority: Immediate)

**1. Fix AI Generation Instability**
   - **Issue:** AI email content generation sometimes fails, times out, or throws errors during the creation process.
   - **Location:** `src/inngest/functions/generate-emails.ts`
   - **Tasks:**
     - Add **Retry Logic** to the OpenAI API call (handle 5xx errors or timeouts).
     - Improve **Error Handling**: Catch exceptions gracefully and return a clear error message to the UI (instead of a generic 500).
     - **Timeout Configuration:** Increase the timeout limit for the Inngest function if generation is taking too long.
     - **Prompt Optimization:** Review the system prompt to ensure it doesn't exceed token limits.

---

## 2. 📧 Campaign Sending Logic (Priority: High)

**Current Status:** AI generation exists (but needs fixes), email sending loop is missing.

### Requirements
- Implement a queue-based sending mechanism.
- Ensure unique email content for each company.

### Technical Implementation Guide
1. **Tech Stack:** Use **Resend** (Recommended) or NodeMailer.
2. **UI Updates:**
   - Add "Review & Send" button in `src/app/(dashboard)/campaigns/[id]/page.tsx`.
   - Add a progress bar/status indicator.
3. **Backend Logic (Server Action):**
   - Create `sendCampaign(campaignId)` action.
   - **Step 1:** Fetch recipients and generated content.
   - **Step 2:** Loop & Send:
     ```typescript
     for (const recipient of recipients) {
       // Add try-catch block here to prevent one failure stopping the whole loop
       await resend.emails.send({ ... });
     }
     ```
   - **Step 3:** Update DB status to `'sent'` and increment `emails_sent`.

---

## 3. 📊 Analytics Dashboard (Priority: Medium)

**Current Status:** Static HTML placeholders.

### Implementation Tasks
Wire up the dashboard cards to real DB queries.

1. **Total Campaigns:** Query User DB `campaigns` table.
2. **Total Emails Generated/Sent:** Query `organization_quotas` table.
3. **Total Leads Collected:** Query Production DB `collection_items` table.

---

## 4. ⚙️ Settings Page (Priority: Low)

**Current Status:** "Under Construction" page.

### Tasks
1. **User Profile:** Embed the `<UserProfile />` component from Clerk.
2. **Subscription:** Add a static "Pricing Card" component.

---

## 5. 📱 UI Polish & Quality of Life

1. **Mobile Responsiveness:** Fix table scrolling and sidebar on mobile.
2. **Code Cleanup:** Remove `console.log` and unused imports.

---
*Created by Xiang - January 2026*