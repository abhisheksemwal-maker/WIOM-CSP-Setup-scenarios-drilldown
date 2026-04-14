# Hindi Copy Anchors — Wiom tier-2/3 Devanagari Hinglish

This is the vocabulary guide the Wiom CSP redesign converged on across multiple copy-review sessions. It describes the *voice* the Wiom CSP app speaks in, not just a wordlist. The audience is tier-2/3 field partners who speak functional Hindi and read Devanagari — not native English speakers, not academic Hindi speakers.

---

## Core principles

1. **Prefer Devanagari transliteration over Latin words mid-string** — the user shouldn't have to script-switch while reading
2. **Prefer native Hindi words over Sanskritised formal Hindi** — if the Sanskrit word wouldn't be used in Delhi street speech, don't use it here
3. **English loanwords are fine, but script-native** — `सबमिट`, `वेरिफाई`, `टेक्निशियन`, `स्लॉट`, `कन्फर्म`, `कैंसल`
4. **Respectful plural for any named executor** — `काम कर रहे हैं`, not `काम कर रहा है`
5. **Oblique case for time expressions** — `किसी भी वक्त`, not `कोई भी वक्त`
6. **Action cue over vague status** — tell the CSP what to do, don't describe their passive waiting state
7. **No shame framing** — never tell a CSP "you missed" something; tell them "choose a new time"

---

## Transliteration anchor words

### Allowed English loanwords in Devanagari script

| English | Devanagari | When |
|---|---|---|
| submit | सबमिट | "the form was submitted" |
| verify | वेरिफाई | "verifying the submission" |
| verification | वेरिफिकेशन | "verification in progress" |
| technician | टेक्निशियन | the field executor role |
| slot | स्लॉट | appointment slot |
| confirm | कन्फर्म | "confirmed the slot" |
| cancel | कैंसल | "cancelled the slot" |
| status | स्टेटस | "check status" |
| reset | रीसेट | "reset the device" |
| payment | पेमेंट | — |
| KYC | केवाईसी | identity docs step |

### Matra rules

- **Short `ि` for English "i" sounds** — `वेरिफाई` not `वेरीफाई`. The long `ी` creates a visible horizontal gap that reads as a broken word.
- **Anusvara `ं` over half-n where phonology allows** — `कनेक्शन` not `कनेक्शन` variants with half characters.

---

## Words to AVOID (Sanskritised)

| Reject | Prefer | Why |
|---|---|---|
| अनुसूची | स्टेटस / शेड्यूल | अनुसूची is academic Hindi, not street Hindi |
| प्रस्तावित करें | `स्लॉट भेजें` / `स्लॉट चुनें` (context) | Sanskritised verb — kept in one place (`स्लॉट प्रस्तावित करें`) but under review |
| सूची | लिस्ट | — |
| आवेदन | रिक्वेस्ट / अनुरोध | — |
| विवरण | डिटेल | — |

Note: `सेटअप` is **also** on this list technically (English loanword) but is grandfathered in because it's the Wiom-facing domain term and a replacement would break cross-session vocabulary. The rule "reject English in favor of native Hindi" yields to "reject English in favor of script-native transliteration" — `सेटअप` is already in Devanagari.

---

## Vocabulary swaps (domain-specific)

| Domain shift | Before | After | Why |
|---|---|---|---|
| `ग्राहक` → `कनेक्शन` | `ग्राहक का नेट चालू है` | `कनेक्शन का नेट चालू है` | Connection is the Wiom billing entity |
| `व्यक्ति` → `टेक्निशियन` | `व्यक्ति चुनें` | `टेक्निशियन चुनें` | Role-specific; field term |
| `फीस` → `किराया` | `कैरी फी` | `पड़े नेटबॉक्स का किराया` | NetBoxes legally belong to Wiom; "rent" is accurate, "fee" is Latin |

---

## Peer voice anchor phrases

These phrases read as tier-2/3 peer speech — same register a WhatsApp message between partners would have:

- `समय चुनना बाकी है` — "time is yet to be picked"
- `अब टेक्निशियन चुनना है` — "now technician has to be picked"
- `काम कर रहे हैं` — "is working" (respectful plural)
- `जवाब का इंतज़ार` — "waiting for reply"
- `आज सेटअप का दिन है` — "today is setup day"
- `किसी भी वक्त शुरू कर सकते हो` — "can start any time"
- `सेटअप को जल्दी पूरा करवाएं` — "get the setup completed quickly"
- `कनेक्शन का नेट चालू है` — "the connection's net is on"
- `पेंडिंग है` — "is pending" (casual, accepted transliteration)

---

## Event vs status framing

**Bad (status-style):**
- `देरी हो गई`
- `जवाब बाकी`
- `अभी तैयार नहीं`

**Good (event-style with named actor):**
- `Rajesh ने कनेक्शन सेटअप में देरी कर दी`
- `ग्राहक चुन रहा है`
- `Rajesh ने सेटअप अभी शुरू नहीं किया`

When a banner or card describes a delay or block, name the responsible actor and the action. Don't leave the subject ambiguous.

---

## Destructive vs reversible action labels

| Action | CTA text | Type | Why |
|---|---|---|---|
| Exit install early | `नहीं कर पाएँगे` | Tertiary (neutral) | Task reverts to queue — reversible |
| Return NetBox (final) | `नेटबॉक्स वापस करें` | Destructive (red) | Truly final |
| Cancel booking | `बुकिंग रद्द करें` | Secondary (not red) | Customer can re-book |
| Logout | `लॉग आउट` | Secondary | Can log back in |

Rule: **Destructive = irreversible data loss only.** Anything a user can undo with one more step is Secondary or Tertiary in neutral colors. See [`/specs/ai-spec.md`](../specs/ai-spec.md) for the full reversibility test.

---

## Open vocabulary questions

- Should `सेटअप` be replaced entirely? (Currently grandfathered — blocking change would be expensive)
- Should `प्रस्तावित करें` → `चुनें` in `स्लॉट प्रस्तावित करें`? (Under review)
- `confirm` → `कन्फर्म` in `कनेक्शन ने स्लॉट confirm नहीं किया`? (Pending)
