# 📂 CURSOR MASTER PLAN: ADGENXAI V5 (IRON MAN)

**Objective:** Upgrade AdgenXAI Studio to "2026 Enterprise Standards" with predatory pricing, multi-model intelligence, and autonomous self-healing loops.

## 1. 🏷️ Predatory Pricing Architecture

**Strategy:** Undercut competitors (Jasper/Agencies) by offering "Wholesale" infrastructure.

### Implementation Logic (`src/config/pricing.ts`)

* **The Scout ($0/mo):**
* Limit: 5 Campaigns/mo.
* Model: `Gemini Flash 8b` (System Key).
* Feature: "Taste" only. Upgrade to export high-res.


* **The Voyageur ($49/mo):**
* Limit: 50 Campaigns/mo.
* Model: `Multi-Model Council` (Standard).
* Feature: Context Caching included.


* **The Citadel ($199/mo):**
* Limit: **UNLIMITED**.
* Model: **BYOA (Bring Your Own API)** support.
* Feature: White Labeling + Priority Routing.



## 2. 🧠 The "Neural Council" Router

**Strategy:** Route tasks to the specific model best suited for them (Speed vs. Art vs. Truth).

### Router Logic (`src/utils/neural-council.ts`)

```typescript
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

// THE COUNCIL MEMBERS
const AGENTS = {
  RECEPTIONIST: { model: 'groq/llama-3-70b-8192', trait: 'INSTANT_SPEED' }, // < 200ms
  CREATIVE:     { model: 'anthropic/claude-3-5-sonnet', trait: 'NUANCE_ART' }, // Best Copy
  RESEARCHER:   { model: 'google/gemini-1.5-pro', trait: 'GROUNDING' },     // Best Search
  AUDITOR:      { model: 'google/gemini-1.5-pro', trait: 'LONG_CONTEXT' }   // Best Compliance
};

export async function consultCouncil(role: keyof typeof AGENTS, prompt: string, apiKey?: string) {
  // Logic to switch provider based on the role and BYOA key
  // ...
}

```

## 3. 🔐 BYOA (Bring Your Own API) Vault

**Strategy:** Offload compute costs to the user for infinite scalability.

### Vault Logic (`src/utils/vault-manager.ts`)

* **Encryption:** Use Supabase Vault (AES-256) to store user keys (`openai_key`, `anthropic_key`) separate from system keys.
* **Priority:** If `user_key` exists in Vault, use it (Unlock "Citadel" speeds). Else, use `system_key` (Rate Limited).

## 4. 🔁 The "Ralph Wiggum" Loop (Self-Healing)

**Strategy:** "Fail Predictably, Succeed Eventually." The Agent loops until the Auditor approves.

### The Loop Logic (`src/orchestrator/ralph-loop.ts`)

```typescript
// THE RALPH WIGGUM PROTOCOL
// "I'm helping!" - Loops until success or max_retries

export async function runRalphLoop(
  task: () => Promise<any>,
  validator: (result: any) => Promise<boolean>,
  maxRetries = 5
) {
  let attempts = 0;

  while (attempts < maxRetries) {
    console.log(`🔄 Ralph Loop: Attempt ${attempts + 1}/${maxRetries}`);

    // 1. Try the task (e.g., Generate Image)
    const result = await task();

    // 2. Auditor Checks work
    const isValid = await validator(result);

    // 3. Success Condition
    if (isValid) {
      console.log("✅ Ralph Loop: Success!");
      return result;
    }

    // 4. Failure - Loop again with "Correction" context
    console.log("❌ Ralph Loop: Failed check. Retrying...");
    attempts++;
  }

  throw new Error("Ralph Loop: Maximum iterations reached. Human intervention required.");
}

```