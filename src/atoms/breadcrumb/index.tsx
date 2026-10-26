/** @jsxImportSource @solidjs/web */
import type { JSX } from '@solidjs/web'
import { createEffect, createMemo, createSignal, For, omit, onSettled, Show } from 'solid-js'
import {
	colorTreatmentData,
	type ClassProp,
	type ColorTreatmentProps,
} from '../../shared/color-treatment'
import { defineKnobs, mergeKnobStyle, type KnobProps } from '../../shared/knobs'

/** One step in a Breadcrumb trail. `href` renders a link, `onSelect` a
 *  button; with neither the crumb is inert text. The FINAL item is always
 *  rendered as the current location (`aria-current="page"`, non-interactive)
 *  regardless of handlers — a breadcrumb never links to where you already
 *  are. */
export interface BreadcrumbItem {
	label: string
	/** A mark before the label — a place's hex mark, an icon — as a lazy
	 *  slot (made where it renders, never shared between two spots). The
	 *  `words` labels mode lays mark and name out as a row. */
	icon?: () => JSX.Element
	href?: string
	onSelect?: () => void
}

/** Per-instance styling contract (see shared/knobs.ts). The separator
 * CHARACTER is an always-emitted STRING custom property (mandatory wire):
 * the ::before that renders it sits on each <li>, and attr() reads only the
 * matched element's own attributes, so the value must arrive by
 * inheritance — which attributes can't do and variables can. */
const knobs = defineKnobs('ui-breadcrumb', {
	fontSize: '<length>',
	gap: '<length>',
	separatorInk: '<color>',
	linkInk: '<color>',
	focusRing: '<color>',
})

type BreadcrumbProps = Omit<JSX.HTMLAttributes<HTMLElement>, 'class'> & {
	class?: ClassProp
	items: readonly BreadcrumbItem[]
	/** Accessible name for the nav landmark. Default "Breadcrumb". */
	label?: string
	/** Separator character between steps. Default "›". */
	separator?: string
	/** How the steps read. `caps` (the default) — small capitals in the label
	 *  face: a trail as a label. `words` — the names of places as words in
	 *  the body face, each beside its mark; an ancestor lights as a plate
	 *  on hover and the current step is bold: a trail as wayfinding. */
	labels?: 'caps' | 'words'
	/** The trail fitted to its room (the content box of the element that
	 *  holds the nav): where the steps are wider than the room, the leading
	 *  steps go, newest kept, never fewer than `keep` of them (the place and
	 *  its parent, by default); narrower still, the trail scrolls sideways
	 *  with the current step in view. A phone's trail, a trail beside a map. */
	fit?: boolean
	/** The fewest steps `fit` ever shows. Default 2. */
	keep?: number
	/** The most steps shown whatever the room (never fewer than `keep`): a
	 *  trail of eight steps says less than one of three. */
	maxSteps?: number
} & ColorTreatmentProps &
	KnobProps<typeof knobs.spec>

/**
 * Wayfinding trail for nested locations (`<nav>` + `<ol>` semantics, chevron
 * separators from CSS). Ancestors are quiet until hovered/focused; the
 * current location carries the text ink. Apps that need a dismiss affordance
 * put it BESIDE the nav — the trail itself is pure location.
 */
export function Breadcrumb(props: BreadcrumbProps) {
	const attributes = omit(
		props,
		'class',
		'style',
		'items',
		'label',
		'separator',
		'labels',
		'fit',
		'keep',
		'maxSteps',
		'colorBase',
		'colorLevel',
		'variant',
		'fontSize',
		'gap',
		'separatorInk',
		'linkInk',
		'focusRing',
	)
	const last = createMemo(() => props.items.length - 1)

	// ── fit: how many leading steps are hidden ──
	// Every step is rendered; the hidden ones carry `hidden`. Their widths are
	// read while they are visible (all steps show when the trail changes) and
	// kept, so a wider room can bring them back without showing them first.
	// The room is the parent's content box: the host gives the trail a box as
	// wide as the room, never one sized by the trail itself.
	let root: HTMLElement | undefined
	let trailEl: HTMLOListElement | undefined
	const [hidden, setHidden] = createSignal(0)
	const trailKey = createMemo(() => props.items.map((item) => item.label).join('\u0000'))
	const widths = new Map<number, number>()
	let separator = 0
	let frame: number | null = null
	const measure = (): void => {
		if (!trailEl) return
		const steps = Array.from(trailEl.children)
		steps.forEach((step, index) => {
			if (!(step instanceof HTMLElement) || step.hidden) return
			const content = step.firstElementChild
			if (!(content instanceof HTMLElement)) return
			widths.set(index, content.offsetWidth)
			const before = steps[index - 1]
			if (before instanceof HTMLElement && !before.hidden)
				separator = step.offsetWidth - content.offsetWidth
		})
	}
	const room = (): number => {
		const box = root?.parentElement
		if (!box) return Infinity
		const style = getComputedStyle(box)
		return box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
	}
	const fitTo = (): void => {
		frame = null
		const count = props.items.length
		if (!props.fit || !trailEl || count === 0) return
		measure()
		const keep = Math.max(1, props.keep ?? 2)
		const ceiling = Math.max(0, count - keep)
		const floor = Math.min(ceiling, Math.max(0, count - Math.max(keep, props.maxSteps ?? count)))
		const gap = parseFloat(getComputedStyle(trailEl).columnGap) || 0
		const needed = (from: number): number => {
			let width = 0
			for (let index = from; index < count; index++) width += widths.get(index) ?? 0
			return width + Math.max(0, count - from - 1) * (separator + gap)
		}
		// The room less the nav's own padding and border round the list.
		const available = room() - ((root?.offsetWidth ?? 0) - trailEl.clientWidth)
		let next = floor
		while (next < ceiling && needed(next) > available) next++
		if (next !== hidden()) setHidden(next)
		// Narrower than the fewest steps: the current step stays in view.
		trailEl.scrollLeft = trailEl.scrollWidth
	}
	const queue = (): void => {
		if (frame !== null || typeof requestAnimationFrame !== 'function') return
		frame = requestAnimationFrame(fitTo)
	}
	// A new trail shows every step first, so each is measured; then fits.
	createEffect(trailKey, () => {
		widths.clear()
		setHidden(0)
		queue()
	})
	createEffect(
		() => ({ fit: props.fit, keep: props.keep, max: props.maxSteps }),
		() => queue(),
	)
	onSettled(() => {
		if (!props.fit || !root || typeof ResizeObserver === 'undefined') return
		const observer = new ResizeObserver(queue)
		observer.observe(root)
		if (root.parentElement) observer.observe(root.parentElement)
		document.fonts?.ready.then(queue)
		return () => {
			observer.disconnect()
			if (frame !== null) cancelAnimationFrame(frame)
		}
	})
	/** How many leading steps are hidden: the measure's answer, within the cap. */
	const pruned = createMemo((): number => {
		if (!props.fit) return 0
		const count = props.items.length
		const keep = Math.max(1, props.keep ?? 2)
		const ceiling = Math.max(0, count - keep)
		const floor = Math.min(ceiling, Math.max(0, count - Math.max(keep, props.maxSteps ?? count)))
		return Math.min(ceiling, Math.max(floor, hidden()))
	})

	return (
		<nav
			{...attributes}
			{...colorTreatmentData(props)}
			{...knobs.attributes(props)}
			ref={(el) => {
				root = el
			}}
			class={['ui-breadcrumb', props.class]}
			data-labels={props.labels ?? 'caps'}
			data-fit={props.fit ? '' : undefined}
			style={mergeKnobStyle(
				{
					...knobs.style(props),
					'--ui-breadcrumb-separator': `"${(props.separator ?? '›').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
				},
				props.style,
			)}
			aria-label={props.label ?? 'Breadcrumb'}
		>
			<ol
				class="ui-breadcrumb-trail"
				ref={(el) => {
					trailEl = el
				}}
			>
				<For each={props.items}>
					{(item, index) => (
						<li class="ui-breadcrumb-step" hidden={index() < pruned()}>
							<Show
								when={index() < last() && (item.href || item.onSelect)}
								fallback={
									<span
										class="ui-breadcrumb-here"
										aria-current={index() === last() ? 'page' : undefined}
									>
										{item.icon?.()}
										{item.label}
									</span>
								}
							>
								<Show
									when={item.href}
									fallback={
										<button
											type="button"
											class="ui-breadcrumb-link"
											onClick={() => item.onSelect?.()}
										>
											{item.icon?.()}
											{item.label}
										</button>
									}
								>
									<a class="ui-breadcrumb-link" href={item.href}>
										{item.icon?.()}
										{item.label}
									</a>
								</Show>
							</Show>
						</li>
					)}
				</For>
			</ol>
		</nav>
	)
}
