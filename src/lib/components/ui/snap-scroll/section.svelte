<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id: number;
		color: string;
		active: boolean;
		children: Snippet;
	}

	let { id, color, active, children }: Props = $props();
</script>

<section
	class="section h-screen w-full flex items-center justify-center snap-start {color}"
	data-id={id}
>
	<div
		class="text-white text-4xl font-bold transform transition-all duration-500 {active
			? 'scale-125'
			: 'scale-100'}"
	>
		{@render children()}
	</div>
</section>

<style>
	.section {
		scroll-snap-align: start;
	}
</style>
