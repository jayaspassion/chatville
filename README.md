# Chatville

A cozy Twitch-chat village with personal house defense. Up to 24 viewers claim houses, protect them from three different disasters, repair damage, rebuild rubble, and compete for the longest survival streak. No viewer account page or external game client: every game action happens in Twitch chat.

## Install and run

Requires Node.js 22 or newer.

```sh
npm install
cp .env.example .env
# Fill in your three Twitch values locally, then:
npm run dev
```

If `.env` already exists, edit it; **do not overwrite it**. The overlay is http://127.0.0.1:5173/ and the Node server listens on 127.0.0.1:3001. Keep this terminal running while streaming. Use Ctrl+C to stop. Restarting clears all houses, damage and stats because state is only in memory. Reloading the browser does not reset the game.

```sh
npm test          # deterministic rule and broadcaster identity tests
npm run build     # TypeScript check and overlay build
```

`npm start` starts only the production-mode chat/WebSocket server, with simulation disabled. For the supplied local OBS workflow use `npm run dev`, which starts server and overlay together.

## Twitch settings and token safety

Only three environment variables are required, all in the server-side `.env`:

| Variable | How to get it |
| --- | --- |
| `TWITCH_CHANNEL` | Your channel login from `twitch.tv/your_channel`, not the full URL. |
| `TWITCH_BOT_USERNAME` | The Twitch login of the account sending bot replies. Your broadcaster account works; a separate bot account is optional. |
| `TWITCH_OAUTH_TOKEN` | A **user access token belonging to that bot account**, with `chat:read` and `chat:edit` scopes. Raw and `oauth:`-prefixed tokens both work. |

Register an app at https://dev.twitch.tv/console/apps (verified email and 2FA required). Use the confidential client type and register `http://localhost:5173` as the redirect URI. Follow Twitch's user-access-token instructions at https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#implicit-grant-flow to authorize the bot account with the two IRC chat scopes. The Client ID is public; no Client Secret is required for that flow. Copy the access token from the redirect fragment into `.env`, then remove that fragment from the browser address bar. Do not share the redirected URL or token.

`.env` is gitignored; `.env.example` contains placeholders. Never put the token in the overlay, OBS URL, screenshots, chat, or repository. Tokens never appear in WebSocket state or application logs. The server prints the channel after Twitch confirms the join and prints a clear credential warning otherwise. Edit `.env` and restart the server when changing credentials. Replies and announcements respect chat rate limits. Launch warnings are prioritized ahead of queued milestone messages and send immediately when a rate-limit slot is available (normally within 1.8 seconds). Other messages may arrive after the visual update.

## OBS

Add a **Browser Source**, set URL to **http://127.0.0.1:5173/**, Width **1920**, Height **1080**, FPS **60**. The page background is transparent; its illustrated sky/grass scene is intentionally visible. The same 1920×1080 scene scales down to fit small preview windows. If an older tab shows a cropped or outdated scene, refresh it once.

The overlay reconnects automatically and preserves the last good village during a connection interruption. A server restart intentionally starts a new empty village.

## Commands

Commands are case-insensitive and ignore surrounding whitespace. Include the `!`. Viewers can type **`!help`** in Twitch chat at any time, even before joining, to receive the command guide. The overlay footer also points new viewers to it.

| Command | Who | Effect |
| --- | --- | --- |
| `!help` | Anyone | Bot replies with joining, each disaster defense, repair/rebuild, stats, upgrades, and broadcaster start commands. Works during disasters and without a house. |
| `!join` | Anyone | One pastel house per Twitch account, next free plot in a 6×4 grid. Duplicate joins and capacity overflow get a chat reply. |
| `!meteor` | Broadcaster | Start a 30-second meteor. Defend with `!shield`. |
| `!acidrain` | Broadcaster | Start 30 seconds of acid rain. Defend with `!umbrella`. |
| `!tornado` | Broadcaster | Start a 30-second tornado in a randomly chosen occupied defender row. Defend with `!anchor`. |
| `!disaster` | Broadcaster | Randomly pick one of those three disasters. |
| `!shield` | Eligible house | Glowing dome; protects your own house from a meteor fragment. |
| `!umbrella` | Eligible house | Umbrella; prevents subsequent acid damage ticks this round. |
| `!anchor` | Eligible house | Chains/stakes; protects your own house from a tornado. A launch-time defender outside the chosen row gets `you're safe this time!`. |
| `!repair` | Non-destroyed house | Idle only: remove one damage level, once per idle period. Replies with damage remaining. |
| `!rebuild` | Destroyed house | Restore to damage 0 on the same plot, with a bounce. Retain survived and best streak; current streak resets. |
| `!stats` | Anyone | Your survived count, current streak, best streak, and damage out of 3. Non-members get a join prompt. |

The broadcaster is identified from the authenticated Twitch sender login matching the configured channel; moderator status alone cannot start a disaster. Optional badge metadata is not required.

## Exact round and damage rules

- One disaster at a time, including the five-second outcome period. A start attempt during that period or with no non-destroyed house gets a chat reply. Non-broadcaster start attempts are silently ignored.
- Launch freezes the defender pool to all currently joined houses with damage below 3. A mid-round join still gets a house, but cannot defend or take damage that round.
- Meteor and acid put every launch-time defender at risk. Tornado chooses uniformly among rows containing a defender and puts only that row at risk; the warning stripe and banner show the row. The counter includes only at-risk houses.
- Only the matching defense counts, once per eligible house. Wrong defenses, repeats, destroyed houses, late joiners, strangers, and commands outside an active disaster are silently ignored (apart from the specified tornado-safe reply).
- Meteor: at 30 seconds each unshielded at-risk house takes **1** damage. One fragment per defender bounces with a spark when blocked or lands with a small house shake.
- Acid: unprotected at-risk houses take **1** damage at **15 seconds elapsed** and **1** at **30 seconds elapsed**. An umbrella between ticks prevents the second hit, but does not undo the first.
- Tornado: at 30 seconds each unanchored at-risk house takes **2** damage.
- Deadlines are server-authoritative. A command arriving exactly at a damage tick is processed **after** that tick. A delayed server tick processes every missed damage event once, in order.
- Damage is capped at **3**: **0 intact**, **1 cracked**, **2 burning with fire/smoke**, **3 rubble with a grey name**. Three small marks below each name show damage. Destroyed houses cannot defend or repair and are excluded from the next launch pool.
- Protections clear at 30 seconds. If nobody took damage during the round: fireworks and `VILLAGE SAVED!`. Otherwise `X houses hit, Y destroyed - type !repair or !rebuild`. Both counts refer to unique houses that took damage / became destroyed during that round, not damage ticks or old rubble.
- Outcome lasts five seconds; repair and new launches unlock after it fades. Damage remains. A fully defended round does not heal older damage.
- An intact repair attempt does not consume the allowance. A successful repair consumes it until the next disaster finishes. Second use replies `you already repaired - wait for the next disaster`.
- Rebuild is allowed whenever a house is destroyed. It does not add a house excluded at launch back into the frozen pool. If a launch-time defender is destroyed by the first acid tick and rebuilt during that round, it remains in that original pool and can protect against the second tick; it still cannot earn a survival for a round in which it took damage.

## Stats, streaks, and the crown

Each at-risk house that takes **no damage at all during a disaster** gains one survived and one current streak at resolution; best streak records its maximum. Damage resets streak immediately, including at acid's first tick. Houses outside the at-risk pool keep all stats unchanged.

Badges read `🛡 survived  🔥 current streak`. At streak 3, 5, or 10 the badge pulses and the bot posts `{name} is on a {n} disaster streak!`. Damage ending a streak of 3+ posts `{name}'s {n} streak has ended!` once. A gold crown sits above the highest streak of at least 3. Earlier reach wins ties; simultaneous later successes preserve that ordering. If the owner takes damage, the crown moves to the next eligible house or disappears. Repair never changes stats. Rebuild keeps lifetime survived/best and resets current streak to zero.

## Automatic house upgrades

Upgrades are cosmetic and based on **lifetime personal saves** (`survived`), not a consecutive streak and not the number of villages saved by others. Every five saves raises the house level and shows a short upgrade sparkle/banner; the bot announces the new level. `!stats` also reports house level and the next save threshold.

| Personal saves | Level | Appearance |
| --- | --- | --- |
| 0–4 | 1 | Warm, tiled-roof cottage |
| 5–9 | 2 | Garden cottage with flower boxes and shutters |
| 10–14 | 3 | Townhouse with side wings and dormer |
| 15–19 | 4 | Two-storey manor with upper windows and balcony details |
| 20–24 | 5 | Royal manor with turrets, flags and gold trim |
| 25+ | 6+ | Royal manor with an increasing prestige medallion; levels continue every five saves |

Damage and rebuild do not remove earned levels, since lifetime saves are preserved. Upgrades do not change damage limits, disaster timing or defense eligibility. Server restarts still reset all in-memory progress.

Each valid launch also posts a chat warning identifying the disaster, timing and required defense. Meteor: `A meteor is coming your way in 30 seconds! Type !shield to protect YOUR house!` Acid explicitly warns about the 15/30-second damage ticks; tornado names the chosen row. Random launches announce the disaster actually chosen. Busy, empty and unauthorized attempts never post a false launch warning.

To test the first upgrade, use `npm run demo -- streak meteor` on an empty village: at the fifth save the house changes from level 1 to level 2. A missed defense later resets streak, but not the new house style. Simulated chat notices remain local; use real Twitch commands to verify the public launch/upgrade messages. Automated tests cover later level thresholds, continuing prestige, and upgrade retention after rebuilding.

## Development simulation

Development-only `POST http://127.0.0.1:3001/simulate` accepts:

```json
{"username":"demo_alice","command":"!join","isBroadcaster":false}
```

It supports **every command in the table**, including stats, repair, rebuild and random disasters. Set `isBroadcaster: true` to simulate a start command. Simulated identities use a separate `sim:` namespace; they cannot impersonate a real account's house. Simulation replies return as JSON and simulated milestone announcements never post to Twitch. Houses and visuals appear in the real local overlay. No credentials are needed for these tests. The endpoint is unavailable in production mode and the server binds to loopback; do not publicly expose development ports.

A convenient Terminal function for manual tests:

```sh
cv() {
  curl -s http://127.0.0.1:3001/simulate \
    -H 'Content-Type: application/json' \
    -d "{\"username\":\"$1\",\"command\":\"$2\",\"isBroadcaster\":${3:-false}}"
  echo
}
cv demo_alice '!join'
cv demo_host '!meteor' true
cv demo_alice '!shield'
cv demo_alice '!stats'
```

## Exact disaster test recipes

For **each recipe**, first stop the local app with Ctrl+C and run `npm run dev` again to start with an empty village. Do not reset a village with real players you want to retain. Then run the chosen command below in a second terminal in this project folder. The included driver uses only `/simulate` and `/ws`, refuses non-empty villages, uses real 30-second timers, prints expected values, and leaves the final state visible. Keep the overlay open while it runs.

| Test | Command | Expected |
| --- | --- | --- |
| Meteor full save | `npm run demo -- save meteor` | All three houses have domes, counter 3/3, fragments bounce, fireworks; each survived/streak = 1, damage = 0. |
| Acid full save | `npm run demo -- save acidrain` | All have umbrellas before 15 seconds; no damage at either tick, counter 3/3, saved. |
| Tornado full save | `npm run demo -- save tornado` | Three houses are in row 1; warning stripe and moving funnel, all chains/stakes visible, counter 3/3, saved. |
| Meteor mixed + one destroyed | `npm run demo -- mixed meteor` | A preparation acid round leaves Alice 0, Bob 1, Cara 2. Target meteor protects only Alice: final damage **0/2/3**, two houses hit, one destroyed. |
| Acid mixed + one destroyed | `npm run demo -- mixed acidrain` | Preparation meteor hits only Cara (damage 1). Target acid protects only Alice: Bob reaches 2, Cara reaches 3; two hit, one destroyed. |
| Tornado mixed + one destroyed | `npm run demo -- mixed tornado` | Preparation meteor hits only Cara. Row 1 tornado anchors only Alice: Bob takes 2, Cara reaches 3; two hit, one destroyed. |

The driver prints `PASS` or fails an assertion if behavior differs. Full-save tests take about 30 seconds; mixed tests take about 65 seconds (two rounds plus the preparation banner). All three test houses fit row 1, so the tornado tests are deterministic even though real multi-row games choose randomly.

Manual equivalents after joining `demo_alice`, `demo_bob`, and `demo_cara`:

1. **Full save:** `cv demo_host '!meteor' true` then each viewer `!shield`, or `!acidrain`/`!umbrella`, or `!tornado`/`!anchor`. Defend immediately. Wait for zero and the saved banner.
2. **Mixed meteor:** launch acid; Alice umbrellas immediately; Bob umbrellas just after the countdown goes below 15; Cara never umbrellas. After the outcome disappears, launch meteor; only Alice shields. Expect Alice intact, Bob burning, Cara rubble.
3. **Mixed acid/tornado:** first launch a meteor, with only Alice and Bob shielding. After its outcome fades, launch the target disaster; only Alice uses the matching defense. Expect 0/2/3 damage.
4. **Repair/rebuild:** after any mixed outcome fades, `cv demo_bob '!repair'` gives 1 damage left and a cracked house. Repeat it: refused. `cv demo_cara '!repair'` says destroyed; `cv demo_cara '!rebuild'` restores the same plot with a bounce. `cv demo_cara '!stats'` confirms damage 0 and preserved lifetime stats.
5. **Random/broadcaster:** `cv demo_host '!disaster' true` starts one of the three. A start with no `true` does nothing. Another start during countdown/outcome gets a busy reply.
6. **Late/wrong defense:** join `demo_late` after launch; try its defense. Counter stays unchanged and it takes no damage this round. From an original defender, use a wrong defense or repeat the right one: no extra count.
7. **Tornado safe row:** join seven houses on a fresh server. A tornado selects occupied row 1 or 2. A launch-time defender in the other row gets `you're safe this time!` for `!anchor`; neither its stats nor damage change.

## Exact stats and crown tests

On a fresh village, run:

```sh
npm run demo -- streak meteor
```

This takes about 3½ minutes. It plays five full saves, verifies the first crown goes to Alice at streak 3 and stays there on ties, then makes Alice miss one round while Bob/Cara defend. Expected finish: Alice survived 5 / streak 0 / best 5 / damage 1; Bob/Cara survived 6 / streak 6 / best 6 / damage 0; Bob now wears the crown. The driver calls `!stats` for each house and prints its JSON reply.

For the **live Twitch milestone messages**, join real accounts and defend three consecutive at-risk rounds. At the third resolution each qualifying account gets the streak announcement and pulse; the earliest tied survivor wears the crown. Repeat through five, and through ten for the other milestone messages. Then let a streak-3+ account take damage: its streak-ended announcement should appear, and the crown should transfer or vanish. Chat notices are queued, so allow time for a full village's messages. Simulated tests deliberately do not send these notices to Twitch.

`npm test` also verifies disaster launch warnings, five-save upgrade thresholds/retention, 3/5/10 streak announcements, streak loss once across both acid ticks, crown ties and transfer, excluded tornado houses, exact deadlines, damage caps, rebuild retention, and repair limits using an injected clock—without waiting through live rounds.

## Built with Codex

Main build session: **`01a19d46-a400-7540-9065-700728cd79aa`**.

This project was implemented in this Codex chat from the user's Chatville briefs. Codex built the TypeScript/tmi.js chat server, full-state WebSocket updates, React/Vite overlay, original SVG/CSS village art, local simulation endpoint, and automated tests. The first version's join, meteor, shield, saved/hit outcomes and repair were verified on the user's real `jayaspassion` Twitch channel with the user's feedback. Codex diagnosed broadcaster recognition and fixed the preview's off-screen countdown by scaling the 1920×1080 scene to the viewport.

Stage 4 replaces the collective shield target with individual house defense, a data-driven three-disaster system, 0–3 damage, idle repairs, rebuilds, personal streaks and crown ordering, gameplay announcements, and repeatable local test recipes. It preserves the chat connection and local secret handling. The expanded game passed 25 automated tests and the production overlay build. Full-length local WebSocket/simulation runs verified complete saves for all three disasters; mixed-hit rounds for each disaster ending at damage 0/2/3 with exactly one destroyed house; a late acid umbrella; milestone/crown assignment; idle repair limits; rebuild retention; and !stats replies. Browser inspection at 1920×1080 verified protection/damage visuals and a filled 24-house layout with zero overlapping stat badges. Live multi-account Twitch acceptance testing of the expanded game is still needed before submission.

The subsequent visual pass, also built in this session, added a warmer illustrated landscape, garden paths, detailed original SVG house tiers, five-save cosmetic upgrades with continuing prestige, and prioritized Twitch disaster launch warnings. Every art asset remains CSS or inline SVG. An isolated test-clock preview was used to inspect all upgrade tiers without giving real players artificial saves.


## Disaster atmosphere and visibility

The overlay keeps its warm village scene at idle. Meteor rounds switch to a midnight-blue sky with stars, fire, drifting embers and luminous personal domes. Acid rain uses an emerald overcast sky, layered streaks, ground splashes and low toxic mist. Tornado rounds use slate-blue storm clouds, wind streaks, orbiting debris and a shaded funnel on the selected row. Names, stats and defenses stay bright against the darker scenery.

The disaster/outcome HUD is a compact 720×103 strip above the village, with the countdown, defense command, time bar and personal protection count. It does not overlap the house grid. Meteor fragments fan out from a shared breakup point. Meteor direction is calculated from its actual movement vector in the 1920×1080 scene; its tail is drawn in the opposite direction. Tornado warning stripes and funnel positions share the exact 160-pixel grid row pitch. Effects use inline SVG and requestAnimationFrame canvas particles; reduced-motion preferences suppress continuous particle animation and repeating environmental motion. The damage rules and 30-second timing are unchanged.

## Optional Twitch channel panel

You can copy the following into a “How to play Chatville” panel beneath your Twitch stream:

> Type **!join** in chat to claim a house. When a disaster starts, use the defense shown: **!shield** for meteors, **!umbrella** for acid rain (before 15 seconds), or **!anchor** for a tornado in your row. Join before launch to defend. Between rounds, **!repair** removes one damage level; use **!rebuild** if your house is rubble. **!stats** shows your progress. Every five personal saves upgrades your home. Type **!help** any time for the command guide.

`!help` is also available through `/simulate` with no broadcaster flag or prior join required.
