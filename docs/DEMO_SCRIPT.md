# BloodBuddy: 5-Minute Hackathon Demo Script

> **Judge-Ready Presentation & Talking Points**  
> *Target Duration: 5 minutes | Theme: Best Open-Source AI Project*

---

## Quick Reference for Presenters

| Role | Demo Account Email | Password | Key Action in Demo |
|------|--------------------|----------|-------------------|
| **Requester** | `requester@demo.bloodbuddy` | `demo123` | Upload requisition document, verify AI fields, send invite |
| **Donor (O+)** | `donor1@demo.bloodbuddy` | `demo123` | Review invitation, grant consent, coordinate donation |
| **Admin** | `admin@demo.bloodbuddy` | `demo123` | Showcase stats & reset demo environment |

- **Frontend URL**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Sample Document**: `sample/sample_blood_request.txt` (or `frontend/public/sample_blood_request.txt`)

---

## 5-Minute Presentation Timeline

```
[0:00 - 0:45] Hook & Problem  ──▶ [0:45 - 2:15] Requester Flow & AI Extraction
                                                      │
[4:15 - 5:00] Q&A & Wrap-Up   ◀── [3:30 - 4:15] Tracking & Admin ◀── [2:15 - 3:30] Donor Match & Consent
```

---

### Phase 1: The Problem & Vision (0:00 – 0:45)

**Action:** Open browser on the landing page at [http://localhost:5173](http://localhost:5173).

**Talking Points:**
> *"Judges, imagine a family member is rushed into surgery requiring rare blood units. Today, families scramble across chaotic WhatsApp groups, make frantic calls to outdated lists, and blast donor phone numbers publicly online, leading to privacy violations, spam, and fatal delays.*
>
> *We built **BloodBuddy**—a community-driven, privacy-first coordination platform that bridges this critical gap. BloodBuddy uses open-weight multimodal AI to eliminate manual hospital paperwork bottlenecks and connects verified requesters with willing donors through a consent-controlled workflow. Let's see it live."*

---

### Phase 2: Requester Flow & AI Document Extraction (0:45 – 2:15)

**Action:**
1. Click **Sign in** in the top navigation bar.
2. Under Quick Demo Logins, click **Demo Requester (Priya Sharma)**.
3. In the navigation, click **AI Document Upload** (or *New Request* → *AI Document Extraction*).
4. Upload `sample/sample_blood_request.txt`.

**Talking Points:**
> *"First, as Priya Sharma, our patient's relative, we need to create an urgent blood requisition. Requisition slips from hospitals are often physical slips or handwritten scans. Typing in medical terms while stressed leads to data entry errors.*
>
> *Here, Priya uploads the hospital requisition document. Notice what happens next:"*

**Action:** Show the extracted fields populating on the screen with confidence badges.

**Talking Points (AI Integration Deep Dive):**
> *"Our AI engine immediately parses the document and extracts structured data:
> - **Blood Group**: O+ (Confidence: High)
> - **Units Needed**: 2 units (Confidence: High)
> - **Hospital**: City General Hospital, Gwalior (Confidence: High)
> - **Required Date**: October 20, 2026
>
> **Judges, take note of our architecture:**
> 1. **Pluggable AI Provider**: BloodBuddy defines an `AIProvider` abstraction. We run locally with **Qwen2.5-VL via Ollama**—an open-weight, Apache 2.0 licensed vision-language model. No sensitive patient health information ever leaves the hospital or local server.
> 2. **Deterministic Demo Provider**: For low-resource devices or offline hackathon evaluations, we provide a zero-dependency fallback that produces predictable results.
> 3. **Prompt Injection Defense**: Our extraction prompt strictly confines the model to extract factual text and ignore malicious instructions inside documents.
> 4. **Human-in-the-Loop**: The AI never directly commits data to the database. It outputs pre-filled fields with confidence scores. Priya confirms the details and clicks **Confirm and Create Request**."*

**Action:** Click **Confirm and Create Request**.

---

### Phase 3: Donor Matching & Privacy-First Workflow (2:15 – 3:30)

**Action:** The app redirects to the Request Details page. Scroll to the **Matched Donors** section.

**Talking Points:**
> *"The request is now live in the system. The matching engine immediately searches for registered, eligible O+ donors in the area.
>
> Here we see **Rahul Verma**, an eligible O+ donor located just 3.2 kilometers away.
>
> **Notice a crucial privacy safeguard:** Rahul's personal phone number and exact address are completely masked. BloodBuddy operates on **Mutual Consent**: requesters cannot harvest donor contact info, and donors are never spammed publicly."*

**Action:**
1. Click **Invite Donor** next to Rahul Verma.
2. Click the user profile dropdown → **Sign out**.
3. Click **Sign in** → select **Demo Donor (Rahul Verma)**.
4. On Rahul's Donor Dashboard, show the incoming notification for the O+ request at City General Hospital.
5. Click **Accept Invitation**.

**Talking Points:**
> *"Now we are in Rahul's shoes. Rahul receives an in-app coordination alert with hospital details, urgency, and distance.
>
> When Rahul clicks **Accept**, he explicitly grants consent to share his contact information with Priya for this specific coordination. The connection is made securely and with dignity."*

---

### Phase 4: Lifecycle Tracking & Admin Reset (3:30 – 4:15)

**Action:**
1. Switch back or view the request lifecycle tracking bar.
2. Sign in as **Demo Admin (`admin@demo.bloodbuddy`)**.
3. View the Admin dashboard showing live metrics and the **Reset Demo Data** tool.

**Talking Points:**
> *"Both parties now have full transparency:
> - The request timeline updates in real-time from `Draft` → `AI Extracted` → `Matched` → `Invitation Accepted` → `Coordinated`.
> - The live fulfillment gauge shows 1 of 2 units pledged.
>
> And for organizers and judges, our Admin dashboard includes platform analytics and a **One-Click Demo Reset**, ensuring complete repeatability across evaluation rounds."*

---

### Phase 5: Technical Highlights & Wrap-Up (4:15 – 5:00)

**Action:** Concluding slide/page, showing GitHub repository link.

**Talking Points:**
> *"To summarize our technical accomplishments:
> - **Full-Stack Open Source**: FastAPI backend, React 19 + TypeScript frontend with Tailwind CSS 4.
> - **Production-Ready Quality**: 25 automated unit and API integration tests passing across Pytest and Vitest with GitHub Actions CI.
> - **Ethical AI**: Local multimodal inference with Qwen2.5-VL, prompt injection protection, and mandatory human confirmation.
> - **Open for Contributors**: Complete `CONTRIBUTING.md`, `SECURITY.md`, and good first issues ready for Hacktoberfest.
>
> BloodBuddy proves that ethical AI can save lives while keeping patient and donor privacy paramount. Thank you, and we welcome your questions!"*

---

## Judge FAQ & Anticipated Questions

### Q1: *"Why use local open-weight models instead of OpenAI GPT-4o or Claude?"*
**Answer:**
> *"In healthcare and donor coordination, patient privacy and data sovereignty are non-negotiable. Many hospitals cannot transmit patient documents to third-party proprietary cloud APIs. By using open-weight models like Qwen2.5-VL (Apache 2.0) via Ollama, BloodBuddy can run on-premise on modest hospital hardware without data ever leaving the facility."*

### Q2: *"What prevents the AI from hallucinating incorrect blood types and harming a patient?"*
**Answer:**
> *"We enforce a strict two-layer barrier:
> 1. **Confidence Tagging**: Every field extracted is tagged (`high`, `medium`, `low`, `missing`).
> 2. **Mandatory Human-in-the-Loop Confirmation**: The AI is strictly an extraction assistant, not an automated submitter. The backend schema rejects unconfirmed inputs, and the UI forces explicit user review before any request reaches matching."*

### Q3: *"How do you prevent harassment or abuse of registered donors?"*
**Answer:**
> *"Requesters never receive direct phone numbers upon registration. Distance is approximated to city-level grids, and contact exchange is unlocked solely through a two-way handshake where the donor must explicitly accept the invitation."*

### Q4: *"Can this be deployed to production beyond the demo database?"*
**Answer:**
> *"Yes. The database layer uses SQLAlchemy models designed for SQLite in local development and easily configurable to PostgreSQL or Firebase Firestore in cloud production simply via the `DATABASE_URL` environment variable."*
