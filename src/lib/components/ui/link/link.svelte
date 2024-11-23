<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { page } from '$app/stores';

	interface Props extends HTMLAnchorAttributes {
		active?: boolean;
	}

	let { children, ...rest }: Props = $props();

	let active = $derived($page.url.pathname === rest.href);
</script>

<a
	{...rest}
	class:active
	class={`
    relative
    inline-block
    py-1
    transition-colors
    duration-300
    ease-in-out
    ${rest.class}
  `}
>
	<span class="relative z-10">
		{@render children?.()}
	</span>
	<span
		class="
      absolute
      left-0
      bottom-0
      w-full
      h-[1px]
      bg-current
      origin-center
      scale-x-0
      transition-transform
      duration-300
      ease-out
      group-hover:scale-x-100
    "
	></span>
</a>

<style lang="postcss">
	a:hover span:last-child {
		transform: scaleX(1);
	}

	.active {
		@apply text-primary;
	}
</style>
