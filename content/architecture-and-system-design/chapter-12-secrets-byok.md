# Chapter 12: Secrets and Bring-Your-Own-Key

Agents depend on credentials: model-provider API keys, integration tokens, signing secrets. Some belong to the operator; some belong to individual users who "bring their own key" (BYOK). Mishandling any of them is a serious breach. This chapter covers how to store secrets safely, how to resolve which one to use, and the BYOK pattern.

## Two kinds of secrets

Distinguish:

- **Operator secrets**: credentials the operator configures for the whole deployment, held in environment variables / a secrets manager: the system's provider keys, database credentials, signing secrets. These never touch the database and never reach the client.
- **User secrets**: credentials individual users supply: their own provider API key, their own integration token. These must be *stored* (so they persist) but stored such that even someone with database access can't read them.

The architecture must handle both, and must define a clear precedence when both exist.

## Why bring-your-own-key

BYOK matters for two reasons:

1. **Cost attribution.** If a user brings their own provider key, their model usage bills to them, not the operator. Essential for self-hostable or cost-sensitive products.
2. **Flexibility and trust.** Users (or their organizations) may require using their own accounts, their own rate limits, their own data-processing agreements with a provider.

So a mature agent supports both an operator-wide key (everyone uses it) *and* per-user keys (each user uses their own), with per-user taking precedence.

## Storing user secrets: encryption at rest

Never store a user secret in plaintext. Use **authenticated symmetric encryption** (AES-256-GCM is the standard choice):

- **Derive the encryption key from an operator secret** held in the environment (e.g. hash a long random `ENCRYPTION_SECRET` into a 32-byte key). The encryption key lives in the environment, *not* in the database, so a database dump alone is useless to an attacker.
- **Encrypt with a fresh random IV per record.** Store the ciphertext, the IV, and the authentication tag: the three outputs of GCM. Reusing an IV with GCM is catastrophic, so generate a new one every time you encrypt.
- **Authenticated encryption gives integrity, not just secrecy.** A tampered ciphertext fails the auth-tag check on decryption rather than silently producing attacker-influenced plaintext.
- **Fail closed on decryption.** If the auth tag doesn't verify (corruption, wrong key, tampering), return nothing and log; never return garbage that might be used as a credential.

Store each secret type in an appropriately-constrained table (e.g. a provider key per `(user, provider)`; a separate table for a different token type so a check constraint reserved for providers isn't stretched).

## Saving and clearing

Saving a secret encrypts and upserts (replacing any prior value for that user/provider, with a new IV). Clearing a secret *deletes* the row. Keep the save path the only way secrets enter storage, so encryption is never bypassed.

## Resolution precedence: user beats operator

At call time, resolve which credential to use with a clear, single rule: **user key if present, else operator key, else error.** Concretely:

1. Start with the operator (environment) credentials as the baseline.
2. Load and decrypt the user's stored credentials; for each one present, *override* the baseline.
3. The result is, per credential, the user's value if they have one, else the operator's, else null.

This single rule makes both deployment models work from one code path: a shared-operator-key deployment and a per-user-BYOK deployment are the same code, differing only in which values happen to be set. The resolved credentials flow down to wherever the external call is made, where a final fallback-or-throw guard produces a clear error if neither exists.

The same precedence applies to integration tokens (e.g. a third-party research API): per-user token first, operator token as fallback.

## Expose status, never secrets

The UI needs to show users whether a credential is configured and where it came from, but must never receive the secret itself. Provide a **status** endpoint that returns, per credential, *whether* it exists and its *source* (`user`, `operator/env`, or none), and nothing more. This lets the settings UI display "configured (from environment, read-only)" or "configured (your key, editable)" without ever transmitting a key to the browser. The client learns *that* and *from where*, never *what*.

## Tie model routing to available credentials

A neat refinement: route work to providers the user can actually pay for. For background tasks (title generation, lightweight extraction), pick the cheapest model of whichever provider the user has a key for, falling back to the operator default. The credential resolution and the model-tiering strategy (Chapter 4) thus work together: "use the cheapest available model of an *available* provider."

## Signing secrets and other operator credentials

Not all secrets are user-supplied. Operator secrets like a **download-signing secret** (Chapter 17) or a session secret must be:

- strong and random (generate with a proper RNG),
- held only in the environment / secrets manager,
- required at startup (fail fast if missing, rather than silently degrading security),
- and rotated with a plan (rotation invalidates anything signed with the old secret, so think through the impact).

## Operational hygiene

- **Never log secrets.** Scrub them from logs and error messages. Log "failed to decrypt key for provider X," not the key.
- **Least exposure.** Decrypt a secret only at the moment of use, hold it briefly, don't pass it further than necessary.
- **Rotate the encryption secret carefully.** Changing the key-derivation secret invalidates all stored user secrets; plan a re-encryption migration if you must rotate it.
- **Use a real secrets manager in production** (rather than plain env files) where your platform offers one.

## The summary

- Operator secrets live in the environment; user secrets live encrypted in the database.
- Encrypt user secrets with AES-256-GCM: per-record IV, auth tag, key derived from an environment secret, fail closed on decryption.
- Resolve credentials as **user-beats-operator, with operator as fallback**: one rule that serves both shared-key and BYOK deployments.
- Expose *status and source*, never the secret.
- Never log secrets; decrypt only at point of use.

Get this right and you can offer BYOK confidently, attribute costs correctly, and survive a database compromise without surrendering your users' credentials.

## Review

**Quick Check**

1. How does the chapter distinguish operator secrets from user secrets?
   - A) Operator secrets are encrypted; user secrets are plaintext
   - B) Operator secrets live in the environment/secrets manager and never touch the database; user secrets are stored (encrypted) so they persist
   - C) User secrets live in the environment; operator secrets live in the database
   - D) There is no meaningful difference
   <details><summary>Answer</summary>B) Operator secrets stay in the environment and never touch the database or the client; user secrets must be stored so they persist, but encrypted so a database dump alone is useless.</details>

2. What are the two reasons the chapter gives for supporting bring-your-own-key?
   - A) Faster responses and smaller prompts
   - B) Cost attribution (usage bills to the user) and flexibility/trust (their own accounts, rate limits, data agreements)
   - C) Better model quality and lower latency
   - D) Simpler code and fewer dependencies
   <details><summary>Answer</summary>B) Cost attribution — a user's model usage bills to them, not the operator — and flexibility/trust, since users or orgs may require their own accounts and agreements.</details>

3. Which encryption approach does the chapter recommend for storing user secrets?
   - A) A one-way hash of the secret
   - B) Base64 encoding
   - C) Authenticated symmetric encryption (AES-256-GCM) with a per-record IV and auth tag
   - D) Asymmetric RSA with the private key in the database
   <details><summary>Answer</summary>C) AES-256-GCM: store ciphertext, IV, and auth tag, with a fresh random IV per record and the key derived from an environment secret.</details>

4. Why is the AES-256-GCM encryption key derived from an environment secret rather than stored in the database?
   - A) So the key can be rotated without downtime
   - B) So a database dump alone is useless to an attacker — the key lives in the environment, not the database
   - C) Because GCM requires it
   - D) To make decryption faster
   <details><summary>Answer</summary>B) The encryption key lives in the environment, not the database, so an attacker with only a database dump can't decrypt anything.</details>

5. What is the credential resolution precedence rule?
   - A) Operator key always wins
   - B) User key if present, else operator key, else error
   - C) Whichever key was configured most recently
   - D) The cheapest provider's key
   <details><summary>Answer</summary>B) User key if present, else operator key, else error. One rule serves both shared-key and BYOK deployments from a single code path.</details>

**More Questions**

6. Why does the chapter insist you generate a fresh random IV every time you encrypt with GCM?
   - A) It makes the ciphertext shorter
   - B) Reusing an IV with GCM is catastrophic
   - C) The auth tag requires a unique key
   - D) It speeds up decryption
   <details><summary>Answer</summary>B) Reusing an IV with GCM is catastrophic, so you generate a new one for every encryption and store it alongside the ciphertext and auth tag.</details>

7. On decryption, the auth tag fails to verify (corruption, wrong key, or tampering). What should the code do?
   - A) Return the raw decrypted bytes anyway
   - B) Retry decryption with a different key
   - C) Fail closed: return nothing and log; never return garbage that might be used as a credential
   - D) Delete the record automatically
   <details><summary>Answer</summary>C) Fail closed. A tampered or corrupt ciphertext fails the auth-tag check; return nothing and log rather than producing attacker-influenced or garbage plaintext.</details>

8. The settings UI needs to show whether a credential is configured and where it came from. What should the status endpoint return?
   - A) The decrypted secret so the UI can display it masked
   - B) Only whether the credential exists and its source (`user`, `operator/env`, or none) — never the secret itself
   - C) The ciphertext and IV
   - D) The environment variable name holding the secret
   <details><summary>Answer</summary>B) Expose status and source only. The client learns *that* a credential exists and *from where*, never *what* it is.</details>

9. A background task (like title generation) needs a cheap model. How does the chapter suggest tying model routing to credentials?
   - A) Always use the operator's flagship model
   - B) Pick the cheapest model of whichever provider the user actually has a key for, falling back to the operator default
   - C) Ask the user which provider to use each time
   - D) Disable background tasks unless the user brings a key
   <details><summary>Answer</summary>B) Route to the cheapest model of an *available* provider — one the user can actually pay for — falling back to the operator default. Credential resolution and model tiering work together.</details>

10. You need to rotate the `ENCRYPTION_SECRET` used to derive the key. What consequence does the chapter warn about?
    - A) Nothing — rotation is transparent
    - B) All stored user secrets become undecryptable, so you must plan a re-encryption migration
    - C) The operator keys in the environment are lost
    - D) The auth tags need to be regenerated by users
    <details><summary>Answer</summary>B) Changing the key-derivation secret invalidates all stored user secrets; plan a re-encryption migration if you must rotate it.</details>

**Coding Challenge**

*User-beats-operator credential resolution*

Write `resolve_credentials(operator, user)` implementing the chapter's precedence: start from the operator (environment) baseline dict, then for each credential the user has present, override the baseline. The result should be, per credential, the user's value if set, else the operator's, else `None`. Treat missing/`None` user values as "not present."

<details>
<summary>Python Solution</summary>

```python
def resolve_credentials(operator, user):
    """Per credential: user value if present, else operator, else None."""
    resolved = dict(operator)                 # operator baseline
    for name, value in user.items():
        if value is not None:                 # user overrides only when present
            resolved[name] = value
    return resolved


operator = {"anthropic": "op-anthropic", "openai": "op-openai", "gemini": None}
user = {"anthropic": "user-anthropic", "openai": None, "gemini": "user-gemini"}

print(resolve_credentials(operator, user))
# {'anthropic': 'user-anthropic',  # user wins
#  'openai': 'op-openai',          # user absent -> operator fallback
#  'gemini': 'user-gemini'}        # operator was None -> user fills it
```

</details>

**Think About It**

1. There's a comforting intuition that if you encrypt user secrets in the database, they're safe. But the chapter is careful to say the encryption *key* must live outside the database, in the environment. Why does encrypting the data buy you almost nothing if the key sits in the same place — and what threat is this split actually defending against?
   <details><summary>Show answer</summary>Encryption only moves the secret's protection onto the key: whoever has the key can read everything. If the key lives in the same database as the ciphertext, then a single database dump hands an attacker both halves, and the encryption was theatre. The split defends against exactly that most-common breach — a leaked or dumped database — by keeping the key in the environment or a secrets manager, somewhere the database compromise doesn't reach. It's the difference between "an attacker who steals the database gets your users' API keys" and "an attacker who steals the database gets useless ciphertext." The whole point of the chapter is surviving a database compromise without surrendering credentials, and that's only possible if the key was never in the database to begin with.</details>

2. AES-256-GCM gives you both secrecy and an "authentication tag," and the chapter tells you to fail closed if that tag doesn't verify. Plain encryption would keep the secret hidden too — so why does the chapter treat *integrity* as a security property in its own right, and what could go wrong if you skipped the check and just used whatever decrypted?
   <details><summary>Show answer</summary>Without an auth tag, encryption hides the data but can't tell you whether it was tampered with — a modified ciphertext might decrypt to different, attacker-influenced plaintext instead of failing. For a credential, that's dangerous: you could end up using a corrupted or manipulated key as if it were legitimate. The GCM auth tag makes tampering detectable: on decryption it either verifies or fails, and the chapter says to fail closed — return nothing and log — rather than trust garbage. So integrity matters because a secret you can't trust the contents of is worse than no secret at all; "it decrypted to *something*" is not the same as "it decrypted to the value we stored."</details>

3. BYOK looks like a feature for cost accounting, but the chapter shows one resolution rule ("user beats operator, operator as fallback") makes a shared-key deployment and a full BYOK deployment "the same code, differing only in which values happen to be set." Why is collapsing two seemingly different products into one code path such a big deal, and what tends to go wrong when teams instead special-case them?
   <details><summary>Show answer</summary>When the two deployment models are one code path, there's a single place credentials are resolved, so there's a single place to secure, test, and reason about — and adding BYOK to a shared-key product becomes a matter of *setting values*, not rewriting logic. Teams that special-case them end up with branching ("if BYOK enabled, do this; else that") scattered across every call site that needs a credential, and security bugs breed in that branching: one path forgets the fallback, another leaks the operator key when it shouldn't. The elegance is that "use the user's value if present, else the operator's, else error" already describes *both* worlds; a shared deployment simply never sets user values, and a BYOK deployment usually does. Fewer code paths for something this sensitive means fewer places to get it wrong.</details>

---

Next: [Chapter 13: Reliability: retries, idempotency, and failure handling](chapter-13-reliability.md)
