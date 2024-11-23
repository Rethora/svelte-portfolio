<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Variant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption';
	type Color = 'primary' | 'secondary' | 'light' | 'dark';

	interface Props extends HTMLAttributes<HTMLHeadingElement> {
		variant?: Variant;
		color?: Color;
		children: Snippet;
	}

	let { variant = 'body', color = 'dark', children, ...rest }: Props = $props();

	const variantStyles = {
		h1: 'text-4xl md:text-5xl font-bold',
		h2: 'text-3xl md:text-4xl font-bold',
		h3: 'text-2xl md:text-3xl font-semibold',
		h4: 'text-xl md:text-2xl font-semibold',
		h5: 'text-lg md:text-xl font-medium',
		h6: 'text-base md:text-lg font-medium',
		body: 'text-base font-normal',
		caption: 'text-sm font-normal'
	};

	const colorStyles = {
		primary: 'text-blue-600 dark:text-blue-400',
		secondary: 'text-gray-600 dark:text-gray-400',
		light: 'text-gray-100',
		dark: 'text-gray-900 dark:text-gray-100'
	};

	const combinedClasses = $derived(`${variantStyles[variant]} ${colorStyles[color]} ${rest.class}`);
</script>

{#if variant === 'h1'}
	<h1 class={combinedClasses}>{@render children()}</h1>
{:else if variant === 'h2'}
	<h2 class={combinedClasses}>{@render children()}</h2>
{:else if variant === 'h3'}
	<h3 class={combinedClasses}>{@render children()}</h3>
{:else if variant === 'h4'}
	<h4 class={combinedClasses}>{@render children()}</h4>
{:else if variant === 'h5'}
	<h5 class={combinedClasses}>{@render children()}</h5>
{:else if variant === 'h6'}
	<h6 class={combinedClasses}>{@render children()}</h6>
{:else if variant === 'caption'}
	<span class={combinedClasses}>{@render children()}</span>
{:else}
	<p class={combinedClasses}>{@render children()}</p>
{/if}
