# Product Roadmap — Daily Challenges App

## Vision
The only challenge app that **genuinely adapts to you** — after 14 days, challenges look completely different from day 1 because the AI has learned your profile.

## Target Audience
**Primary:** Working adults 25–45, Europe-wide. Want to improve, max 30 min/day free.
**Problem:** Existing apps are either "childish" (Habitica), too complex (Fabulous), or don't personalize (almost all of them).

## Language Strategy
- **MVP:** English (primary) + Bulgarian
- **Rationale:** EN enables Reddit/ProductHunt acquisition from day 1; BG serves personal network and first beta users
- **v1.0 expansion:** German, French, Romanian (Eastern + Western Europe)
- **Architecture:** i18next — adding a language = one JSON file, zero code changes

---

## Phase 0 — MVP (Weeks 1–8)

**Goal:** 100 real users, D30 retention ≥ 20%

### Required Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Onboarding survey | 5–7 questions: goals, available time, areas, motivation level | P0 |
| AI challenge generation | 1 main + 2 bonus/day, tailored to user profile | P0 |
| Mark as done | Tap to complete + optional photo proof | P0 |
| Points + streak | Points per completion, streak counter, weekly summary | P0 |
| Push notifications | 08:00 (today's challenge) + 20:00 (reminder if not done) | P0 |
| Challenge feedback | Easy / Too hard / Not applicable — feeds the AI | P0 |
| Auth | Email + password or Google OAuth (Supabase Auth) | P0 |
| Basic profile | Streak, points, 30-day completion %, simple bar chart | P0 |
| i18n | English + Bulgarian from launch | P0 |

### Timeline

```
Week 1–2:  Supabase setup, auth flow, onboarding survey, i18n scaffold
Week 3–4:  Claude API integration, challenge generation, home screen
Week 5–6:  Points/streak logic, push notifications, profile screen
Week 7–8:  Feedback loop, PostHog setup, beta with 20–30 testers
```

### MVP Success Metrics
| Metric | Target |
|--------|--------|
| Day 1 retention | ≥ 40% |
| Day 7 retention | ≥ 25% |
| Day 30 retention | ≥ 20% |
| Main challenge completion rate | ≥ 60% |
| Onboarding completion | ≥ 80% |

---

## Phase 1 — v1.0 (Month 3–5)

**Gate:** D30 retention ≥ 20% from MVP

| Feature | Description | Priority |
|---------|-------------|----------|
| Buddy system | 1-on-1 accountability with a friend, mutual progress view | P1 |
| Adaptive difficulty | AI learns from feedback, auto-adjusts challenge difficulty | P1 |
| Weekly challenge pack | Themed week with unique badge (e.g. "Focus Week") | P1 |
| Freemium paywall | Free: 1 challenge/day. Pro ($4.99/mo): full access | P1 |
| Challenge calendar | Monthly visual view — "don't break the chain" | P1 |
| Language expansion | Add DE + RO | P1 |
| Share achievement | Story card for 7/30/100-day streak milestones | P2 |
| Mood tracking | How do you feel after the challenge? | P2 |
| Home screen widget | Today's challenge without opening the app | P2 |

---

## Phase 2 — v2.0 (Month 6–12+)

**Gate:** 1,000+ active users, working freemium

| Feature | Description |
|---------|-------------|
| Group challenges | Small groups (5–10) with shared weekly challenge |
| B2B / Corporate plan | $8–15/user/month for teams — corporate wellness market |
| Real rewards | Brand partnerships — discounts for accumulated points |
| AI coaching chat | Chat with AI coach for motivation and personalized tips |
| Health data integration | Apple Health / Google Fit → adaptive challenges |
| Creator program | Influencers build their own challenge packs |
| More languages | FR, ES, PL, NL — full EU coverage |

---

## Monetization

### Freemium Model
- **Free tier:** 1 challenge/day, basic stats, streak tracking
- **Pro (€4.99/mo or €39.99/year):** 3 challenges/day, buddy system, advanced stats, weekly themes, custom categories

### Revenue Projections
| Milestone | Users | Conv. Rate | MRR |
|-----------|-------|-----------|-----|
| MVP launch | 500 | — | €0 |
| Phase 1 | 2,000 | 5% | ~€500 |
| Phase 2 | 10,000 | 8% | ~€4,000 |
| Scale | 50,000 | 10% | ~€25,000 |

---

## Growth Strategy

### Phase 0 — Manual (0–100 users)
- Direct outreach: personal network, Reddit (r/selfimprovement, r/getdisciplined, r/habits)
- Facebook wellness groups (Bulgarian + international)
- **Goal:** feedback, not numbers

### Phase 1 — Organic (100–1,000 users)
- ASO (App Store Optimization) — keywords in title, subtitle, description
- TikTok/Reels — challenge demonstrations, 7-day series
- ProductHunt launch (save for when product is polished)
- Micro-influencers in wellness niche — barter (Pro access for honest review)
- Personal network: nano-influencers 1K–10K in wellness/fitness/productivity

### Phase 2 — Paid (1,000+ users, proven LTV)
- Apple Search Ads (CPI €2–6, most precise paid channel for iOS)
- Meta Ads lookalike audiences from organic users
- **Condition:** LTV / CAC ≥ 3 before starting paid spend

---

## Key Metrics to Track (PostHog)

```
Acquisition:   Installs/day, source (organic/referral/paid), country
Activation:    Onboarding completion rate, first challenge marked done
Retention:     D1, D7, D30 retention rate (the most important number)
Revenue:       MRR, ARPU, monthly churn rate, LTV
Engagement:    DAU/MAU ratio, completion rate, average streak length
i18n:          Language split — helps prioritise next localisation
```

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Low D30 retention | High | Prioritise buddy system early; it's the strongest retention lever |
| Competitor copies adaptive AI | Medium | Speed of execution + community moat |
| Anthropic API cost at scale | Medium | Haiku model + challenge caching; cost is ~€150/month at 10K users |
| App Store rejection | Low | Follow subscription guidelines strictly (especially for trials) |
| Users dislike AI challenges | Medium | Fast feedback loop; maintain manual challenge bank as fallback |
| Wrong language assumption | Medium | PostHog tracks language split from day 1; pivot quickly if needed |
