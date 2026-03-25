# MyJio App — Widget & Component Reference

**Super-app pattern** — comparable to Grab, Alibaba, Uber "do-it-all" apps. One app surface housing telecom, entertainment, finance, shopping, health, cloud, and AI services.

Last verified: March 2026, from jio.com/apps/myjio + App Store/Play Store listings.

**Current version:** v8.0.27 (Android) / v8.0.10 (iOS, updated Mar 13 2026)
**Size:** 352 MB (iOS). Rating: 4.7/5 (28.7K reviews). Requires iOS 15.1+.

### v8 Design Changes (confirmed from App Store release notes)
- **Sleeker design** — cleaner, simpler side menu for smoother navigation
- **Compact mini-app widgets** — grouped features for easy access (replaces older grid layout)
- **Stories & "Curated for You"** — new personalised content feed at top of home
- **Streamlined category dashboard** — simplified categories: Telecom, Entertainment, Finance, Shopping, Utilities
- **Fresh, clean look** — modernised aesthetics across all screens

### Full service scope (from jio.com/apps/myjio, Mar 2026)
- 80M+ songs, 1000+ live TV channels in 16+ languages
- UPI payments across India, UAE, Singapore, Bhutan, Sri Lanka, Nepal, France
- 50 GB free JioCloud storage with AI features + DigiLocker integration
- HelloJio AI assistant (English, Hindi, Marathi)
- MyMoney expense/income tracking
- Insurance, mutual fund loans (₹25K–₹15L at 9.9%)
- Health consultations, lab tests, vaccine finder
- E-learning, language translation

---

## 1. Search Bar (Hero Element)

Always visible at top of home screen. Contains:

| Element | Description |
|---------|-------------|
| Text input | "Search Jio" placeholder, rounded pill shape |
| Mic icon | Voice search |
| Bell icon | Notifications |
| QR/scan icon | QR code scanner |
| Camera icon | Visual search / lens |

**Style:** White pill on blue background, ~48px height, full width with 16px side padding. Icons are outlined/line style, medium weight, evenly spaced right-aligned.

---

## 2. Service Grid (Primary Navigation)

2-column grid of service category tiles. Each tile contains:

| Component | Details |
|-----------|---------|
| Category label | Bold, uppercase-ish (e.g., "MOBILE", "HOME") |
| Subtitle | Light weight description (e.g., "True5G speeds", "Fiber & AirFiber") |
| Icon cluster | 2-4 small app icons representing sub-services |
| Divider | Thin 1px border between tiles |

### Categories observed:

| Category | Subtitle | Icon Types |
|----------|----------|------------|
| MOBILE | True5G speeds | Signal bars, SIM card |
| HOME | Fiber & AirFiber | Router, WiFi |
| ENTERTAINMENT | TV, music & games | Play button, music note, gamepad |
| FINANCE | One-stop finance | Rupee sign, wallet, card |
| AICLOUD | Easy backup | Cloud, AI sparkle |
| SHOPPING | Best deals | Shopping bag, cart |

**"More >"** link below grid — expands to full service directory.

**Style:** White card with subtle border, 8-12px internal padding, rounded corners. Each tile is ~equal width. Icon clusters are 24x24px mini app icons in a row.

---

## 3. Promotional Banner Carousel

Horizontal swipe carousel sitting below the service grid.

| Element | Details |
|---------|---------|
| Card style | Full-bleed image with text overlay |
| Indicator | Dot pagination (3 dots visible = 3 slides) |
| Content | Deal callouts: "Flat 25% off + 50% cashback", "Free 5G storage JioCloud" |
| CTA button | "Find out more" — small filled button inside card |
| Auto-advance | Yes, with pause on touch |

**Style:** Rounded corners (12-16px), drop shadow, full-width minus padding. Height ~120px. Rich imagery with gradient overlays for text readability.

---

## 4. Account Status Bar

Persistent bar showing active connection.

| Element | Details |
|---------|---------|
| Shield icon | Jio brand mark (small, blue) |
| Account label | "Postpaid 97XXXXXX43" (masked number) |
| Chevron | Right arrow for expand |
| Tabs below | "Data" | "Plan" toggle |

**Style:** White card, subtle top border, full width. ~56px height. The tabs below use an underline active indicator (4px solid #0F3CC9).

---

## 5. Quick Action Tiles (Right Panel)

Grid of shortcut tiles for frequent actions.

| Tile | Icon Style |
|------|-----------|
| Recharge | Arrow-circle-up |
| Daily deals | Gift/tag icon |
| Internet / Mobile | Toggle switch between two |
| Support | Headset icon |
| "Aaj ki Deals" | Burst/star badge (red/yellow) |
| Recharge with MyJio | Jio logo + action |
| View my plan | Document/list icon |

**Style:** Small square tiles (~64x64px), centered icon above label text (10-11px). Light background, rounded 12px corners. 2-column or 3-column grid.

---

## 6. Mini App Cards (Side Panels)

Individual service screens rendered as overlapping cards in the marketing view. Each represents a distinct app-within-app:

### Movies / Entertainment Card
- Full-bleed poster imagery
- Category label top-left (bold, white on dark overlay)
- Horizontal scroll of content thumbnails

### Shopping Card
- Product grid or deal cards
- Price tags with strikethrough for discounts
- "Best deals" badge

### Games Card
- Character/mascot imagery (cartoon style)
- Game title + play button
- Category: "Games" label

### Music Player Card
- Album art (large, square)
- Transport controls: skip back, play/pause, skip forward
- Song title + artist
- Category: "Music" label
- Mini progress bar

### Finance Card
- **Savings widget:** "Savings ₹4,12X" — large number display
- **Current account:** "Current account ₹129.X"
- Horizontal card layout with currency symbol prominent
- Category: "Finance" label

### Home Internet Card
- WiFi signal strength indicator (animated arcs)
- Connection status
- Speed display
- Category: "Home internet" label

---

## 7. Data Usage Widgets

From selfcare/account screens:

| Widget | Description |
|--------|-------------|
| Circular gauge | Donut/ring chart showing data consumed vs remaining |
| Usage breakdown | Bar segments by app/category |
| Daily tracker | Line or bar chart of daily consumption |
| Remaining data | Large number + unit (e.g., "12.5 GB left") |
| Speed indicator | Current connection speed display |
| Data/Voice/SMS tabs | Segmented control to switch usage view |

---

## 8. Plan & Recharge Cards

| Component | Description |
|-----------|-------------|
| Plan card | Price (₹ large), validity (days), data amount, benefits list |
| Benefit icons | Data icon, calling icon, SMS icon, OTT logo thumbnails |
| Validity badge | "84 days" in pill/badge |
| Compare toggle | Side-by-side plan comparison |
| Category tabs | "Popular", "Data", "Entertainment", "International" |
| Recharge CTA | Full-width button at card bottom |

**Price typography:** Rupee symbol (₹) in JioType Bold, large size (24-32px). Amount right next to it. Uses the custom Rupee font (RupeeForadian) for the ₹ glyph.

---

## 9. Bottom Tab Bar

**MyJio Main App** — 6 tabs (confirmed from screenshot Mar 2026):

| Tab | Icon | Description |
|-----|------|-------------|
| Jio | Jio circle logo | Home / super-app launcher |
| Mobile | Phone/device | Mobile services & recharge |
| Fiber | WiFi arcs | Home internet |
| Finance | Currency/₹ | JioFinance / UPI |
| Play | Play button | Entertainment / gaming |
| Cloud | Cloud | JioAICloud / backup |

**Sub-app bottom bars change per service:**
- **Shopping** sub-app: Shopping | Categories | Account | Cart
- **JioTV** sub-app: Home | TV guide | News | Movies | Shows
- **JioSaavn** sub-app: JioTunes | Browse | MyLibrary | OfflineStore | Profile
- **JioGames** sub-app: FunZone | Browse | ... | Profile

**Style:** 6 tabs, Jio logo tab uses the blue circle mark as icon. Icons are outlined style with filled state for active. Active indicator: icon fills + label turns #0F3CC9.

---

## 10. HelloJio AI Chatbot

| Component | Description |
|-----------|-------------|
| Chat bubble | Conversational UI with bot avatar |
| Quick replies | Pill-shaped suggestion chips |
| Input bar | Text field + send button + mic icon |
| Bot avatar | Jio blue circle with "jio" mark |
| Typing indicator | Three-dot pulse animation |

---

## 11. Notification / Alert Patterns

| Type | Description |
|------|-------------|
| Toast | Slide-in from top, auto-dismiss, backdrop blur |
| Modal alert | Centered card with blur overlay (rgba(0,0,0,0.65)) |
| Banner | Sticky top banner for promotions |
| Badge count | Red circle with number on bell/tab icons |
| In-app notification | Card-based list with timestamp + action buttons |

---

## 12. Payment / Transaction Widgets

| Widget | Description |
|--------|-------------|
| UPI payment | Amount input + UPI ID + "Pay" button |
| Transaction history | List items: icon + merchant + amount + timestamp |
| Bill card | Utility name + amount due + due date + "Pay now" CTA |
| Payment success | Checkmark animation + amount + transaction ID |
| Saved cards | Horizontal scroll of masked card numbers |

---

## 13. Icon System

Based on all observed screens:

| Property | Value |
|----------|-------|
| Style | **Outlined / line icons** (not filled, not duotone) |
| Weight | Medium stroke (~1.5-2px) |
| Size grid | 24px (standard), 20px (compact), 32px (featured) |
| Color | `#141414` on white, `#FFFFFF` on blue, `#0F3CC9` for active states |
| Corner style | Rounded joins, rounded caps |
| Consistency | Uniform stroke width across all icons |

Common glyphs observed:
- Signal bars, WiFi arcs, Router, SIM card
- Play, Pause, Skip forward, Skip back
- Shopping bag, Cart, Tag/price
- Wallet, Rupee (₹), Card, Bank
- Cloud, Upload, Download, Sync
- Bell, Shield, Lock, Headset
- Camera, QR code, Mic, Search
- Star, Gift, Trophy, Medal
- Heart, Thumbs up, Share
- Document, List, Chart/graph
- Home, Grid, User/profile, Settings, Gear
- Arrow right/left/up/down, Chevron, Plus, Minus, Close (X)
- Calendar, Clock, Timer

---

## 14. Color Usage in App Context

| Context | Color | Usage |
|---------|-------|-------|
| Primary actions | `#0F3CC9` | Buttons, active tabs, links, headers |
| Secondary actions | `#DA2441` | Deals badges, alerts, "new" indicators |
| Entertainment | `#D9008D` (magenta) | JioCinema, entertainment cards |
| Finance | `#00C853` (green) | Positive amounts, savings, success |
| Error / Warning | `#DA2441` | Error states, due dates |
| Neutral surface | `#FFFFFF` | Cards, sheets |
| Background | `#F5F5F5` or `#FAFAFA` | Page background |
| Muted text | `rgba(0,0,0,0.65)` | Subtitles, captions |
| Dividers | `#E0E0E0` | Between list items, grid borders |
| Promotional blue BG | `#0F3CC9` to `#3D5FE3` | Hero sections, feature showcases |

---

## 15. Layout & Spacing Patterns

| Pattern | Value |
|---------|-------|
| Card corner radius | 12-16px (larger than web's 8px) |
| Card padding | 16px |
| Grid gap | 12px between tiles |
| Section spacing | 24-32px between sections |
| Side margins | 16px (mobile) |
| Bottom tab height | 56px + safe area |
| Card shadow | `0 2px 8px rgba(0,0,0,0.08)` |
| Banner radius | 12-16px |
| Pill/chip radius | 100px (full round) |
| Icon-to-label gap | 4-6px |

---

## 16. Animation & Motion

| Element | Motion |
|---------|--------|
| Card transitions | opacity + translateY (fade up) |
| Tab switch | Horizontal slide with fade |
| Pull to refresh | Spring animation |
| Bottom sheet | Slide up with backdrop fade |
| Skeleton loading | Shimmer/pulse on placeholder cards |
| Page transitions | Cross-fade between service screens |
| Carousel | Elastic overscroll at ends |

---

## Design DNA Summary

The MyJio app follows the **Asian super-app** pattern:

1. **Service grid as home** — not a feed, not a dashboard. A launcher.
2. **Dense but organized** — lots of information, but clearly zoned into sections
3. **Card-heavy** — every piece of content lives in a card
4. **Banner promotions** — carousel of deals is always present
5. **Account status persistent** — you always see your plan/data
6. **Mini-app model** — each service opens its own full experience
7. **Finance integrated** — UPI, bills, savings visible from home
8. **Entertainment integrated** — music, TV, games one tap away
9. **AI touch points** — HelloJio chatbot, AiCloud, search
10. **Reward/gamification** — quizzes, wheel spins, daily deals

This is the vocabulary to build FROM — not toward. Every workshop deliverable should feel native to this ecosystem.
