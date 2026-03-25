# JIO CX

## Quick Start (First Time)

1. **Setup:** Copy `.env.local.example` to `.env.local` and fill in your Linear API key
2. **Understand state:** Read `STATUS.md` (current hypotheses) then `FINDINGS.md` (what passed)
3. **Pick your entry point:**
   - **Explore new data?** Run `/basecamp` in WS1-discovery
   - **Test hypotheses?** Run `/go_hunt` in WS1-discovery
   - **Run specific hypothesis?** Run `/H1`, `/H2`, `/H4` etc. in WS1-discovery
   - **Build an experience?** Go to WS2-mvp/app/experiences/
4. **Before running any skill:** Read `WS1-discovery/CONTEXT.md` (signals frame, governance gate)
5. **After each run:** Append findings to root `FINDINGS.md`, create Linear ticket if passed

---

## The Loop
Question → skill run → finding → FINDINGS.md → Linear ticket → experience → next question

## Read First (Every Session)
**STATUS.md** — what's the current state (8 hypotheses, one table, 10 seconds)
**FINDINGS.md** — what's been discovered (newest first, Claude's session brief)
**WS1-discovery/CONTEXT.md** — the interpretation frame (signals, not root causes)

## Commands
```bash
bash ~/.claude/skills/linear/scripts/linear.sh project "JIO CX"   # sprint board
/basecamp          # Day 1: map Databricks, build hypothesis list
/go_hunt           # Hunt: test hypotheses, scaffold H1-H8 skills
/H1                # Run specific hypothesis skill
/log_session       # After each run: cost, efficiency, what's next
```

## When a Finding Passes
1. Append 4 lines to FINDINGS.md (hypothesis | date | confidence | evidence | status)
2. Tick STATUS.md (✓ in Finding column, add ticket number)
3. Create Linear ticket: `linear.sh create VAS "H4: Complaint fingerprint" "..."`
4. `mkdir mvp/app/experiences/H4-intervention-timing/`
5. Write README.md + discovery-link.md in that folder

## Workstreams
| WS0-demo/              | Static workshop reference. Frozen. Reuse UX patterns only. |
| WS1-discovery/         | Skills run here. Reports land in .claude/reports/. FINDINGS.md feeds here. |
| WS2-mvp/app/           | Build experiences from validated findings. One folder per hypothesis. |
| WS2-mvp/docs/          | Reference: ARCHITECTURE, HYPOTHESES, GOOGLE-STACK. |
| WS3-production/        | Phase 4 operations. Live system management and evolution. |

## Assets
| assets/presentations/   | Edit and ship fast for stakeholders. |
| assets/brand-assets/    | Logos, fonts. |
| assets/brand-references/ | Design tokens (jio-theme.css, JS tokens). |
| assets/template/        | HTML starter for presentations. |

## Design
JioType · #0F3CC9 · 12px radius · outlined SVG icons · no emojis
Tokens: brand-references/jio-theme.css

## Linear
https://linear.app/vasegu/project/jio-cx-3ac6d1af4627
Discovery Sprint: Mar 24–Apr 7, 2026
