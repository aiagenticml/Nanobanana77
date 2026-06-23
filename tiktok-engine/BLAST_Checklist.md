# TikTok Slideshow Content Engine — B.L.A.S.T. Checklist

> **Source Playbook:** "How to Automate TikTok Slideshow Content Creation" by @maverickecom
> **Framework:** B.L.A.S.T. (Blueprint → Link → Architect → Stylize → Trigger)

---

## [B] — BLUEPRINT
> *Map your North Star, constraints, and data inputs before touching any tools.*

### Discovery Questions (Answer These First)
- [x] **Niche:** AI tools for money-making and productivity (targeting side-hustlers & young professionals)
- [x] **Goal Action:** Grow followers first — pure audience building mode. No selling yet.
- [x] **Posting Frequency:** 1x per day — aggressive growth mode (batch-produced weekly)
- [x] **TikTok Account:** Fresh start — new account. Honeymoon boost applies to first 10 posts.
- [x] **Budget:** $0/month — free tools only. Stack: SnapTik, Pinterest, Node.js, CapCut (free), Telegram, Postiz (free tier)

### Research Phase — Find What's Already Winning
- [ ] Scroll TikTok niche for **slideshows** with 100k+ views (last 30 days)
- [ ] Identify a minimum of **5 viral reference videos** to analyze
- [ ] Confirm they are **easy to recreate** (no complex editing)
- [ ] Confirm **multiple videos use the same format** (it's a repeatable system, not a fluke)
- [ ] Download each reference video using **SnapTik** and save locally

---

## [L] — LINK
> *Verify all your tools and accounts are connected and ready before building.*

### Tools Checklist
- [ ] **SnapTik** — Test download of a reference video (free, browser-based)
- [ ] **Claude** account active — Confirm you can upload images/videos to Claude
- [ ] **Pinterest** account active — Confirm image browsing + download access
- [ ] **Node.js** installed — Run `node -v` in terminal to confirm
- [ ] **CapCut** installed — Desktop or mobile confirmed
- [ ] **Telegram** app installed — Desktop + mobile (for compression trick)
- [ ] **Postiz** account created at `app.postiz.com`
- [ ] **Postiz Agent CLI** installed — Run `postiz --version` to confirm
- [ ] **TikTok Creator account** active — Confirm drafts feature is enabled

---

## [A] — ARCHITECT
> *Build out the 3-layer content production pipeline.*

### Layer 1: Hook Generation (Claude Workflow)
- [ ] Upload downloaded SnapTik reference videos to Claude
- [ ] Use this exact prompt:
  > *"Analyze the structure of these TikTok slideshows. Extract the core emotional hook, the pacing of the text overlays, and the visual style. Then, generate 7 new hook variations for [Your Product/Niche] that follow this exact psychological structure."*
- [ ] Review Claude's 7 hook variations and shortlist **top 3**
- [ ] Expand shortlisted hooks into full **slide scripts** (text for each slide, 3–7 slides per post)

### Layer 2: Visual Sourcing (Pinterest)
- [ ] For each script, find **3–5 Pinterest images** that match the hook's emotion
- [ ] Filter by: Portrait/9:16 ratio, high contrast, minimal existing text
- [ ] Emotional hook matching:
  - Money/aspiration hook → lifestyle imagery
  - Fitness hook → action shots
  - Problem/solution hook → before/after visuals
- [ ] Download and organize images into a folder per slideshow

### Layer 3: Programmatic Slide Generation (Node.js)
- [ ] Build or download a `slides-config.json` template:
  ```json
  {
    "slides": [
      { "text": "Hook Line Here", "imagePath": "./images/slide1.jpg" },
      { "text": "Slide 2 Copy", "imagePath": "./images/slide2.jpg" }
    ]
  }
  ```
- [ ] Set up Node.js Canvas script to:
  - [ ] Overlay text in TikTok-native font + background color
  - [ ] Apply correct padding and safe zones
  - [ ] Export each slide as high-res PNG
- [ ] Test run script with one set of slides
- [ ] Confirm output PNGs look clean and properly formatted

---

## [S] — STYLIZE
> *Polish outputs so they look organic, not produced.*

### CapCut Post-Processing
- [ ] Import generated PNG slides into CapCut
- [ ] Add **2–3% film grain** overlay (removes the "too clean" digital look)
- [ ] Export at **1080p** — NOT 4K (4K signals produced content; 1080p reads as organic)

### Telegram Compression Trick
- [ ] Upload final 1080p export to **Telegram** (send to yourself)
- [ ] Download the Telegram version of the file
- [ ] Use THIS version for TikTok upload (strips metadata, adds organic compression artifacts)

### Caption & Hashtag Prep
- [ ] Write a caption for each post (keep it short and native-feeling)
- [ ] Research 3–5 niche-specific hashtags
- [ ] Avoid oversaturated generic tags like #fyp #viral

---

## [T] — TRIGGER
> *Schedule, publish, and monitor the engagement loop.*

### Scheduling (Postiz)
- [ ] Map final processed slides to `schedule.json` in Postiz CLI
- [ ] Queue a **minimum of 7 days of content** in one batch
- [ ] Set all posts to **"Notify" mode** (NOT direct API publish)

### Publishing Protocol (Critical)
- [ ] When Postiz sends phone notification, open **TikTok app directly**
- [ ] Find post sitting in **Drafts** (caption + hashtags pre-filled)
- [ ] Tap **Post manually** from the Drafts tab
- [ ] Do NOT use the API to publish directly — TikTok throttles API-published content

### Engagement Loop (Do This For Every Post)
- [ ] Reply to the **first 10 comments** within 60 minutes of posting
- [ ] Pin your **top 3 profile posts** (what you do + why they should care)
- [ ] Ensure **Link in Bio** points to a high-converting landing page or offer

---

## BRAINSTORM: How to Get Maximum Leverage from This System

### What will compound fastest:
1. **Week 1:** Manually run the pipeline once end-to-end to understand it fully before automating.
2. **Week 2:** Automate the Node.js script to batch-generate 7 slideshows in one run.
3. **Week 3:** Test 2–3 different hooks per week and track which emotional angle wins your niche.
4. **Week 4+:** Double down on the top-performing hook format and kill the underperformers.

### Where AntiGravity can take over:
- I can **write the Node.js Canvas script** for you (the programmatic slide builder).
- I can **draft all 7 hook variations** from Claude's output and format them into a `slides-config.json` automatically.
- I can **scaffold the full folder structure** for each week's batch.

### The one thing that kills most people's results:
Stopping after Week 1. The algorithm rewards **consistency over quality**. Post 3x/week for 4 weeks before judging performance.

---
*Last updated: 2026-04-25 | Framework: B.L.A.S.T.*
