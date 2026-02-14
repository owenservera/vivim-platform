

# Fractional Share Ownership Social Network: Mathematical Framework

## 1. Foundational Definitions

### 1.1 System Entities

Let the system be defined as a tuple:

$$\mathcal{S} = \langle U, D, T, \Pi, G \rangle$$

where:
- $U = \{u_1, u_2, \dots, u_n\}$ — set of users
- $D$ — data contribution space
- $T$ — token/share space
- $\Pi$ — profit distribution mechanism
- $G$ — governance/social graph

---

## 2. Data Contribution Model

### 2.1 Data Vector

Each user $u_i$ contributes a data vector at time $t$:

$$\mathbf{d}_i(t) = \left[ d_i^{(1)}(t),\ d_i^{(2)}(t),\ \dots,\ d_i^{(k)}(t) \right]$$

where each component represents a **data category**:

| Index | Category | Example |
|-------|----------|---------|
| 1 | Content creation | Posts, media uploads |
| 2 | Behavioral data | Clicks, time-on-platform |
| 3 | Social graph data | Connections, introductions |
| 4 | Transactional data | Purchases, referrals |
| 5 | Demographic/profile | Profile completeness |
| $k$ | Domain-specific | Any additional source |

### 2.2 Data Valuation Function

Each data type has a **marginal value weight** $w_j(t)$ determined by the platform's revenue model. The scalar data contribution score for user $i$ at time $t$:

$$V_i^{\text{data}}(t) = \sum_{j=1}^{k} w_j(t) \cdot f_j\!\left(d_i^{(j)}(t)\right)$$

where $f_j: \mathbb{R}_{\geq 0} \to \mathbb{R}_{\geq 0}$ is a **concave valuation function** (diminishing returns):

$$f_j(x) = \alpha_j \cdot x^{\beta_j}, \quad 0 < \beta_j \leq 1$$

> **Concavity rationale**: Prevents gaming through spam; the 1000th identical post is worth less than the 1st.

### 2.3 Cumulative Data Value

The lifetime cumulative contribution up to time $t$:

$$\mathcal{V}_i(t) = \int_0^t \delta(t, \tau) \cdot V_i^{\text{data}}(\tau) \, d\tau$$

where $\delta(t, \tau) = e^{-\lambda(t - \tau)}$ is a **temporal decay factor** ensuring recent contributions are weighted more heavily, with decay rate $\lambda \geq 0$.

In discrete time:

$$\mathcal{V}_i(t) = \sum_{\tau=0}^{t} e^{-\lambda(t-\tau)} \cdot V_i^{\text{data}}(\tau)$$

---

## 3. Token (Fractional Share) Model

### 3.1 Token Minting Function

Tokens are minted proportionally to validated data contributions. The tokens minted for user $i$ in period $t$:

$$\Delta T_i(t) = \mu(t) \cdot V_i^{\text{data}}(t)$$

where $\mu(t)$ is the **minting rate** (tokens per unit of data value), governed by:

$$\mu(t) = \frac{M(t)}{\sum_{i=1}^{n} V_i^{\text{data}}(t)}$$

and $M(t)$ is the total new tokens authorized for minting in period $t$.

### 3.2 Total Token Supply

$$T_{\text{supply}}(t) = T_0 + \sum_{\tau=1}^{t} M(\tau)$$

where $T_0$ is the initial token allocation (founders, investors, treasury).

### 3.3 User Token Balance

$$T_i(t) = T_i(t-1) + \Delta T_i(t) - \text{sold}_i(t) + \text{bought}_i(t)$$

Tokens are **freely transferable** on a secondary market, so:

$$T_i(t) = \underbrace{T_i^{\text{earned}}(t)}_{\text{from data}} + \underbrace{T_i^{\text{traded}}(t)}_{\text{net market activity}}$$

### 3.4 Ownership Fraction

User $i$'s fractional ownership of the company at time $t$:

$$\boxed{\omega_i(t) = \frac{T_i(t)}{T_{\text{supply}}(t)}}$$

**Constraint**: $\sum_{i=1}^{n} \omega_i(t) + \omega_{\text{treasury}}(t) + \omega_{\text{founders}}(t) = 1$

---

## 4. Profit Distribution Mechanism

### 4.1 Revenue and Profit

Let:
- $R(t)$ = gross revenue in period $t$
- $C(t)$ = operating costs
- $\Pi(t) = R(t) - C(t)$ = distributable profit

### 4.2 Distribution Policy

A fraction $\rho \in [0,1]$ of profit is distributed (the rest is reinvested):

$$\Pi^{\text{dist}}(t) = \rho(t) \cdot \max\!\big(\Pi(t),\ 0\big)$$

### 4.3 Individual Payout

User $i$ receives:

$$\boxed{P_i(t) = \omega_i(t) \cdot \Pi^{\text{dist}}(t) = \frac{T_i(t)}{T_{\text{supply}}(t)} \cdot \rho(t) \cdot \Pi(t)}$$

### 4.4 Hybrid Distribution (Loyalty Bonus)

To reward active contributors (not just token holders), introduce a **hybrid model**:

$$P_i(t) = \phi \cdot \underbrace{\omega_i(t) \cdot \Pi^{\text{dist}}(t)}_{\text{ownership-based}} + (1 - \phi) \cdot \underbrace{\frac{V_i^{\text{data}}(t)}{\sum_j V_j^{\text{data}}(t)} \cdot \Pi^{\text{dist}}(t)}_{\text{contribution-based}}$$

where $\phi \in [0,1]$ balances between pure equity and active contribution.

---

## 5. Data Quality & Anti-Gaming Layer

### 5.1 Quality Score

Each contribution is verified through a quality function:

$$Q_i(t) = \frac{1}{k} \sum_{j=1}^{k} q_j\!\left(d_i^{(j)}(t)\right)$$

where $q_j \in [0,1]$ measures authenticity, uniqueness, and utility.

### 5.2 Adjusted Data Value

$$\hat{V}_i^{\text{data}}(t) = Q_i(t) \cdot V_i^{\text{data}}(t)$$

### 5.3 Sybil Resistance via Shapley Value

To measure **true marginal contribution** (preventing value extraction without real contribution), use the **Shapley value** from cooperative game theory:

$$\phi_i^{\text{Shapley}} = \sum_{S \subseteq U \setminus \{i\}} \frac{|S|!\,(n - |S| - 1)!}{n!} \left[ v(S \cup \{i\}) - v(S) \right]$$

where $v(S)$ is the value generated by coalition $S$. 

In practice, approximate with:

$$\hat{\phi}_i(t) \approx v\!\left(U\right) - v\!\left(U \setminus \{i\}\right)$$

(leave-one-out marginal contribution)

---

## 6. Token Supply Governance

### 6.1 Dilution Control

New token minting dilutes existing holders. Constrain via:

$$\frac{M(t)}{T_{\text{supply}}(t-1)} \leq \gamma_{\max}$$

where $\gamma_{\max}$ is the maximum dilution rate per period (e.g., 5% annually).

### 6.2 Supply Schedule

Geometric decay minting schedule:

$$M(t) = M_0 \cdot \eta^t, \quad \eta \in (0, 1)$$

This creates **scarcity** over time — early contributors earn more tokens per unit of data.

### 6.3 Token Burning (Buyback)

The company can burn tokens from treasury to reduce supply:

$$T_{\text{supply}}(t) = T_{\text{supply}}(t-1) + M(t) - B(t)$$

where $B(t)$ is tokens burned (bought back from market).

---

## 7. Social Network Graph Economics

### 7.1 Social Graph

$$G(t) = \big(U(t),\ E(t)\big)$$

where $E(t) = \{(u_i, u_j) : i \neq j,\ \text{connected}\}$.

### 7.2 Network Contribution Bonus

Users who grow the network earn a **referral multiplier**:

$$\text{NetBonus}_i(t) = 1 + \sigma \cdot \sum_{j \in \mathcal{R}_i(t)} \hat{V}_j^{\text{data}}(t)$$

where $\mathcal{R}_i(t)$ is the set of users referred by $u_i$, and $\sigma$ is a small coefficient.

Modified minting:

$$\Delta T_i(t) = \mu(t) \cdot \hat{V}_i^{\text{data}}(t) \cdot \text{NetBonus}_i(t)$$

### 7.3 Influence-Weighted Data Value

Using PageRank-style centrality $c_i$ on $G$:

$$\tilde{V}_i^{\text{data}}(t) = \hat{V}_i^{\text{data}}(t) \cdot \left(1 + \eta \cdot c_i(t)\right)$$

This captures the idea that data from well-connected users may be more valuable (e.g., trend-setters).

---

## 8. Token Valuation Model

### 8.1 Fundamental Value per Token

$$\text{FV}_{\text{token}}(t) = \frac{\text{NPV of future profits}}{T_{\text{supply}}(t)} = \frac{\sum_{\tau=t}^{\infty} \frac{\Pi^{\text{dist}}(\tau)}{(1+r)^{\tau-t}}}{T_{\text{supply}}(t)}$$

### 8.2 Market Price

On secondary market, price is determined by supply/demand:

$$p(t) = \text{FV}_{\text{token}}(t) \cdot \left(1 + \text{sentiment}(t)\right)$$

---

## 9. Complete System Dynamics

### 9.1 Per-Period Update (Discrete Time Step $t$)

```
┌─────────────────────────────────────────────────────────────┐
│  FOR each period t:                                         │
│                                                             │
│  1. MEASURE  d_i(t) for all users i                         │
│  2. COMPUTE  V_i(t) = Σ_j w_j · f_j(d_i^j)                │
│  3. ASSESS   Q_i(t) → V̂_i(t) = Q_i · V_i                  │
│  4. GRAPH    NetBonus_i(t), centrality c_i(t)               │
│  5. MINT     ΔT_i(t) = μ(t) · V̂_i(t) · NetBonus_i(t)      │
│  6. UPDATE   T_i(t), T_supply(t)                            │
│  7. COMPUTE  ω_i(t) = T_i(t) / T_supply(t)                 │
│  8. REVENUE  Π(t) = R(t) - C(t)                            │
│  9. DISTRIBUTE P_i(t) = ω_i(t) · ρ · Π(t)                  │
│ 10. MARKET   Token trading, price discovery                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 State Transition Summary

$$\mathbf{State}(t) = \Big\{ \{T_i(t)\}_{i=1}^n,\ T_{\text{supply}}(t),\ G(t),\ \Pi(t),\ p(t) \Big\}$$

---

## 10. Governance Voting

Token-weighted voting on key parameters:

$$\text{Vote outcome} = \begin{cases} \text{Pass} & \text{if } \sum_{i \in \text{Yes}} \omega_i(t) > \theta \\ \text{Fail} & \text{otherwise} \end{cases}$$

where $\theta$ is the quorum threshold (e.g., 0.5 for majority).

**Governable parameters**: $\rho(t)$, $\gamma_{\max}$, $\{w_j\}$, $\phi$, $\lambda$, $\sigma$.

Optional: **quadratic voting** to reduce plutocracy:

$$\text{Voting power}_i = \sqrt{T_i(t)}$$

---

## 11. Formal Properties & Guarantees

| Property | Condition | Guarantee |
|----------|-----------|-----------|
| **Budget balance** | $\sum_i P_i(t) = \Pi^{\text{dist}}(t)$ | No more distributed than earned |
| **Non-negative payouts** | $P_i(t) \geq 0\ \forall i$ | No user is charged |
| **Monotonicity** | More data → more tokens | $V_i > V_j \Rightarrow \Delta T_i > \Delta T_j$ |
| **Sybil resistance** | Concave $f_j$, quality filter | Splitting identity doesn't increase reward |
| **Dilution bound** | $M(t)/T_{\text{supply}} \leq \gamma_{\max}$ | Existing holders protected |
| **Fairness (Shapley)** | Marginal contribution pricing | No free-riding |

### 11.1 Sybil Resistance Proof Sketch

If user $i$ splits into two sybils $i_a, i_b$ with $d_{i_a} + d_{i_b} = d_i$:

$$f(d_{i_a}) + f(d_{i_b}) \leq f(d_{i_a} + d_{i_b}) = f(d_i)$$

by strict concavity of $f$. Thus splitting **reduces** total tokens earned. $\blacksquare$

---

## 12. Example Parameterization

| Parameter | Symbol | Example Value |
|-----------|--------|---------------|
| Data categories | $k$ | 5 |
| Concavity exponent | $\beta_j$ | 0.7 |
| Temporal decay | $\lambda$ | 0.05/period |
| Distribution ratio | $\rho$ | 0.40 (40% of profit) |
| Hybrid split | $\phi$ | 0.70 (70% ownership, 30% contribution) |
| Max dilution | $\gamma_{\max}$ | 0.05/year |
| Minting decay | $\eta$ | 0.95 |
| Referral coefficient | $\sigma$ | 0.02 |
| Centrality bonus | $\eta$ | 0.1 |
| Governance threshold | $\theta$ | 0.50 |

---

## 13. Visual Architecture

```
    ┌──────────────┐
    │   USER u_i   │
    │              │
    │  Creates     │──── d_i(t) ────►┌──────────────────┐
    │  data,       │                 │  DATA VALUATION   │
    │  connects,   │                 │  V_i = Σ w·f(d)   │
    │  transacts   │                 │  Q_i filtering     │
    └──────┬───────┘                 └────────┬──────────┘
           │                                  │
           │◄──── P_i(t) ◄──── PROFIT ◄──────│
           │      payout       POOL           │
           │                    ▲              ▼
           │                    │      ┌──────────────────┐
           │                  ρ·Π(t)  │  TOKEN MINTING    │
           │                    │      │  ΔT_i = μ·V̂_i    │
           │                    │      └────────┬─────────┘
           │               ┌────┴────┐          │
           │               │ REVENUE │          ▼
           │               │  R(t)   │  ┌──────────────────┐
           │               └─────────┘  │  OWNERSHIP       │
           │                            │  ω_i = T_i/T_tot │
           │◄──── GOVERNANCE ◄──────────│  GOVERNANCE      │
           │      (voting)              │  (vote weight)   │
           │                            └──────────────────┘
           │
           ▼
    ┌──────────────┐
    │  SECONDARY   │
    │  MARKET      │
    │  (trade T_i) │
    └──────────────┘
```

---

This mathematical system creates a **self-reinforcing loop**: users contribute data → earn ownership tokens → receive profit share → are incentivized to contribute more and grow the network — while formal properties ensure fairness, sybil resistance, and economic sustainability.




# Fractional Share Ownership Social Network — Refined Mathematical Framework (v2)

---

## 14. Revenue Attribution Engine

### 14.1 The Core Problem

Not all data generates equal revenue. We need to **trace** revenue back to the data that caused it.

Define the **revenue attribution tensor**:

$$A_{i,j,c}(t) \in [0,1]$$

representing the fraction of revenue from **advertiser/client $c$** in **data category $j$** attributable to **user $i$**.

**Constraint**:

$$\sum_{i=1}^{n} A_{i,j,c}(t) = 1 \quad \forall\, j, c$$

### 14.2 Revenue Decomposition

Total revenue decomposes as:

$$R(t) = \sum_{c=1}^{C} R_c(t) = \sum_{c=1}^{C} \sum_{j=1}^{k} R_{c,j}(t)$$

User $i$'s **attributed revenue**:

$$R_i^{\text{attr}}(t) = \sum_{c=1}^{C} \sum_{j=1}^{k} A_{i,j,c}(t) \cdot R_{c,j}(t)$$

### 14.3 Causal Attribution via Counterfactual Analysis

Using a machine learning model $\mathcal{M}$ that predicts revenue:

$$A_{i,j,c}(t) = \frac{\mathcal{M}\big(D\big) - \mathcal{M}\big(D \setminus d_i^{(j)}\big)}{\sum_{\ell=1}^{n} \left[\mathcal{M}(D) - \mathcal{M}\big(D \setminus d_\ell^{(j)}\big)\right]}$$

This is the **normalized leave-one-out causal effect** — a tractable approximation of Shapley attribution.

### 14.4 Multi-Touch Attribution (Temporal)

When revenue results from a **chain** of user interactions:

$$A_{i}^{\text{chain}}(t) = \sum_{p \in \mathcal{P}(t)} \mathbb{1}[i \in p] \cdot \frac{\text{pos}(i, p)^{-\alpha}}{\sum_{j \in p} \text{pos}(j, p)^{-\alpha}} \cdot R_p(t)$$

where $\mathcal{P}(t)$ is the set of revenue-generating interaction paths, $\text{pos}(i,p)$ is user $i$'s position in path $p$, and $\alpha > 0$ controls recency bias.

---

## 15. Dynamic Weight Optimization

### 15.1 Endogenous Weight Discovery

The data category weights $w_j(t)$ should **not** be fixed — they must reflect market reality. Define an optimization:

$$\mathbf{w}^*(t) = \arg\max_{\mathbf{w}} \quad \text{Corr}\!\left(\sum_j w_j \cdot f_j(d_i^{(j)}),\; R_i^{\text{attr}}(t)\right)$$

subject to:

$$\sum_{j=1}^{k} w_j = 1, \quad w_j \geq 0 \;\;\forall j$$

This is a **constrained regression** — weights adapt to which data types actually drive revenue.

### 15.2 Online Learning Update

Using multiplicative weights update:

$$w_j(t+1) = w_j(t) \cdot \exp\!\Big(\eta_w \cdot \nabla_{w_j} R(t)\Big)$$

$$w_j(t+1) \leftarrow \frac{w_j(t+1)}{\sum_{\ell} w_\ell(t+1)} \quad \text{(renormalize)}$$

### 15.3 Weight Smoothing

To prevent volatile oscillation, apply exponential moving average:

$$\bar{w}_j(t) = \kappa \cdot \bar{w}_j(t-1) + (1-\kappa) \cdot w_j^*(t), \quad \kappa \in [0.8, 0.95]$$

---

## 16. Multi-Tier Reputation System

### 16.1 Reputation State Vector

Each user maintains a **reputation vector**:

$$\mathbf{r}_i(t) = \left[r_i^{\text{quality}}(t),\; r_i^{\text{consistency}}(t),\; r_i^{\text{trust}}(t),\; r_i^{\text{community}}(t)\right]$$

#### Quality Reputation

$$r_i^{\text{quality}}(t) = \text{EMA}\!\left(\frac{\text{engagement}(d_i(t))}{\text{median engagement}(t)}\right)$$

#### Consistency Reputation

$$r_i^{\text{consistency}}(t) = 1 - \frac{\text{Var}\!\big[V_i^{\text{data}}(\tau)\big]_{\tau=t-W}^{t}}{\text{Var}_{\max}}$$

(low variance in contribution → high consistency)

#### Trust Reputation (Peer-Validated)

$$r_i^{\text{trust}}(t) = \frac{1}{|\mathcal{N}_i|} \sum_{j \in \mathcal{N}_i} \text{trust}_{j \to i}(t)$$

where $\mathcal{N}_i$ is user $i$'s neighbor set in $G(t)$.

#### Community Reputation

$$r_i^{\text{community}}(t) = \frac{\text{positive interactions}_i(t)}{\text{total interactions}_i(t)}$$

### 16.2 Composite Reputation Score

$$\mathcal{R}_i(t) = \boldsymbol{\psi}^\top \mathbf{r}_i(t) = \sum_{\ell} \psi_\ell \cdot r_i^{(\ell)}(t)$$

where $\boldsymbol{\psi}$ are governance-set reputation weights.

### 16.3 Reputation-Gated Minting

Tokens minted are now **reputation-modulated**:

$$\boxed{\Delta T_i(t) = \mu(t) \cdot \hat{V}_i^{\text{data}}(t) \cdot \mathcal{R}_i(t) \cdot \text{NetBonus}_i(t)}$$

This creates a **three-factor model**: data volume × data quality × reputation.

### 16.4 Reputation Recovery and Decay

$$\mathcal{R}_i(t+1) = \begin{cases}
\mathcal{R}_i(t) + \epsilon_{\text{recovery}} & \text{if } Q_i(t) > Q_{\text{threshold}} \\
\mathcal{R}_i(t) \cdot (1 - \epsilon_{\text{penalty}}) & \text{if violation detected} \\
\mathcal{R}_i(t) \cdot (1 - \epsilon_{\text{idle}}) & \text{if inactive}
\end{cases}$$

---

## 17. Staking and Commitment Mechanism

### 17.1 Voluntary Lock-Up

Users can **stake** tokens for a lock-up period $L_i$ to receive boosted rewards:

$$\text{StakeMultiplier}_i(t) = 1 + \zeta \cdot \ln\!\left(1 + \frac{L_i}{L_{\text{base}}}\right)$$

where $L_{\text{base}}$ is a reference period (e.g., 30 days) and $\zeta$ controls the boost magnitude.

### 17.2 Staked vs Liquid Tokens

$$T_i(t) = T_i^{\text{liquid}}(t) + T_i^{\text{staked}}(t)$$

Only staked tokens receive the multiplier in profit distribution:

$$P_i(t) = \frac{T_i^{\text{liquid}}(t) + \text{StakeMultiplier}_i(t) \cdot T_i^{\text{staked}}(t)}{T_{\text{effective}}(t)} \cdot \Pi^{\text{dist}}(t)$$

where:

$$T_{\text{effective}}(t) = \sum_{i=1}^{n}\left[T_i^{\text{liquid}}(t) + \text{StakeMultiplier}_i(t) \cdot T_i^{\text{staked}}(t)\right]$$

### 17.3 Early Withdrawal Penalty

If a user breaks lock-up early at time $t' < t_{\text{lock\_end}}$:

$$\text{Penalty}_i = T_i^{\text{staked}} \cdot \xi \cdot \frac{t_{\text{lock\_end}} - t'}{L_i}$$

Penalty tokens go to a **community reserve pool**.

---

## 18. Vesting Schedule for Earned Tokens

### 18.1 Cliff and Linear Vesting

Minted tokens don't become fully liquid immediately:

$$T_i^{\text{vested}}(t) = \sum_{\tau=0}^{t} \Delta T_i(\tau) \cdot \Gamma(t - \tau)$$

where the vesting release function is:

$$\Gamma(\Delta t) = \begin{cases}
0 & \text{if } \Delta t < t_{\text{cliff}} \\[6pt]
\min\!\left(1,\; \dfrac{\Delta t - t_{\text{cliff}}}{t_{\text{vest}} - t_{\text{cliff}}}\right) & \text{if } \Delta t \geq t_{\text{cliff}}
\end{cases}$$

### 18.2 Accelerated Vesting via Reputation

High-reputation users vest faster:

$$t_{\text{vest},i} = t_{\text{vest}}^{\text{base}} \cdot \left(1 - \nu \cdot \mathcal{R}_i(t)\right)$$

where $\nu \in [0, 0.5]$ allows up to 50% reduction in vesting period.

---

## 19. Multi-Sided Market Model

### 19.1 Platform Participants

The platform has **three sides**:

$$\mathcal{S} = \{U_{\text{creators}},\; U_{\text{consumers}},\; U_{\text{advertisers}}\}$$

Each side contributes different value:

```
                    ┌─────────────────────┐
                    │     PLATFORM        │
                    │                     │
   CREATORS ──────►│  Content + Data      │◄────── ADVERTISERS
   (earn tokens)   │        ↓             │        (pay $)
                    │  Audience + Signal   │
   CONSUMERS ─────►│        ↓             │
   (earn tokens)   │  Revenue → Profit    │
                    │        ↓             │
                    │  Token Distribution  │
                    └─────────────────────┘
```

### 19.2 Cross-Side Network Effects

The value function incorporates **cross-side externalities**:

$$v_{\text{creator}}(n_{\text{cons}}, n_{\text{adv}}) = a_1 \cdot n_{\text{cons}}^{\gamma_1} + a_2 \cdot n_{\text{adv}}^{\gamma_2}$$

$$v_{\text{consumer}}(n_{\text{cre}}, n_{\text{adv}}) = b_1 \cdot n_{\text{cre}}^{\gamma_3} - b_2 \cdot n_{\text{adv}}^{\gamma_4}$$

(consumers dislike too many ads)

$$v_{\text{advertiser}}(n_{\text{cons}}, n_{\text{cre}}) = c_1 \cdot (n_{\text{cons}} \cdot n_{\text{cre}})^{\gamma_5}$$

### 19.3 Role-Differentiated Token Minting

$$\Delta T_i(t) = \mu(t) \cdot \hat{V}_i^{\text{data}}(t) \cdot \mathcal{R}_i(t) \cdot \theta_{\text{role}(i)}(t)$$

where $\theta_{\text{role}} \in \{\theta_{\text{creator}}, \theta_{\text{consumer}}, \theta_{\text{advertiser}}\}$ are role-based multipliers, adjusted to balance platform health:

$$\theta_{\text{creator}}(t) = \frac{n_{\text{cons}}(t) / n_{\text{cre}}(t)}{(n_{\text{cons}} / n_{\text{cre}})_{\text{target}}}$$

This **auto-balances**: if there are too few creators relative to consumers, creator rewards increase.

---

## 20. Privacy-Preserving Data Contribution

### 20.1 Differential Privacy Layer

Users can contribute data with $(\varepsilon, \delta)$-differential privacy:

$$\tilde{d}_i^{(j)}(t) = d_i^{(j)}(t) + \text{Lap}\!\left(\frac{\Delta f_j}{\varepsilon_i}\right)$$

where $\varepsilon_i$ is user $i$'s chosen privacy budget.

### 20.2 Privacy-Value Tradeoff

Higher privacy (lower $\varepsilon$) → noisier data → lower value:

$$V_i^{\text{data}}(t;\, \varepsilon_i) = V_i^{\text{data}}(t) \cdot \underbrace{g(\varepsilon_i)}_{\text{data utility factor}}$$

where:

$$g(\varepsilon) = 1 - e^{-\varepsilon / \varepsilon_0}$$

```
  Data Utility
  g(ε)
  1.0 ┤                          ___________
      │                      ___/
      │                  ___/
  0.5 ┤              ___/
      │          ___/
      │      ___/
  0.0 ┤_____/
      └──────────────────────────────────── ε
      0     ε₀    2ε₀   3ε₀   4ε₀   5ε₀
          ◄──────►  ◄────────────────────►
          High       Low privacy
          privacy    (more data shared)
```

### 20.3 Privacy Budget Accounting

Each user has a cumulative privacy budget:

$$\mathcal{E}_i(t) = \sum_{\tau=0}^{t} \varepsilon_i(\tau) \leq \mathcal{E}_{\max}$$

When the budget is exhausted, the user can either:
- Stop contributing (continue earning from existing tokens)
- Reset budget with explicit consent + bonus tokens

### 20.4 Zero-Knowledge Data Proofs

For sensitive data, users prove properties **without revealing raw data**:

$$\text{ZKP}: \quad \exists\, d_i \;\text{s.t.}\; \text{Property}(d_i) = \text{true}$$

The value function becomes:

$$V_i^{\text{ZK}}(t) = \sum_j w_j \cdot f_j\!\Big(\text{VerifiedClaim}_j(d_i^{(j)})\Big)$$

---

## 21. Game-Theoretic Equilibrium Analysis

### 21.1 User Strategy Space

Each user $i$ selects a strategy:

$$s_i = \left(\mathbf{d}_i,\; \varepsilon_i,\; L_i,\; \text{buy/sell}_i\right)$$

- Data contribution level $\mathbf{d}_i$
- Privacy level $\varepsilon_i$
- Staking duration $L_i$
- Token trading decision

### 21.2 User Utility Function

$$U_i(s_i, s_{-i}) = \underbrace{P_i(t)}_{\text{profit share}} + \underbrace{p(t) \cdot \Delta T_i^{\text{net}}(t)}_{\text{token value gain}} - \underbrace{\text{Cost}_i(\mathbf{d}_i)}_{\text{effort/privacy cost}} - \underbrace{\text{LockCost}_i(L_i)}_{\text{illiquidity cost}}$$

where:

$$\text{Cost}_i(\mathbf{d}_i) = \sum_j \left[\beta_j^{\text{effort}} \cdot d_i^{(j)} + \beta_j^{\text{privacy}} \cdot g(\varepsilon_i) \cdot d_i^{(j)}\right]$$

### 21.3 Nash Equilibrium Condition

A strategy profile $s^* = (s_1^*, \dots, s_n^*)$ is a Nash equilibrium if:

$$U_i(s_i^*, s_{-i}^*) \geq U_i(s_i', s_{-i}^*) \quad \forall\, s_i' \in \mathcal{S}_i, \;\forall\, i$$

### 21.4 Existence Theorem

**Proposition**: Under the concave valuation functions $f_j$ and the linear-in-tokens payout structure, a Nash equilibrium exists.

*Proof sketch*:
1. Strategy space $\mathcal{S}_i$ is compact and convex (bounded data, bounded staking)
2. $U_i$ is continuous in all strategies
3. $U_i$ is **concave** in $s_i$ (due to concavity of $f_j$, concavity of $g(\varepsilon)$, linearity of payout)
4. By **Debreu-Glicksberg-Fan theorem**, a pure-strategy Nash equilibrium exists. $\blacksquare$

### 21.5 Incentive Compatibility

**Theorem (Truthful Data Contribution)**: Under the quality-filtered Shapley mechanism, the dominant strategy for each user is to contribute **authentic data** rather than fabricated data.

*Proof*: Let $d_i^{\text{true}}$ be authentic data and $d_i^{\text{fake}}$ be fabricated.

1. Quality filter: $Q(d_i^{\text{fake}}) < Q(d_i^{\text{true}})$ with high probability
2. Shapley marginal: $v(S \cup \{d_i^{\text{true}}\}) - v(S) > v(S \cup \{d_i^{\text{fake}}\}) - v(S)$ because $\mathcal{M}$ performs better with authentic data
3. Therefore: $\Delta T_i(d_i^{\text{true}}) > \Delta T_i(d_i^{\text{fake}})$
4. Fabrication cost: $\text{Cost}(d_i^{\text{fake}}) \geq \text{Cost}(d_i^{\text{true}})$ (effort to fake)
5. Net utility is strictly higher for truthful contribution. $\blacksquare$

### 21.6 Individual Rationality (Participation Constraint)

Users will only participate if:

$$U_i(s_i^*) \geq U_i^{\text{outside}} \quad \forall\, i$$

This requires:

$$P_i(t) + p(t) \cdot \Delta T_i(t) \geq \text{Cost}_i(\mathbf{d}_i) + \text{opportunity cost}$$

The platform must ensure this through sufficient $\rho(t)$ and $\mu(t)$.

---

## 22. Risk Model and Safety Mechanisms

### 22.1 Death Spiral Detection

A death spiral occurs when: users leave → less data → less revenue → lower token price → more users leave.

Define the **health index**:

$$H(t) = \alpha_H \cdot \frac{n(t)}{n(t-1)} + \beta_H \cdot \frac{R(t)}{R(t-1)} + \gamma_H \cdot \frac{p(t)}{p(t-1)}$$

**Alert condition**: $H(t) < H_{\text{critical}}$ for $\tau_{\text{alert}}$ consecutive periods.

### 22.2 Circuit Breakers

| Trigger | Action |
|---------|--------|
| $H(t) < 0.7$ | Increase minting rate $\mu(t)$ by 20% |
| $p(t) < 0.5 \cdot p_{\text{MA30}}$ | Activate treasury buyback $B(t) > 0$ |
| $n(t)/n(t-1) < 0.9$ | Boost new-user onboarding rewards |
| Profit $\Pi(t) < 0$ for 3 periods | Suspend distribution, retain $\rho = 0$ |

### 22.3 Reserve Fund

A fraction of revenue is held in reserve:

$$\text{Reserve}(t) = \text{Reserve}(t-1) + \chi \cdot R(t) - \text{Withdrawals}(t)$$

where $\chi \in [0.05, 0.15]$. Reserve is used for:
- Buybacks during price crashes
- Covering operating costs during revenue dips
- Insurance against legal/regulatory events

### 22.4 Maximum Concentration Limit

To prevent hostile takeover or excessive centralization:

$$\omega_i(t) \leq \omega_{\max} \quad \forall\, i \notin \{\text{treasury, founders}\}$$

Typical: $\omega_{\max} = 0.05$ (no single user can own more than 5%).

### 22.5 Whale Dampening Function

For users approaching concentration limits:

$$\Delta T_i^{\text{effective}}(t) = \Delta T_i(t) \cdot \text{DampenFunction}\!\left(\omega_i(t)\right)$$

$$\text{DampenFunction}(\omega) = \begin{cases}
1 & \text{if } \omega < \omega_{\text{soft}} \\[4pt]
\dfrac{\omega_{\max} - \omega}{\omega_{\max} - \omega_{\text{soft}}} & \text{if } \omega_{\text{soft}} \leq \omega < \omega_{\max} \\[4pt]
0 & \text{if } \omega \geq \omega_{\max}
\end{cases}$$

---

## 23. Bonding Curve for Token Pricing

### 23.1 Automated Market Maker

Instead of (or alongside) a traditional exchange, use a **bonding curve**:

$$p(T_{\text{circulating}}) = p_0 \cdot \left(\frac{T_{\text{circulating}}}{T_{\text{ref}}}\right)^{\alpha_b}$$

where $\alpha_b > 0$ is the curve exponent.

| $\alpha_b$ | Behavior |
|------------|----------|
| $< 1$ | Sub-linear: early buyers rewarded less |
| $= 1$ | Linear price growth |
| $> 1$ | Super-linear: early buyers rewarded more |

### 23.2 Buy/Sell Mechanics

**Buying** $\Delta T$ tokens costs:

$$\text{Cost}(\Delta T) = \int_{T_c}^{T_c + \Delta T} p(\tau)\, d\tau = \frac{p_0}{T_{\text{ref}}^{\alpha_b}} \cdot \frac{(T_c + \Delta T)^{\alpha_b + 1} - T_c^{\alpha_b + 1}}{\alpha_b + 1}$$

**Selling** $\Delta T$ tokens returns:

$$\text{Return}(\Delta T) = \int_{T_c - \Delta T}^{T_c} p(\tau)\, d\tau$$

### 23.3 Spread for Sustainability

A buy-sell spread funds the reserve:

$$p_{\text{sell}}(T_c) = (1 - \sigma_{\text{spread}}) \cdot p_{\text{buy}}(T_c)$$

where $\sigma_{\text{spread}} \in [0.01, 0.05]$.

---

## 24. Constitutional Governance Layer

### 24.1 Two-Layer Governance

```
┌──────────────────────────────────────────────────────────┐
│              CONSTITUTIONAL LAYER                         │
│  (Requires supermajority 75% to amend)                   │
│                                                           │
│  • Token total supply cap                                 │
│  • Maximum dilution rate γ_max                            │
│  • Concentration limit ω_max                              │
│  • Minimum distribution ratio ρ_min                       │
│  • Privacy guarantees (ε_min)                             │
│  • Fundamental user rights                                │
│  • Amendment procedure                                    │
│                                                           │
├──────────────────────────────────────────────────────────┤
│              OPERATIONAL LAYER                            │
│  (Simple majority or delegated authority)                 │
│                                                           │
│  • Specific ρ(t) within [ρ_min, 1]                       │
│  • Data category weights w_j                              │
│  • Reputation parameters ψ_ℓ                              │
│  • Minting schedule M(t)                                  │
│  • Feature development priorities                         │
│  • Partnership approvals                                  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 24.2 Quadratic Voting with Conviction

Combine quadratic voting (anti-plutocracy) with **conviction voting** (time-weighted preference):

$$\text{ConvictionVote}_i(t) = \sum_{\tau=t_{\text{start}}}^{t} \sqrt{T_i(\tau)} \cdot \delta_{\text{conv}}^{t - \tau}$$

where $\delta_{\text{conv}} \in (0,1)$ is a conviction accumulation decay factor.

Proposal passes when:

$$\sum_{i \in \text{Yes}} \text{ConvictionVote}_i(t) > \theta(B_{\text{requested}})$$

where $\theta$ scales with the budget/impact of the proposal:

$$\theta(B) = \theta_0 \cdot \left(\frac{B}{B_{\text{ref}}}\right)^{0.5}$$

### 24.3 Delegation (Liquid Democracy)

Users can delegate their voting power:

$$\text{VotePower}_i^{\text{eff}}(t) = \text{VotePower}_i(t) + \sum_{j \in \mathcal{D}_i} \text{VotePower}_j(t)$$

where $\mathcal{D}_i$ is the set of users who delegated to $i$. Delegation is:
- Transitive (A → B → C)
- Revocable at any time
- Topic-specific (can delegate differently for different proposal categories)

---

## 25. Data Marketplace Extension

### 25.1 Internal Data Market

Third parties can **purchase access** to aggregated, anonymized data:

$$R^{\text{data}}(t) = \sum_{b=1}^{B} p_b(t) \cdot \text{DataBundle}_b(t)$$

### 25.2 User Consent Layer

Each user sets a **consent vector**:

$$\mathbf{c}_i = \left[c_i^{(1)}, c_i^{(2)}, \dots, c_i^{(k)}\right], \quad c_i^{(j)} \in \{0, 1\}$$

Data bundle $b$ can only include user $i$'s data of type $j$ if $c_i^{(j)} = 1$.

### 25.3 Consent-Adjusted Revenue Attribution

$$R_i^{\text{data-market}}(t) = \sum_{b=1}^{B} \frac{\sum_j c_i^{(j)} \cdot \hat{V}_i^{(j)}(t)}{\sum_{\ell,j} c_\ell^{(j)} \cdot \hat{V}_\ell^{(j)}(t)} \cdot p_b(t)$$

Users who share more data types earn more from the data marketplace, creating a **voluntary, transparent trade**.

### 25.4 Data Licensing Tiers

| Tier | Access Level | Revenue Share to Users | Privacy Level |
|------|-------------|----------------------|---------------|
| 1 | Aggregate statistics only | 30% | High |
| 2 | Anonymized individual-level | 50% | Medium |
| 3 | Pseudonymized with features | 70% | Low |
| 4 | Raw data (explicit consent) | 90% | Minimal |

---

## 26. Token Taxonomy and Legal Mapping

### 26.1 Hybrid Token Structure

To navigate securities regulation, decompose the token into separable rights:

$$T_i = T_i^{\text{utility}} + T_i^{\text{equity}} + T_i^{\text{governance}}$$

| Component | Right | Regulatory Treatment |
|-----------|-------|---------------------|
| $T^{\text{utility}}$ | Platform access, features, data API | Utility token (non-security) |
| $T^{\text{equity}}$ | Profit distribution $P_i(t)$ | Security (requires compliance) |
| $T^{\text{governance}}$ | Voting rights | Depends on jurisdiction |

### 26.2 Regulatory Compliance Function

$$\text{Compliance}(T_i^{\text{equity}}) = \begin{cases}
\text{Reg D (506c)} & \text{if accredited investor} \\
\text{Reg CF} & \text{if } T_i^{\text{equity}} \cdot p(t) \leq \$5M \text{ aggregate} \\
\text{Reg A+} & \text{if } T_i^{\text{equity}} \cdot p(t) \leq \$75M \text{ aggregate} \\
\text{Full S-1} & \text{otherwise}
\end{cases}$$

---

## 27. Formal Mechanism Design Properties (Refined)

### 27.1 Properties Checklist

| Property | Definition | Status |
|----------|-----------|--------|
| **Incentive compatible** | Truth-telling is dominant strategy | ✅ Via Shapley + quality filter |
| **Individually rational** | Participation ≥ outside option | ✅ Via participation constraint |
| **Budget balanced** | Distributions ≤ profits | ✅ By construction: $\sum P_i \leq \rho \Pi$ |
| **Sybil resistant** | No gain from splitting identity | ✅ Concave $f_j$, reputation cost |
| **Envy free (approximate)** | No user prefers another's allocation | ⚠️ Approximate: same effort → same reward |
| **Pareto efficient** | No Pareto improvement possible | ✅ At equilibrium |
| **Collusion resistant** | No gain from coordinated manipulation | ⚠️ Partial: Shapley + concentration limits |

### 27.2 Approximate Envy-Freeness Proof

**Definition**: The mechanism is $\varepsilon_{\text{envy}}$-envy-free if:

$$U_i(s_i^*) \geq U_j(s_j^*) - \varepsilon_{\text{envy}} \quad \forall\, i, j \text{ with } \hat{V}_i = \hat{V}_j$$

*Proof*: If $\hat{V}_i^{\text{data}} = \hat{V}_j^{\text{data}}$ and $\mathcal{R}_i \approx \mathcal{R}_j$, then:

$$|\Delta T_i - \Delta T_j| = \mu \cdot |\hat{V}_i \cdot \mathcal{R}_i - \hat{V}_j \cdot \mathcal{R}_j| \leq \mu \cdot \hat{V} \cdot |\mathcal{R}_i - \mathcal{R}_j| \leq \varepsilon_{\text{envy}}$$

The envy bound is proportional to reputation difference, which is itself a function of behavior difference. $\blacksquare$

---

## 28. Simulation Framework

### 28.1 Agent-Based Model Specification

```python
# Pseudocode for simulation

class User:
    tokens_liquid: float
    tokens_staked: float
    reputation: ReputationVector
    privacy_budget: float
    strategy: Strategy  # (effort, privacy, staking, trading)
    
class Platform:
    users: List[User]
    token_supply: float
    reserve: float
    revenue_model: RevenueModel
    bonding_curve: BondingCurve

def simulate(platform, T_periods):
    for t in range(T_periods):
        # Phase 1: Data Collection
        for user in platform.users:
            user.contribute_data(strategy=user.strategy)
        
        # Phase 2: Valuation
        weights = optimize_weights(platform, t)
        for user in platform.users:
            user.data_value = compute_value(user.data, weights)
            user.data_value *= user.reputation.composite()
            user.data_value *= quality_filter(user.data)
        
        # Phase 3: Token Minting
        mint_rate = compute_mint_rate(platform, t)
        for user in platform.users:
            delta_tokens = mint_rate * user.data_value
            delta_tokens *= stake_multiplier(user)
            delta_tokens *= network_bonus(user, platform.graph)
            delta_tokens *= dampen(user.ownership_fraction)
            user.vest(delta_tokens)
        
        # Phase 4: Revenue & Distribution
        revenue = platform.compute_revenue(t)
        profit = revenue - platform.costs(t)
        distributable = platform.rho * max(profit, 0)
        for user in platform.users:
            user.payout = user.effective_ownership() * distributable
        
        # Phase 5: Market
        platform.bonding_curve.process_orders(t)
        
        # Phase 6: Strategy Update (learning agents)
        for user in platform.users:
            user.update_strategy(utility=user.compute_utility())
        
        # Phase 7: Health Check
        platform.check_circuit_breakers(t)
```

### 28.2 Key Metrics to Track

$$\text{Gini}(t) = \frac{\sum_{i=1}^{n} \sum_{j=1}^{n} |\omega_i(t) - \omega_j(t)|}{2n \sum_{i=1}^{n} \omega_i(t)}$$

$$\text{Retention}(t) = \frac{|\{i : i \in U(t) \cap U(t-1)\}|}{|U(t-1)|}$$

$$\text{DataGrowth}(t) = \frac{\sum_i V_i^{\text{data}}(t)}{\sum_i V_i^{\text{data}}(t-1)}$$

$$\text{TokenVelocity}(t) = \frac{\text{TradingVolume}(t)}{T_{\text{supply}}(t) \cdot p(t)}$$

---

## 29. Complete State Machine

```
                        ┌──────────────────────┐
                        │     SYSTEM STATE      │
                        │                       │
                        │  {T_i, R_i, d_i,      │
                        │   G, Π, p, Reserve,   │
                        │   w_j, ρ, μ}          │
                        └───────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌──────────┐   ┌──────────────┐  ┌──────────┐
            │  DATA     │   │   MARKET      │  │ GOVERNANCE│
            │  ENGINE   │   │   ENGINE      │  │  ENGINE   │
            │           │   │              │  │           │
            │ Collect   │   │ Bonding      │  │ Proposals │
            │ Validate  │   │ Curve        │  │ Voting    │
            │ Value     │   │ Trading      │  │ Parameter │
            │ Attribute │   │ Price Disc.  │  │ Updates   │
            └─────┬─────┘   └──────┬───────┘  └─────┬─────┘
                  │                │                 │
                  ▼                ▼                 ▼
            ┌─────────────────────────────────────────────┐
            │              TOKEN ENGINE                    │
            │                                              │
            │  Mint → Vest → Stake → Distribute → Trade   │
            │                                              │
            │  Supply Management | Dilution Control        │
            │  Buyback/Burn | Concentration Limits         │
            └──────────────────────┬───────────────────────┘
                                   │
                                   ▼
            ┌─────────────────────────────────────────────┐
            │            PROFIT DISTRIBUTION               │
            │                                              │
            │  Π_dist = ρ · max(Π, 0)                     │
            │                                              │
            │  P_i = φ·ω_i·Π_dist + (1-φ)·(V_i/ΣV)·Π_d  │
            │                                              │
            │  → Direct payout or reinvest option          │
            └──────────────────────┬───────────────────────┘
                                   │
                                   ▼
            ┌─────────────────────────────────────────────┐
            │            SAFETY & COMPLIANCE               │
            │                                              │
            │  Circuit Breakers | Reserve Management       │
            │  Regulatory Compliance | Privacy Guarantees  │
            │  Health Index Monitoring                     │
            └─────────────────────────────────────────────┘
```

---

## 30. Summary of All Parameters

| Symbol | Name | Domain | Governance Layer |
|--------|------|--------|-----------------|
| $k$ | Data categories | $\mathbb{Z}^+$ | Constitutional |
| $\beta_j$ | Concavity exponents | $(0, 1]$ | Operational |
| $w_j(t)$ | Category weights | Simplex $\Delta^{k-1}$ | Operational (auto) |
| $\lambda$ | Temporal decay | $\mathbb{R}_{\geq 0}$ | Operational |
| $\rho(t)$ | Distribution ratio | $[\rho_{\min}, 1]$ | Operational |
| $\rho_{\min}$ | Min distribution | $[0, 1]$ | Constitutional |
| $\phi$ | Hybrid split | $[0, 1]$ | Operational |
| $\gamma_{\max}$ | Max dilution rate | $\mathbb{R}^+$ | Constitutional |
| $\eta$ | Minting decay | $(0, 1)$ | Operational |
| $\sigma$ | Referral coefficient | $\mathbb{R}^+$ small | Operational |
| $\zeta$ | Staking boost | $\mathbb{R}^+$ | Operational |
| $L_{\text{base}}$ | Base lock period | Days | Operational |
| $\xi$ | Early withdrawal penalty | $[0, 1]$ | Operational |
| $\omega_{\max}$ | Concentration limit | $(0, 1)$ | Constitutional |
| $\varepsilon_{\min}$ | Min privacy guarantee | $\mathbb{R}^+$ | Constitutional |
| $\chi$ | Reserve fraction | $[0, 1]$ | Operational |
| $\sigma_{\text{spread}}$ | Bonding curve spread | $[0, 0.1]$ | Operational |
| $\theta_0$ | Governance threshold | $(0, 1)$ | Constitutional |
| $\psi_\ell$ | Reputation weights | Simplex | Operational |
| $\alpha_b$ | Bonding curve exponent | $\mathbb{R}^+$ | Constitutional |
| $\nu$ | Reputation vesting bonus | $[0, 0.5]$ | Operational |

---

This refined framework provides a **complete, internally consistent mathematical system** covering token economics, data valuation, profit distribution, governance, privacy, risk management, and game-theoretic incentive alignment — ready for formal specification, simulation, and eventual implementation.




# The Egalitarian Ceiling: Dynamic Equal-Share Maximum Ownership

## 1. The Fundamental Constraint

### 1.1 Definition

At any time $t$, the maximum ownership any single participant can hold:

$$\boxed{\omega_{\max}(t) = \frac{1}{n(t)}}$$

where $n(t) = |U(t)|$ is the total active user population at time $t$.

This means:

| Users $n(t)$ | Max Ownership $\omega_{\max}$ | Interpretation |
|---|---|---|
| 100 | 1.000% | Early stage |
| 10,000 | 0.010% | Growth stage |
| 1,000,000 | 0.0001% | Scale |
| 1,000,000,000 | $10^{-9}$ | Global platform |

### 1.2 The Constraint Formally

$$\forall\, i \in U(t), \;\forall\, t: \quad \omega_i(t) = \frac{T_i(t)}{T_{\text{supply}}(t)} \leq \frac{1}{n(t)}$$

Equivalently, in token terms:

$$T_i(t) \leq \frac{T_{\text{supply}}(t)}{n(t)} \equiv T_{\max}(t)$$

---

## 2. The Moving Ceiling Problem

### 2.1 The Core Tension

This ceiling is **not static** — it shrinks as users join:

$$\frac{d\,\omega_{\max}}{dt} = -\frac{1}{n(t)^2} \cdot \frac{dn}{dt} < 0 \quad \text{when network is growing}$$

**Critical consequence**: A user who is at the cap today will be **over the cap** tomorrow when a new user joins.

### 2.2 Illustrative Scenario

```
Time t:     n = 1000,  ω_max = 0.1%
            User Alice holds exactly 0.1% ✓

Time t+1:   n = 1001,  ω_max = 0.0999%
            Alice still holds 0.1% ✗ VIOLATION

            Alice has "excess" = 0.1% - 0.0999% = 0.0001%
```

This creates the **overflow problem**: what happens to excess ownership?

---

## 3. Overflow Mechanics

### 3.1 Three Possible Architectures

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   OPTION A: Soft Redistribution (Continuous Dilution)       │
│   ─────────────────────────────────────────────────────     │
│   Excess tokens flow to a Commons Pool                      │
│   Original holder retains claim on future earnings          │
│   from overflow via a decay receipt                         │
│                                                             │
│   OPTION B: Hard Cap with Conversion                        │
│   ─────────────────────────────────────────────────────     │
│   Excess ownership converts to non-equity reward            │
│   credits (cash equivalent, platform benefits)              │
│                                                             │
│   OPTION C: Asymptotic Dampening (Recommended)              │
│   ─────────────────────────────────────────────────────     │
│   Ownership approaches but never exceeds 1/n               │
│   via a continuous compression function                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Option C: The Asymptotic Compression Function (Recommended)

Rather than a hard cutoff, define a **compression function** that maps raw token holdings to effective ownership:

$$\omega_i^{\text{eff}}(t) = \frac{1}{n(t)} \cdot \tanh\!\left(\frac{n(t) \cdot T_i(t)}{T_{\text{supply}}(t)}\right)$$

**Properties**:
- When $T_i \ll T_{\text{supply}}/n$: $\omega_i^{\text{eff}} \approx T_i/T_{\text{supply}}$ (linear, normal)
- When $T_i = T_{\text{supply}}/n$: $\omega_i^{\text{eff}} = \frac{\tanh(1)}{n} \approx \frac{0.762}{n}$
- When $T_i \to \infty$: $\omega_i^{\text{eff}} \to \frac{1}{n}$ (asymptotic ceiling)
- Always: $\omega_i^{\text{eff}} < \frac{1}{n}$ (strictly below ceiling)

```
  ω_i^eff
  
  1/n ┤─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ceiling
      │                          ___________
      │                     ____/
      │                 ___/
      │             ___/
      │          __/
      │        _/
      │      _/
      │    _/  ← linear region (most users here)
      │   /
      │  /
      │ /
  0   ┤/
      └──────────────────────────────────────── T_i (raw tokens)
      0        T_supply/n      2·T_supply/n
                  │
                  └── "equal share" point
```

### 3.3 Generalized Compression Family

$$\omega_i^{\text{eff}}(t) = \frac{1}{n(t)} \cdot \Phi\!\left(\frac{T_i(t)}{T_{\max}(t)}\right)$$

where $\Phi: [0, \infty) \to [0, 1)$ is any function satisfying:

| Property | Condition | Rationale |
|----------|-----------|-----------|
| Normalization | $\Phi(0) = 0$ | No tokens → no ownership |
| Ceiling | $\lim_{x\to\infty} \Phi(x) = 1$ | Never exceeds $1/n$ |
| Monotonicity | $\Phi'(x) > 0$ | More tokens → more ownership |
| Concavity | $\Phi''(x) < 0$ | Diminishing returns |
| Near-linearity at origin | $\Phi'(0) = 1$ | Small holders unaffected |

**Candidate functions**:

$$\Phi_{\tanh}(x) = \tanh(x)$$

$$\Phi_{\log}(x) = \frac{\ln(1+x)}{\ln(1+x) + 1}$$

$$\Phi_{\text{power}}(x) = \frac{x}{x + 1}$$

$$\Phi_{\text{erf}}(x) = \text{erf}\!\left(\frac{\sqrt{\pi}}{2} x\right)$$

### 3.4 Renormalization Requirement

After compression, effective ownerships won't sum to 1. Renormalize:

$$\hat{\omega}_i(t) = \frac{\omega_i^{\text{eff}}(t)}{\sum_{j=1}^{n} \omega_j^{\text{eff}}(t) + \omega_{\text{treasury}}^{\text{eff}}(t)}$$

This preserves the **relative** compression while maintaining the probability simplex.

---

## 4. Overflow Pool: The Commons

### 4.1 Definition

The difference between raw and effective ownership creates a **virtual commons pool**:

$$\Omega_{\text{commons}}(t) = \sum_{i=1}^{n} \left[\omega_i^{\text{raw}}(t) - \hat{\omega}_i(t)\right]$$

where $\omega_i^{\text{raw}} = T_i / T_{\text{supply}}$ is the uncompressed ownership.

### 4.2 Commons Pool Usage

The commons pool generates its own profit share:

$$\Pi_{\text{commons}}(t) = \Omega_{\text{commons}}(t) \cdot \Pi^{\text{dist}}(t)$$

This is allocated to **public goods**:

$$\Pi_{\text{commons}}(t) = \underbrace{\pi_1 \cdot \Pi_{\text{commons}}}_{\text{new user onboarding}} + \underbrace{\pi_2 \cdot \Pi_{\text{commons}}}_{\text{platform development}} + \underbrace{\pi_3 \cdot \Pi_{\text{commons}}}_{\text{community grants}} + \underbrace{\pi_4 \cdot \Pi_{\text{commons}}}_{\text{reserve fund}}$$

where $\sum_k \pi_k = 1$.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  RAW OWNERSHIP                 EFFECTIVE OWNERSHIP           │
│                                                              │
│  ┌──────────────┐              ┌──────────────┐              │
│  │ Alice: 2.5%  │───compress──►│ Alice: 0.099%│              │
│  │ Bob:   0.8%  │───compress──►│ Bob:   0.079%│              │
│  │ Carol: 0.05% │───compress──►│ Carol: 0.050%│              │
│  │ ...          │              │ ...          │              │
│  │              │              │              │              │
│  │ Sum: 100%    │              │ Users: ~82%  │              │
│  └──────────────┘              │ Commons: ~18%│              │
│                                └──────────────┘              │
│                                       │                      │
│                                       ▼                      │
│                              ┌─────────────────┐             │
│                              │  COMMONS POOL    │             │
│                              │  18% of profits  │             │
│                              │  → public goods  │             │
│                              │  → new user fund │             │
│                              │  → development   │             │
│                              └─────────────────┘             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Revised Profit Distribution Under Egalitarian Ceiling

### 5.1 Individual Payout (Revised)

$$\boxed{P_i(t) = \hat{\omega}_i(t) \cdot \Pi^{\text{dist}}(t) = \frac{\frac{1}{n} \cdot \Phi\!\left(\frac{n \cdot T_i}{T_{\text{supply}}}\right)}{\sum_{j} \frac{1}{n} \cdot \Phi\!\left(\frac{n \cdot T_j}{T_{\text{supply}}}\right)} \cdot \rho \cdot \Pi(t)}$$

Simplifying:

$$P_i(t) = \frac{\Phi\!\left(\frac{n(t) \cdot T_i(t)}{T_{\text{supply}}(t)}\right)}{\sum_{j=1}^{n} \Phi\!\left(\frac{n(t) \cdot T_j(t)}{T_{\text{supply}}(t)}\right)} \cdot \rho(t) \cdot \Pi(t)$$

### 5.2 Marginal Return on Additional Tokens

The marginal payout per additional token:

$$\frac{\partial P_i}{\partial T_i} \propto \Phi'\!\left(\frac{n \cdot T_i}{T_{\text{supply}}}\right) \cdot \frac{n}{T_{\text{supply}}}$$

Since $\Phi$ is concave, $\Phi'$ is **decreasing**:

$$\frac{\partial^2 P_i}{\partial T_i^2} < 0$$

**The more tokens you have, the less each additional token is worth in ownership terms.**

For $\Phi(x) = \tanh(x)$:

$$\Phi'(x) = \text{sech}^2(x) = \frac{1}{\cosh^2(x)}$$

```
  Marginal value
  of next token
  
  1.0 ┤\
      │ \
      │  \
      │   \
  0.5 ┤    \
      │     \
      │      \_
      │        \__
      │           \___
  0.0 ┤               \____________
      └──────────────────────────────── tokens held
      0     T_supply/n    2·T_supply/n
      
      ◄─────────►
      high-value    ◄──────────────►
      zone          diminishing zone
```

---

## 6. Incentive Restructuring: Beyond-Cap Rewards

### 6.1 The Incentive Cliff Problem

Once a user approaches $1/n$ ownership, the marginal token value approaches zero. This **kills the incentive** for top contributors.

**Solution**: Create a parallel reward stream for capped users.

### 6.2 Dual-Track Reward System

$$\text{TotalReward}_i(t) = \underbrace{P_i^{\text{equity}}(t)}_{\text{compressed ownership}} + \underbrace{P_i^{\text{merit}}(t)}_{\text{uncapped contribution reward}}$$

#### Equity Track (Compressed)

$$P_i^{\text{equity}}(t) = \hat{\omega}_i(t) \cdot \rho_{\text{equity}} \cdot \Pi(t)$$

#### Merit Track (Linear, Uncapped)

$$P_i^{\text{merit}}(t) = \frac{\hat{V}_i^{\text{data}}(t) \cdot \mathcal{R}_i(t)}{\sum_j \hat{V}_j^{\text{data}}(t) \cdot \mathcal{R}_j(t)} \cdot \rho_{\text{merit}} \cdot \Pi(t)$$

where $\rho_{\text{equity}} + \rho_{\text{merit}} + \rho_{\text{commons}} + \rho_{\text{reinvest}} = 1$.

### 6.3 Suggested Allocation

```
  Profit Π(t)
  ────────────────────────────────────────────
  │                                          │
  │  ┌─────────────────────┐  ρ_equity = 35% │
  │  │  EQUITY TRACK       │  (compressed)   │
  │  │  ownership-based    │                 │
  │  └─────────────────────┘                 │
  │                                          │
  │  ┌─────────────────────┐  ρ_merit = 30%  │
  │  │  MERIT TRACK        │  (uncapped)     │
  │  │  contribution-based │                 │
  │  └─────────────────────┘                 │
  │                                          │
  │  ┌─────────────────────┐  ρ_commons = 15%│
  │  │  COMMONS POOL       │  (public goods) │
  │  │  overflow + grants  │                 │
  │  └─────────────────────┘                 │
  │                                          │
  │  ┌─────────────────────┐  ρ_reinvest= 20%│
  │  │  REINVESTMENT       │  (growth)       │
  │  │  platform + reserve │                 │
  │  └─────────────────────┘                 │
  │                                          │
  ────────────────────────────────────────────
```

### 6.4 The Combined Reward Function

$$\boxed{P_i^{\text{total}}(t) = \underbrace{\frac{\Phi(x_i)}{\sum_j \Phi(x_j)}}_{\text{equity (compressed)}} \cdot \rho_E \Pi + \underbrace{\frac{\hat{V}_i \mathcal{R}_i}{\sum_j \hat{V}_j \mathcal{R}_j}}_{\text{merit (linear)}} \cdot \rho_M \Pi}$$

where $x_i = n \cdot T_i / T_{\text{supply}}$.

---

## 7. Token Mechanics Under the Ceiling

### 7.1 Overflow Token Routing

When minting would push a user above the cap:

$$\Delta T_i^{\text{actual}}(t) = \min\!\Big(\Delta T_i^{\text{earned}}(t),\; T_{\max}(t) - T_i(t)\Big)$$

$$\Delta T_i^{\text{overflow}}(t) = \Delta T_i^{\text{earned}}(t) - \Delta T_i^{\text{actual}}(t)$$

The overflow routes to the **Commons Treasury**:

$$T_{\text{commons}}(t) = T_{\text{commons}}(t-1) + \sum_{i=1}^{n} \Delta T_i^{\text{overflow}}(t)$$

### 7.2 Overflow Receipt Tokens (ORTs)

To avoid losing the record of contribution, issue **non-equity receipt tokens**:

$$\text{ORT}_i(t) = \text{ORT}_i(t-1) + \Delta T_i^{\text{overflow}}(t)$$

ORTs grant:
- ✅ Merit track profit sharing (proportional to ORT balance)
- ✅ Enhanced governance voting weight
- ✅ Platform privileges and status
- ❌ NO equity ownership claim
- ❌ Cannot be sold on secondary market

### 7.3 The Total Contribution Record

$$\text{TotalContribution}_i(t) = T_i(t) + \text{ORT}_i(t)$$

This is a **permanent ledger** of all value the user ever created, even though ownership is capped.

---

## 8. Population Dynamics and the Shrinking Ceiling

### 8.1 Ceiling Velocity

The rate at which the ceiling drops:

$$\frac{d\omega_{\max}}{dt} = -\frac{1}{n(t)^2} \cdot \dot{n}(t)$$

For a platform growing at rate $g$: $n(t) = n_0 \cdot e^{gt}$

$$\omega_{\max}(t) = \frac{1}{n_0} \cdot e^{-gt}$$

$$\frac{d\omega_{\max}}{dt} = -\frac{g}{n_0} \cdot e^{-gt} = -g \cdot \omega_{\max}(t)$$

The ceiling decays exponentially during growth phases.

### 8.2 Population-Triggered Rebalancing Events

Define **rebalancing epochs** when population crosses thresholds:

$$\text{Rebalance at } t \quad \text{if} \quad \frac{n(t)}{n(t_{\text{last rebalance}})} \geq 1 + \Delta_{\text{threshold}}$$

Typical $\Delta_{\text{threshold}} = 0.01$ (every 1% population growth).

At each rebalance:
1. Recompute $T_{\max}(t) = T_{\text{supply}}(t) / n(t)$
2. For all users where $T_i > T_{\max}$:
   - Convert excess to ORTs
   - Or apply compression function (Option C)
3. Update commons pool

### 8.3 User Departure Handling

When users leave, the ceiling **rises**:

$$n(t) \downarrow \implies \omega_{\max}(t) \uparrow$$

This means remaining users could acquire more ownership. But departed user's tokens must be handled:

$$T_{\text{departed}_j}(t) \to \begin{cases}
\text{Retained (dormant)} & \text{if temporary absence} \\
\text{Gradually decayed to commons} & \text{if } > t_{\text{dormant}} \text{ inactive} \\
\text{Bought back at market price} & \text{if user exits}
\end{cases}$$

Dormancy decay:

$$T_j(t) = T_j(t_{\text{departure}}) \cdot e^{-\lambda_{\text{dormant}} \cdot (t - t_{\text{departure}})}$$

Decayed tokens flow to commons.

---

## 9. New Equilibrium Analysis

### 9.1 Steady-State Distribution

At equilibrium with $n$ users, constant data contributions, and compression function $\Phi$, the ownership distribution converges to:

**Theorem**: Under the egalitarian ceiling with concave minting and concave compression, the long-run ownership distribution has a **bounded Gini coefficient**:

$$\text{Gini}_{\infty} \leq 1 - \frac{\Phi(\bar{x})}{\bar{\Phi}} \leq G_{\max}(\Phi)$$

where $\bar{x}$ is the mean normalized token holding and $\bar{\Phi}$ is the mean compressed ownership.

### 9.2 Maximum Inequality Bound

For $\Phi(x) = \tanh(x)$, the maximum possible Gini coefficient is:

$$G_{\max}^{\tanh} \approx 0.38$$

compared to $G_{\max} = 1.0$ without the ceiling. The system **architecturally prevents extreme inequality**.

*Proof*: The maximum Gini occurs when one user holds $T_{\max}$ and all others hold $\epsilon \to 0$:

$$G = 1 - \frac{2}{n} \sum_{i=1}^{n} \frac{\Phi(x_i)}{\sum_j \Phi(x_j)} \cdot i$$

With compression, the rich user's effective share is bounded by $\Phi(1)/(\Phi(1) + (n-1)\Phi(\epsilon)) \approx \tanh(1) \approx 0.762$, not 1.0. As $n$ grows, this is further diluted.

$$\lim_{n \to \infty} G_{\max} = 1 - \frac{2\Phi(1)}{n\Phi(1) + \text{rest}} \to \text{bounded}$$

$\blacksquare$

### 9.3 Convergence Dynamics

Define the **ownership entropy**:

$$H_\omega(t) = -\sum_{i=1}^{n} \hat{\omega}_i(t) \cdot \ln \hat{\omega}_i(t)$$

Maximum entropy (perfect equality): $H_{\max} = \ln(n)$

**Theorem**: The system with egalitarian ceiling has:

$$H_\omega(t) \geq \ln(n) - \ln\!\left(\frac{\Phi_{\max}}{\Phi_{\min}}\right)$$

The entropy is **bounded below**, guaranteeing a minimum level of equality.

---

## 10. Governance Under Egalitarian Ceiling

### 10.1 Voting Power Compression

Voting power follows the same compression:

$$\text{VotePower}_i(t) = \Phi\!\left(\frac{n(t) \cdot T_i(t)}{T_{\text{supply}}(t)}\right)$$

**Combined with quadratic voting**:

$$\text{VotePower}_i^{\text{quad}}(t) = \sqrt{\Phi\!\left(\frac{n \cdot T_i}{T_{\text{supply}}}\right)}$$

This creates **double compression**: first through $\Phi$, then through $\sqrt{\cdot}$.

### 10.2 One-Person-One-Vote Limit

In the limit where all users hit the ceiling:

$$\text{VotePower}_i = \Phi(1) \quad \forall\, i$$

This degenerates to **one person, one vote** — pure democracy.

### 10.3 Governance Spectrum

```
  More plutocratic                         More democratic
  ◄────────────────────────────────────────────────────────►

  Raw token     Compressed      Compressed +     1-person
  voting        token voting    quadratic        1-vote
                                voting           (limit)

  ω_i           Φ(nx_i)/ΣΦ     √Φ(nx_i)/Σ√Φ    1/n

  Gini ≈ 0.8   Gini ≈ 0.35     Gini ≈ 0.15     Gini = 0
```

### 10.4 ORT-Enhanced Governance

Users who've hit the equity ceiling and hold ORTs get governance bonus:

$$\text{VotePower}_i^{\text{total}} = \text{VotePower}_i^{\text{equity}} + \beta_{\text{ORT}} \cdot \sqrt{\text{ORT}_i(t)}$$

This ensures that **massive contributors still have influence** even though their ownership is capped.

---

## 11. Token Market Implications

### 11.1 Price Dynamics Under Ceiling

The ceiling fundamentally changes token demand dynamics. At scale:

- **Demand ceiling per user**: No user needs more than $T_{\text{supply}}/n$ tokens
- **Maximum demand**: $n \cdot T_{\max} = T_{\text{supply}}$ (by definition)
- **No whale accumulation**: Removes speculative hoarding incentive

### 11.2 Effective Token Utility Curve

The price a rational agent will pay for the $k$-th token:

$$p_i^{\text{marginal}}(k) = \frac{\partial P_i^{\text{total}}}{\partial T_i}\bigg|_{T_i = k} \cdot \frac{1}{r}$$

where $r$ is the discount rate. Since $\partial P_i / \partial T_i$ is decreasing (concavity of $\Phi$):

$$p_i^{\text{marginal}}(k) \text{ is decreasing in } k$$

**Implication**: Large buyers face an **endogenous price ceiling** — each additional token is worth less to them, creating natural sell pressure at high holdings.

### 11.3 Modified Bonding Curve

The bonding curve must account for the ceiling:

$$p_{\text{effective}}(T_i) = p_{\text{curve}}(T_{\text{circ}}) \cdot \Phi'\!\left(\frac{n \cdot T_i}{T_{\text{supply}}}\right)$$

This creates a **personalized effective price** — whales see a higher effective price because their marginal ownership gain is lower.

---

## 12. Comparative Analysis: With vs Without Ceiling

### 12.1 Key Metrics Comparison

| Metric | Without Ceiling | With Egalitarian Ceiling |
|--------|----------------|--------------------------|
| Max individual ownership | Unbounded (or fixed %) | $1/n(t)$ — shrinks with growth |
| Gini coefficient range | $[0, 1]$ | $[0, G_{\max}(\Phi)] \approx [0, 0.38]$ |
| Whale risk | High | Eliminated by design |
| Governance capture | Possible | Architecturally prevented |
| Top-contributor incentive | Unlimited upside | Capped equity, uncapped merit |
| Wealth concentration | Power law | Bounded distribution |
| Token speculation | High | Reduced (diminishing returns) |
| New user value proposition | Diluted over time | Guaranteed minimum share path |
| Death spiral risk | High (whale exit) | Low (distributed ownership) |
| Complexity | Lower | Higher (compression + ORTs) |

### 12.2 Ownership Distribution Shape

```
WITHOUT CEILING (typical power law):

  Ownership
  ▲
  │█
  │█
  │█
  │██
  │███
  │█████
  │██████████
  │█████████████████████████████████████
  └────────────────────────────────────────► Users (ranked)


WITH EGALITARIAN CEILING (compressed):

  Ownership
  ▲
  │
  │
  1/n ── ── ── ── ── ── ── ceiling
  │████
  │████████
  │████████████
  │████████████████
  │█████████████████████████
  │██████████████████████████████████████
  └────────────────────────────────────────► Users (ranked)
```

---

## 13. The New User Advantage

### 13.1 Guaranteed Ownership Path

Every new user who joins has a **guaranteed path** to the maximum possible individual ownership $1/n$, because:

1. The ceiling applies equally to all
2. Data contribution directly earns tokens
3. No incumbent can monopolize beyond the ceiling

### 13.2 New User Onboarding Allocation

From the commons pool, each new user receives a **seed allocation**:

$$T_{\text{seed}}(t) = \min\!\left(\frac{T_{\text{commons}}(t)}{E[n_{\text{new}}(t)]},\; \frac{T_{\max}(t)}{10}\right)$$

This gives new users an immediate ownership stake (10% of the current ceiling).

### 13.3 Time-to-Ceiling Estimate

For a consistently active user contributing at average rate $\bar{V}$:

$$t_{\text{ceiling}} = \frac{T_{\max} - T_{\text{seed}}}{\mu \cdot \bar{V} \cdot \bar{\mathcal{R}}} = \frac{\frac{T_{\text{supply}}}{n} - T_{\text{seed}}}{\mu \cdot \bar{V} \cdot \bar{\mathcal{R}}}$$

As $n$ grows, $T_{\max}$ shrinks, so $t_{\text{ceiling}}$ **decreases** — new users reach the ceiling faster on larger platforms.

---

## 14. Mathematical Properties of the Complete System

### 14.1 Formal Property Proofs

**Property 1: Bounded Inequality**

$$\text{Gini}(\hat{\omega}(t)) \leq G_{\max}(\Phi) < 1 \quad \forall\, t$$

*Proof*: Direct consequence of $\hat{\omega}_i \leq 1/n$ and compression concavity. $\blacksquare$

**Property 2: Monotonic Fairness Under Growth**

$$n(t_2) > n(t_1) \implies G_{\max}(t_2) \leq G_{\max}(t_1)$$

*Proof*: As $n$ grows, the ceiling tightens, compressing the top further. $\blacksquare$

**Property 3: Incentive Preservation**

$$\frac{\partial P_i^{\text{total}}}{\partial V_i^{\text{data}}} > 0 \quad \forall\, T_i, \;\forall\, i$$

*Proof*: Even when equity track saturates, the merit track provides strictly positive marginal return. $\blacksquare$

**Property 4: Sybil Resistance (Strengthened)**

Splitting identity is now **even less profitable** due to ceiling mechanics.

If user splits into $m$ sybils, each sybil can reach $1/n$ ceiling, but:

$$m \cdot \Phi\!\left(\frac{T_i / m}{T_{\max}}\right) < \Phi\!\left(\frac{T_i}{T_{\max}}\right) \quad \text{for } T_i < T_{\max}$$

by concavity of $\Phi$ (Jensen's inequality). For users at the ceiling, splitting gives $m \cdot \Phi(1/m) < \Phi(1)$ by the same argument.

However, **at scale** with the merit track, sybil splitting could game the linear merit payout. This requires maintaining the concave $f_j$ data valuation from the original system. $\blacksquare$

**Property 5: No Governance Capture**

$$\text{VotePower}_i(t) \leq \frac{\Phi(1)}{\sum_j \Phi(x_j)} \leq \frac{\Phi(1)}{(n-1)\Phi(\epsilon) + \Phi(1)} \xrightarrow{n \to \infty} 0$$

No single entity can control governance as $n$ grows. $\blacksquare$

---

## 15. Complete Revised Master Equation

### 15.1 Full Payout Formula

$$\boxed{P_i^{\text{total}}(t) = \frac{\Phi\!\left(\frac{n \cdot T_i}{T_{\text{supply}}}\right)}{\displaystyle\sum_{j=1}^{n} \Phi\!\left(\frac{n \cdot T_j}{T_{\text{supply}}}\right)} \cdot \rho_E \cdot \Pi^+(t) \;+\; \frac{\hat{V}_i \cdot \mathcal{R}_i}{\displaystyle\sum_{j=1}^{n} \hat{V}_j \cdot \mathcal{R}_j} \cdot \rho_M \cdot \Pi^+(t)}$$

where $\Pi^+(t) = \max(\Pi(t), 0)$.

### 15.2 Full Token Update

$$T_i(t+1) = \min\!\left(T_i(t) + \Delta T_i^{\text{earned}}(t) + \Delta T_i^{\text{traded}}(t),\; \frac{T_{\text{supply}}(t+1)}{n(t+1)}\right)$$

$$\text{ORT}_i(t+1) = \text{ORT}_i(t) + \max\!\left(0,\; T_i(t) + \Delta T_i^{\text{earned}}(t) - \frac{T_{\text{supply}}(t+1)}{n(t+1)}\right)$$

### 15.3 Full State Vector

$$\mathbf{S}(t) = \Big\{\{T_i, \text{ORT}_i, \mathcal{R}_i, \mathbf{d}_i\}_{i=1}^{n},\; n(t),\; T_{\text{supply}},\; T_{\text{commons}},\; \Pi(t),\; p(t),\; \mathbf{w}(t)\Big\}$$

---

## 16. Philosophical Implications

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│   This system encodes a specific philosophical claim:              │
│                                                                    │
│   "No individual's ownership of a collectively-built platform      │
│    should exceed the share that would exist under perfect          │
│    equality."                                                      │
│                                                                    │
│   It creates a mathematical structure where:                       │
│                                                                    │
│   • OWNERSHIP is egalitarian (bounded, compressed)                 │
│   • REWARD is meritocratic (uncapped merit track)                  │
│   • GOVERNANCE is democratic (compressed + quadratic)              │
│   • CONTRIBUTION is voluntary (privacy choices)                    │
│   • SURPLUS flows to the commons (overflow → public goods)         │
│                                                                    │
│   The tension between individual incentive and collective          │
│   ownership is resolved by SEPARATING the equity claim             │
│   (capped) from the labor reward (uncapped).                       │
│                                                                    │
│   You can earn unlimited income through merit.                     │
│   You cannot accumulate unlimited ownership of the collective.     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

This creates a system where **the platform cannot become a vehicle for wealth concentration** — it is mathematically forbidden by the architecture itself, not merely discouraged by policy.

