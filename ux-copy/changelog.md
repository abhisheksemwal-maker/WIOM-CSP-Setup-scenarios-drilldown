# UX Copy Changelog — Pratibimb Session (2026-04-14)

This file logs every copy change made to the Wiom CSP redesign flavor during the Pratibimb polish pass. Organised by state. Each entry is `before → after + reason`. Reason lines cite the original user direction where available.

---

## Session-wide rules applied

1. **Devanagari transliteration over Latin words mid-Devanagari string**
   - `सेटअप submit हुआ` → `सेटअप सबमिट हुआ`
   - `verify शुरू हुआ` → `वेरिफाई शुरू हुआ`
   - `कनेक्शन ने स्लॉट confirm नहीं किया` — still mid-transition; `confirm` should become `कन्फर्म` in a future polish pass

2. **Short `ि` matra for "verify"**
   - `वेरीफाई` → `वेरिफाई`
   - `वेरीफिकेशन` → `वेरिफिकेशन`
   - Reason: long `ी` creates a visible horizontal gap that reads as a broken word

3. **Respectful plural for executors**
   - `काम कर रहा है` → `काम कर रहे हैं`
   - Applied to Annu, Sunil, Rajesh — wherever the CSP refers to an executor

4. **Oblique case for time expressions**
   - `कोई भी वक्त` → `किसी भी वक्त`

5. **ग्राहक → कनेक्शन vocabulary swap**
   - `ग्राहक का नेट चालू है` → `कनेक्शन का नेट चालू है`
   - `ग्राहक को कॉल करें` → `कनेक्शन को कॉल करें`
   - Reason: "connection" is the Wiom domain term for a subscribing household

6. **Action cue over vague status**
   - `अभी जवाब बाकी है` → `समय चुनना बाकी है` (INS-1041)
   - Reason: tell the CSP what to do, don't describe their passive waiting state

7. **Event framing over shame framing**
   - `पिछला स्लॉट चूक गए` → `कनेक्शन के लिए नया समय चुनें` (INS-1048)
   - Reason: lead with the action, not the failure

---

## Per-state changes

### INS-1041 AWAITING_SLOT_PROPOSAL
| Before | After | Reason |
|---|---|---|
| `अभी जवाब बाकी है` | `समय चुनना बाकी है` | Action cue |
| Exit in overflow menu | Exit as inline Tertiary below primary CTA | Fastest escape on empty state |
| Deadline Regular weight | Deadline Bold weight | DS typography §3 |

### INS-1042 AWAITING_CUSTOMER_SELECTION
| Before | After | Reason |
|---|---|---|
| Purple chip `जवाब बाकी` | Grey text `पेंडिंग है` on both slots | Tone down — customer hasn't acted, don't imply activity |
| `अनुसूची इतिहास` | `कनेक्शन का स्टेटस` | Sanskritization rejected |
| Deadline pill `yellow warning` | Deadline pill `warning subtle` + shadow | Better contrast, calmer hierarchy |

### INS-1043 SLOT_CONFIRMED
| Before | After | Reason |
|---|---|---|
| Slot section shows all | Slot section shows only confirmed | Cleanliness rule (filter) |
| `व्यक्ति चुनना है` → `व्यक्ति चुनें` | `टेक्निशियन चुनना है` → `टेक्निशियन चुनें` | Role-specific |
| Sheet title `व्यक्ति चुनें` | `सेटअप कौन करेगा?` | Intent question |
| Radio: `Annu (स्वयं)` | `Annu` | Drop redundant self-tag |
| Drag handle generic | `#D7D3E0` (`border` token) | DS standard |

### INS-1044 IN_PROGRESS (self)
| Before | After | Reason |
|---|---|---|
| `Annu काम कर रहा है` | `Annu काम कर रहे हैं` | Respectful plural |
| Solid Primary CTA `सेटअप पूरा करें` | Tertiary link-style `कनेक्शन को कॉल करें` + trailing Call icon | User direction: "link type + icon" |
| Timeline `Install chalu hai` | `Slot aane wala hai` | Correct sequence |
| Timeline missing today-cue | `आज ही सेटअप पूरा करें` added | Urgency |

### INS-1045 DELEGATED_OVERDUE
| Before | After | Reason |
|---|---|---|
| Status-style title `देरी हो गई` | Event-style `Rajesh ने कनेक्शन सेटअप में देरी कर दी` | Narrate the event |
| Subtext `दूसरा टेक्निशियन चुनें या खुद पूरा करें` | `सेटअप को जल्दी पूरा करवाएं` | Outcome-oriented, not option-listed |
| CTA opens slot sheet (routing bug) | CTA opens executor sheet | Bug fix |
| Call icon on separate row | Call icon inline on executor row, right edge | Visual consistency |

### INS-1046 RESOLVED
| Before | After | Reason |
|---|---|---|
| `ग्राहक का नेट चालू है` | `कनेक्शन का नेट चालू है` | Vocab swap |

### INS-1047 SCHEDULED (slot day)
| Before | After | Reason |
|---|---|---|
| `कोई भी वक्त शुरू कर सकते हो` | `किसी भी वक्त शुरू कर सकते हो` | Oblique case |
| CTA rendered `[cta.start_installation]` literally | CTA `सेटअप शुरू करें` | Added missing label key |

### INS-1048 NEEDS_RESCHEDULING
| Before | After | Reason |
|---|---|---|
| `पिछला स्लॉट चूक गए` | `कनेक्शन के लिए नया समय चुनें` | Event → action framing |
| Slot section shows old EXPIRED after resubmit | Slot section shows new submitted slots | Bug fix: slot data was dropped through callback chain |
| Repeated `कनेक्शन के लिए दोबारा स्लॉट चुनें` subtext | Removed | De-duplicate |
| Executor section shown | Hidden | Can't pick executor without confirmed slot |

### INS-1049 SCHEDULING_FAILED
| Before | After | Reason |
|---|---|---|
| `Wiom दुबारा कोशिश करेगा` | `कनेक्शन ने स्लॉट confirm नहीं किया` | State the facts |
| Visible in CSP feed | Hidden via feed filter | No CSP action possible |

### INS-1050 INSTALL_SUBMITTED
| Before | After | Reason |
|---|---|---|
| `Submit हुआ - verify बाकी` | `सेटअप सबमिट हुआ` / `वेरिफाई के लिए तैयार` | Devanagari transliteration + queued semantics (Option C) |
| Deadline `वेरीफिकेशन चल रहा है` | `सबमिट हो चुका है` | Copy moved to INS-1053 where it accurately describes the state |
| Timeline `सेटअप submit हुआ` | `सेटअप सबमिट हुआ` | Transliteration |

### INS-1051 DELEGATED_NOT_STARTED
| Before | After | Reason |
|---|---|---|
| Generic "not started" | `Rajesh ने सेटअप अभी शुरू नहीं किया` | Event framing with name |

### INS-1052 DELEGATED_IN_PROGRESS
| Before | After | Reason |
|---|---|---|
| `Sunil काम कर रहा है` | `Sunil काम कर रहे हैं` | Respectful plural |
| Generic subtext | `सेटअप पर काम चल रहा है` | Context specificity |

### INS-1053 VERIFICATION_PENDING
| Before | After | Reason |
|---|---|---|
| Copy identical to INS-1050 | `सेटअप वेरिफाई हो रहा है` / `व्योम जाँच रहा है` | Option C differentiation |
| Deadline `verify जल्दी पूरा होगा` | `वेरिफिकेशन चल रहा है` | Descriptive, not promise-making |
| Timeline `verify शुरू हुआ` | `वेरिफाई शुरू हुआ` | Devanagari transliteration |

---

## Copy NOT changed (deliberate)

| State | Line | Why not |
|---|---|---|
| All | Module header title `सेटअप बाकी है` | Shared across all install states, works as umbrella label |
| Drawer | All items | Out of scope for this session |
| Assurance strip | All chips | Deferred to a future polish pass |

---

## Loose ends

- INS-1051 "rajesh would not have a space in spelling" — user flagged, couldn't reproduce, unresolved
- INS-1053 device screenshot verification pending
- INS-1049 deep-link verification pending (feed filter tested, drilldown render not yet confirmed)
- `कनेक्शन ने स्लॉट confirm नहीं किया` — `confirm` → `कन्फर्म` transliteration pending
- 13 `InstallStateBanner` per-state strings are inlined as Unicode escapes, not label keys. If copy review wants control, migrate to JSON bundle.
