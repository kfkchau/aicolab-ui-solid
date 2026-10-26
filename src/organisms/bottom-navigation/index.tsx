/** @jsxImportSource @solidjs/web */
import type { JSX } from '@solidjs/web'
import { children, For, Show } from 'solid-js'
import {
	type ClassProp,
	type ColorTreatmentProps,
	colorTreatmentData,
} from '../../shared/color-treatment'
import { defineKnobs, type KnobProps, mergeKnobStyle } from '../../shared/knobs'

export interface BottomNavigationItem<Id extends string = string> {
	id: Id
	label: string
	/** Lazy, like every ui-solid slot: `items` is a prop getter, so an eager
	 *  element here would be re-created on every read — outside its render
	 *  position, which breaks hydration claiming. */
	icon: () => JSX.Element
}

/** Per-instance styling contract (see shared/knobs.ts). The bar itself is
 * structural base chrome; the ACTIVE wash and the raised centre chip are
 * painted family surfaces (pairs), primary by default. */
const knobs = defineKnobs('ui-bnav', {
	height: '<length>',
	labelSize: '<length>',
	chipSize: '<length>',
	activeWash: '<color>',
	activeInk: '<color>',
	chipSurface: '<color>',
	chipInk: '<color>',
	chipActiveSurface: '<color>',
	chipActiveInk: '<color>',
})

/** Canonical raised-centre anatomy for a BottomNavigation action.
 *  It is intentionally independent of the action mechanism, so it can sit
 *  inside a RadialMenu trigger or another consumer-supplied control. */
export function BottomNavigationCentreContent(props: {
	icon: JSX.Element
	label: JSX.Element
	active?: boolean
}) {
	return (
		<>
			<span class="ui-bottom-navigation-centre-chip" data-ui-plate="" data-active={props.active ? '' : undefined}>
				{props.icon}
			</span>
			<span class="ui-bottom-navigation-item-label">{props.label}</span>
		</>
	)
}

export function BottomNavigation<Id extends string>(
	props: {
		label?: string
		items: readonly BottomNavigationItem<Id>[]
		activeId?: Id | null
		onSelect: (id: Id) => void
		/** Elevated action occupies the centre slot between the two item halves. */
		centre: JSX.Element
		/** An accessory before the first item (a consumer-supplied control
		 *  where an item will not do: an account menu as a bar item), the
		 *  mirror of `trailing`; both take `accessoryClass`. */
		leading?: JSX.Element
		trailing?: JSX.Element
		accessoryClass?: ClassProp
		class?: ClassProp
	} & ColorTreatmentProps &
		KnobProps<typeof knobs.spec>,
) {
	// Single-eval slot resolution (children()) — element-JSX props are getters;
	// double evaluation breaks hydration claiming.
	const leading = children(() => props.leading)
	const trailing = children(() => props.trailing)
	const split = (): number => Math.ceil(props.items.length / 2)
	const renderItems = (items: readonly BottomNavigationItem<Id>[]) => (
		<For each={items}>
			{(item) => (
				<button
					type="button"
					class="ui-bottom-navigation-item"
					aria-label={item.label}
					data-active={props.activeId === item.id ? '' : undefined}
					onClick={() => props.onSelect(item.id)}
				>
					<span class="ui-bottom-navigation-item-icon">{item.icon()}</span>
					<span class="ui-bottom-navigation-item-label">{item.label}</span>
				</button>
			)}
		</For>
	)

	return (
		<nav
			class={['ui-bottom-navigation', props.class]}
			aria-label={props.label ?? 'Main'}
			{...colorTreatmentData(props)}
			{...knobs.attributes(props)}
			style={mergeKnobStyle(knobs.style(props), undefined)}
		>
			<Show when={leading()}>
				<div class={['ui-bottom-navigation-accessory', props.accessoryClass]}>{leading()}</div>
			</Show>
			{renderItems(props.items.slice(0, split()))}
			<span class="ui-bottom-navigation-centre-slot" aria-hidden="true" />
			<div class="ui-bottom-navigation-centre">{props.centre}</div>
			{renderItems(props.items.slice(split()))}
			<Show when={trailing()}>
				<div class={['ui-bottom-navigation-accessory', props.accessoryClass]}>{trailing()}</div>
			</Show>
		</nav>
	)
}
