# @aicolab/ui-solid

Fork notes: [related UI forks and why they are useful](./FORKS.md).

A Solid v2 component system written in plain, modern CSS — no Tailwind, no
CSS-in-JS, no build-time styling step. Components are authored for the
platform the web is converging on (typed `attr()`, `@property`, `@scope`,
cascade layers, container style queries, anchor positioning, popovers) with
custom properties as the compatibility layer, so today's browsers get the
full experience and the move to the frontier syntax is a mechanical deletion.

Two systems do most of the work, and both are open to your own components:
the **three-axis colour system** (one set of attributes turns any element
into a themed surface with a full, contrast-correct role palette) and the
**knob system** (typed, per-instance styling props that reach hover states,
pseudo-elements and generated content while staying overridable from CSS).

## Install

```sh
pnpm add @aicolab/ui-solid solid-js @solidjs/web
```

`solid-js` and `@solidjs/web` (Solid v2) are peers. Import the stylesheet
once; it includes the reset and every layer:

```tsx
import '@aicolab/ui-solid/styles.css'
import { Button, Panel, RichList } from '@aicolab/ui-solid'

<Button colorBase="success" variant="soft" radius="6px">Approve</Button>
```

Browser floor: the Baseline-2026 feature set (`@scope`, `@property`,
`color-mix`, relative colours, popovers, container queries). Frontier
features are gated behind `@supports` and are pure enhancements.

## Entry points

| Import | What it is |
|---|---|
| `@aicolab/ui-solid` | Atoms, molecules and organisms (`Button`, `Panel`, `WorkspaceShell`, `BottomNavigation`, `CommandPalette`, `MonthCalendar`, …) plus `colorTreatmentData`, `defineKnobs`, `mergeKnobStyle` for your own components |
| `./styles.css`, `./reset.css` | The full layered stylesheet; the reset alone |
| `./themes/crimson-legal.css`, `./themes/night-ochre.css`, `./themes/brass.css` | Alternative theme roots (brass sets the surface finish: shine, rings, bevel, studs, shadow, lift, squircle corners) |
| `./depth-card` | The structured depth card |
| `./prosekit-solid`, `./prosekit-solid/presence`, `./prosekit-solid/block-identity`, `./prosekit-solid/styles.css` | ProseKit editor bindings with yjs presence |
| `./xp`, `./xp/styles.css` | The Windows XP-flavoured desktop kit |

Apps define the semantic `--color-*` family/content palette and font roles
on a theme root (see `src/styles.css` for the contract), plus three
ladders: the type scale (`--t-*`), the corner radii (`--r-*`) and the
surface finish (`--s-*`: how every plate — a panel, a card, a chip, a
button, a popover — is finished; its defaults are the flat house look, and
the resolver derives each plate's `--ui-surface-paint` and `--ui-edge`
from them, so components never paint a finish of their own).

An app's own surfaces take the finish the same way: put `data-ui-plate` on
the element, name its surface in `--ui-surface` when it is not
`--color-base-100`, state its corner once in `--_ui-radius` and paint
`border-radius: var(--_ui-radius)` from it (the corner studs are placed
from that same value and the theme's corner shape), and paint
`background: var(--ui-surface-paint)`, `box-shadow: var(--ui-edge), <its
ring>` and `corner-shape: var(--s-corner)`; lift it on hover with
`translate: 0 calc(-1 * var(--s-lift))`. Without the attribute nothing
derives the two roles on that element, so a theme's finish never reaches
it; without the corner the studs sit where they would on a square plate.
A finished edge reaches `--ui-edge-outset` beyond the plate's box (zero at
the house look): a layout that sets plates side by side adds it to their
gap, and to the inset of whatever holds them.

## The three-axis colour system

Every colour decision is up to three orthogonal choices, passed as props and
emitted as data attributes:

| Axis | Prop | Values |
|---|---|---|
| Family | `colorBase` | `primary` `secondary` `accent` `neutral` `info` `success` `warning` `error` |
| Strength | `colorLevel` | `50 100 200 … 900 950` (default `500`) |
| Presentation | `variant` | `solid` `soft` `outline` `ghost` `text` (default `solid`) |

A shared resolver stylesheet watches those attributes and computes ~30
**role variables** on the element: `--ui-surface`/`--ui-ink` (and their
hover and selected pairs), `--ui-color`/`--ui-content` (the strong pair),
`--ui-ink-muted`, `--ui-border`, `--ui-color-foreground`, `--ui-focus-ring`,
and so on. **Surfaces and inks travel as pairs** — whenever a rule paints a
role surface it paints the paired ink in the same breath, which is what makes
any family × level × variant combination readable without per-combination CSS.

Setting the base-colour attribute opts *any* element in, including plain
HTML; in Solid, `colorTreatmentData(props)` emits the attributes from the
same typed props the built-ins use. Consume roles, never the resolver's
private inputs — `pnpm check-boundaries` enforces this.

## The knob system

Knobs are typed, per-instance styling parameters. A component declares its
contract once with `defineKnobs('my-callout', { radius: '<length-percentage>' })`
and instances pass plain or reactive values. Every knob rides two wires: a
custom property (the Baseline path, consumed through `var(…, default)`
chains) and a data attribute (the frontier path, consumed via typed
`attr()` behind a support gate). Because the public wire is an ordinary
inheriting custom property, knobs are reachable from any ancestor's CSS
without props — how you restyle components you don't render. An explicit
knob prop beats an inherited default, which beats a mode preset, which
beats the component's token-live default.

Not everything is a knob: optional styling overrides are knobs; named modes
are data attributes (`size="sm"`); values supplied every render are direct,
`@property`-registered wires. `pnpm check-css-compatibility` parses every
sheet and fails on any drift between the two wires.

## Composition

Molecules drill the treatment axes into what they render and share them by
context with caller-authored children; slot content is yours to treat
(pass the family into your own atoms); containers may re-default their
items' public knob variables, and instances always override.

## Developing

A git submodule of the `aicolab-portal` monorepo (`packages/ui-solid`).

```sh
pnpm storybook                 # every component has a Playground story
pnpm check-types
pnpm check-boundaries          # Atomic Design import direction, private inputs
pnpm check-css-compatibility   # dual-wire pairing and fallbacks
```

Styles ship in cascade layers (`reset, ui.tokens, ui.resolver,
ui.foundations, ui.atoms, ui.molecules, ui.organisms, ui.enhancements`);
unlayered app CSS outranks all of it by default.

## Versioning and publishing

All `@aicolab/*` packages are versioned together. `pnpm publish` rewrites
`workspace:` and `catalog:` specifiers to concrete ranges in the published
manifest.

## License

Proprietary. Published to npm with restricted access; all rights reserved.
