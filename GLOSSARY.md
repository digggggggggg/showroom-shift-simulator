# Glossary

- **Shift** - one timed round of play (30 seconds of game time).
- **Round 1 (in-store mixing)** - every paint order is mixed on site at 1 second per tin.
- **Round 2 (hub model)** - orders of more than 5 tins are dispatched to the London Hub; smaller orders are still mixed on site.
- **Till** - the counter where the clerk serves the front customer.
- **Clerk** - the single associate. States: `at_till`, `walking_to_shaker`, `mixing`, `walking_to_till`.
- **Unmanned** - any clerk state other than `at_till`. While unmanned, queue patience drains 1.8x faster and unmanned seconds accrue.
- **Shaker** - the mixing machine at the back; occupies the clerk for 1 second per tin.
- **Hub dispatch** - Round 2 action that sends a large order off site; the clerk stays at the till.
- **Customer category** - `TRADE_LARGE` (6-10 tins, hub eligible), `MIX_SMALL` (2-5 tins), `ADVICE` (colour consultation or 1 sample pot).
- **Patience** - per-customer countdown; at zero the customer walks out.
- **Walkout** - a customer leaving unserved; their order value counts as lost.
- **Captured / Lost** - revenue earned / revenue lost to walkouts in the current shift.
- **Floater** - the short-lived `+GBP` / `-GBP` text drifting above a customer.
- **Briefing / Bottleneck report / Comparison report** - the modal shown before Round 1, after Round 1, and after Round 2.
- **Sim** - the pure simulation in `src/game/`: state in, state out, no DOM, no audio.
- **Step** - one fixed-timestep advance of the sim (1/60 s of game time).
- **Original** - `original/showroom-shift-simulator.html`, the reference implementation and the approved design.
