# Amana
### Turn trust into credit.

> Turning faithful cooperative savers into verifiable, bankable borrowers — so the people the financial system can't see finally get seen.

Built for the **APIConf Lagos 2026 Hackathon** · Powered by the **Monnify API**

**Live demo:** _FILL_ · **Demo video:** _FILL_ · **Repo:** _FILL_

---

## 1. The Problem

Cooperative societies and thrift groups are how millions of Nigerians actually save and borrow. But inside them, **lending is done blind.**

A cooperative pools members' savings and lends it back out — usually up to a multiple of what you've saved, decided by the treasurer's memory and gut. There's no scoring, no ledger a member can see, and no way to tell a faithful saver apart from a risky one except by who the executives happen to trust. Records live in a notebook or a spreadsheet. Disputes follow. Default follows.

And beneath that sits the deeper problem: **a member can save and repay reliably for a decade, and none of it is visible to the formal financial system.** A market trader who takes cash, pays cash, and saves in a contribution group generates no signal any bank or credit bureau can read — even though that person may be entirely creditworthy. Their reliability is trapped in a notebook. In Nigeria, roughly a quarter of adults remain financially excluded, and a large share of the rest rely on exactly these informal arrangements that leave no data trail.

## 2. Who We're Solving It For

- **Cooperative societies** (our customer) — and the executives who run them: the chairman, secretary, and treasurer who make lending decisions today with no tools.
- **Members** (our users) — informal traders, artisans, and low-income earners: the credit-invisible.
- **Banks & microfinance banks** (our future demand side) — institutions that *want* to lend to this population but have no way to assess them.

## 3. Why It Matters

Across Africa, millions run thriving microbusinesses yet lack the records lenders rely on — a paradox of vibrant economic activity coexisting with no access to credit. Credit is the difference between a trader who restocks and grows and one who stays stuck. Unlocking it for the informal economy isn't a nice-to-have; it's one of the largest financial-inclusion opportunities on the continent. We start where that credit behaviour already happens — the cooperative — and make it legible.

## 4. The Pain (the human story)

Picture a trader who has saved faithfully into her cooperative every week for years. Her stock runs low; she needs a loan to restock before the season. Whether she gets it — and how much — rests on the treasurer's recollection and relationships, not her record. If a dispute arises over what she paid in, the only proof is a paper card. And when she walks into a bank hoping to borrow more to expand, her years of discipline count for **nothing** — to them, she doesn't exist. She is creditworthy, and invisible at the same time. That gap is the pain we remove.

## 5. Those Directly Involved

- **The member** — saves, borrows, and is judged with no data behind them.
- **The executives (treasurer/secretary/chairman)** — carry the whole ledger and every lending decision in their heads.
- **The guarantors** — fellow members on the hook when a loan goes bad.
- **(Future) the lender** — a bank or MFB that can't price a risk it can't see.

## 6. The Solution

Amana is a platform for cooperative societies that runs their contributions and loans on Monnify's rails, gives members a transparent ledger, and — the core — **scores each member's real contribution-and-repayment behaviour so lending stops being a guess.** Every faithful saver quietly builds a verifiable credit identity.

Crucially, the money is never held by a person. Contributions sit in dedicated virtual accounts and move only by rule — so the "collector ran off with the funds" failure mode simply can't happen.

### How it works (member journey)
1. **Onboard** — the member is verified (Monnify KYC) and issued a **dedicated virtual account**.
2. **Contribute** — they pay into that account by transfer or **cash at a Moniepoint POS**; every payment is confirmed in real time via **webhooks**.
3. **Score** — the platform builds a **transparent, rule-based reliability score** from their contribution consistency and, above all, their loan-repayment history.
4. **Lend** — the cooperative approves a loan *informed by the score*; funds go out by **transfer** or as **cash via Paycode** for unbanked members.
5. **Explain** — an **AI assistant** tells the admin, in plain language (or Pidgin/Yoruba), *why* a member qualifies, and answers questions about the ledger.
6. **Repay & update** — repayments are tracked, the score updates, the credit identity grows.

## 7. What Makes Us Different

**vs digital-ajo apps (e.g. Sova, and others):** they digitise rotating *savings* and transparency. We are not a savings tracker — we solve **lending**: creditworthiness scoring so cooperatives lend safely, and a credit identity that makes members *bankable*. Different problem, different customer, different hero feature.

**vs credit bureaus (CRC, FirstCentral) and alt-data scorers (Indicina, CreditChek, RiskSeal):** they score people who already have a *digital footprint* — a smartphone, online applications, wallet history. The cash-based cooperative member is invisible even to them, because there's no data to ingest. **We don't compete on the algorithm — we create the data.** By putting contributions and repayments on rails, we manufacture a clean, verified credit history where none existed. We're the **origination layer for the credit-invisible**, embedded in the institution where the behaviour actually happens — which the incumbents structurally can't reach.

**Our data is also higher quality:** real money committed over time, inside a group with social accountability and guarantors, weighted toward actual repayment — far harder to game than a scraped digital footprint.

## 8. Business Model (phase by phase)

**Phase 1 — Onboard cooperatives, generate the data**
- **SaaS subscription**, tiered by member count — predictable B2B revenue.
- **Transaction fees** on contributions in / disbursements out (light, atop Monnify's).

**Phase 2 — Monetise the activity**
- **Loan origination / facilitation fee** on loans disbursed.
- **Float** on money resting in virtual accounts between contribution and payout.
- **VAS margin** (airtime / data / bills for members).

**Phase 3 — The prize: credit infrastructure**
- **License creditworthiness scores** to banks & MFBs (pay-per-query, like a bureau).
- **Lending marketplace** connecting lenders to our scored, previously-invisible borrowers.

**The moat:** early subscriptions are really a *data-generation engine*. More cooperatives → more verified credit data → better scores → more attractive to lenders → more credit unlocked for members → more cooperatives join. That data — from an offline institution the incumbents can't enter — is what turns this from a tool into infrastructure.

> _Funding requirements, use of funds, and projected returns are covered in our pitch deck._

## 9. Go-to-Market

Land **one** cooperative and prove the loop end-to-end, then expand through cooperative networks — societies cluster into associations, unions, and apex bodies, so one satisfied cooperative refers the next. Trust-led and referral-driven, which suits an institution built on trust. Our beachhead is a real cooperative we already have direct access to.

---

## 10. Technical Execution

### Architecture overview
> 🔧 **FILL:** one paragraph + a simple diagram (frontend → backend → Monnify → webhook handler → scoring engine → AI layer → database). A single image or ASCII diagram is enough.

### Tech stack
> 🔧 **FILL:** e.g. frontend (framework), backend (framework/runtime), database, hosting, AI provider. List versions where relevant.

### Monnify integration (what we use and why)
> 🔧 **FILL:** mark each row honestly — ✅ Working · 🟡 Partial · ⚪ Planned. Judges are told features needn't all work; honesty reads better than overclaiming.

| Monnify API | Role in our workflow | Status |
|---|---|---|
| Customer Reserved Accounts | Each member's dedicated account; contributions land here | _FILL_ |
| Verification (KYC) | Identity check at onboarding | _FILL_ |
| Webhooks | Source of truth for contributions/repayments → feeds ledger + score | _FILL_ |
| Single Transfers | Loan disbursement and member withdrawals | _FILL_ |
| Offline Pay-ins | Contribute cash at a Moniepoint POS (unbanked members) | _FILL_ |
| Paycode | Collect a loan as cash at an agent (no card) | _FILL_ |
| Bulk Transfers | Annual dividends / batch loan payouts | _FILL_ |
| Invoices | Formal, trackable contribution requests + receipts | _FILL_ |
| _(others as built)_ | | _FILL_ |

### The scoring engine (deliberately rule-based, not a black box)
Our creditworthiness score is **transparent and explainable** — computed from observable behaviour, weighted toward the hardest-to-fake signal, actual loan repayment. We chose rules over ML on purpose: there is no default-history dataset to train an honest model on, and cooperatives and regulators trust a score whose logic they can *see*.
> 🔧 **FILL:** list the variables and weights (e.g. on-time repayment rate, contribution consistency, tenure, outstanding exposure). Keep it legible.

### The AI layer (useful, grounded — not slop)
An assistant that (a) **explains each lending decision in plain language / local language** to the admin, and (b) answers **natural-language questions about the cooperative's data** ("how has this member been paying?"). It operates strictly over our own verified data — it narrates the rule-based score, it does not invent one.
> 🔧 **FILL:** which model/provider, and one example prompt→response.

### Engineering practices (this is where "technical depth" is earned)
- **No secrets in the repo** — all keys via environment variables; see `.env.example`.
- **Webhooks verified by signature** (not polling) as the source of truth.
- **Idempotent transfers** — a retried disbursement never pays a loan twice.
- **Error & partial-failure handling** — e.g. a bulk run where some payouts fail is flagged and retryable.
- **Reconciliation** — our ledger provably matches Monnify's transaction events.

---

## 11. How to Test It (for judges)

> 🔧 **FILL** each item — this section is scored ("onboarding-friendly, easy to follow"). Make it work on a stranger's machine.

- **Demo video (2–5 min):** _FILL link_
- **Live demo URL:** _FILL_
- **Test credentials:** _FILL — a cooperative-admin login and a test member_
- **Guided happy path** (reproduce the demo):
  1. Log in as the cooperative admin.
  2. Onboard a member → a virtual account is issued.
  3. Simulate a contribution (sandbox) → watch the ledger and score update.
  4. Request a loan → see the score-informed decision and the AI explanation.
  5. Disburse → confirm the transfer / Paycode.

### Local setup
```bash
# 🔧 FILL — real, tested commands
git clone <repo-url>
cd <project>
cp .env.example .env      # add your Monnify sandbox keys + AI key
# install deps
# run migrations / seed
# start the app
```
**Prerequisites:** _FILL (runtime versions, a Monnify sandbox account, an AI API key)._

## 12. Repo Structure
> 🔧 **FILL:** short tree of the main folders.

## 13. Roadmap
Post-hackathon: harden the scoring model as real repayment data accumulates, expand across a cooperative network, and open the credit-identity layer to partner lenders — turning verified cooperative behaviour into formal credit access.

## 14. Team
> 🔧 **FILL:** names, roles, links.

---

_Built with the Monnify API for APIConf Lagos 2026._
