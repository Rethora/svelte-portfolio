<script>
	import { onMount } from 'svelte';
	import { slide, fly } from 'svelte/transition';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { Link } from '$lib/components/ui/link';
	import { setMode, resetMode } from 'mode-watcher';
	import Sun from 'svelte-radix/Sun.svelte';
	import Moon from 'svelte-radix/Moon.svelte';
	let isOpen = $state(false);
	let isScrolled = $state(false);

	// TODO: Active link style
	// TODO: Hover link style

	let mounted = $state(false);

	const toggleMenu = () => {
		isOpen = !isOpen;
	};

	onMount(() => {
		mounted = true;
		const handleScroll = () => {
			isScrolled = window.scrollY > 20;
		};

		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

{#if mounted}
	<nav
		class="fixed w-full z-10 transition-all duration-300"
		class:bg-background={isScrolled}
		class:shadow-md={isScrolled}
		in:fly={{ y: -50, duration: 1000, delay: 300 }}
	>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-16">
				<div class="flex items-center">
					<a href="/" class="flex-shrink-0">
						<img class="h-8 w-8" src="https://via.placeholder.com/32" alt="Logo" />
					</a>
					<div class="hidden md:block">
						<div class="ml-10 flex items-baseline space-x-4">
							<Link href="/">Home</Link>
							<Link href="/about">About</Link>
							<a
								href="/services"
								class="text-foreground hover:bg-muted px-3 py-2 rounded-md text-sm font-medium"
								>Services</a
							>
							<a
								href="/contact"
								class="text-foreground hover:bg-muted px-3 py-2 rounded-md text-sm font-medium"
								>Contact</a
							>
						</div>
					</div>
				</div>
				<div class="flex items-center space-x-4">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild let:builder>
							<Button builders={[builder]} variant="outline" size="icon">
								<Sun
									class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
								/>
								<Moon
									class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
								/>
								<span class="sr-only">Toggle theme</span>
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							<DropdownMenu.Item on:click={() => setMode('light')}>Light</DropdownMenu.Item>
							<DropdownMenu.Item on:click={() => setMode('dark')}>Dark</DropdownMenu.Item>
							<DropdownMenu.Item on:click={() => resetMode()}>System</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					<div class="md:hidden">
						<button
							onclick={toggleMenu}
							class="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
							aria-expanded="false"
						>
							<span class="sr-only">Open main menu</span>
							{#if isOpen}
								<svg
									class="block h-6 w-6"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							{:else}
								<svg
									class="block h-6 w-6"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 6h16M4 12h16M4 18h16"
									/>
								</svg>
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>

		{#if isOpen}
			<div class="md:hidden" transition:slide={{ duration: 300 }}>
				<div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
					<a
						href="/"
						class="text-foreground hover:bg-muted block px-3 py-2 rounded-md text-base font-medium"
						>Home</a
					>
					<a
						href="/about"
						class="text-foreground hover:bg-muted block px-3 py-2 rounded-md text-base font-medium"
						>About</a
					>
					<a
						href="/services"
						class="text-foreground hover:bg-muted block px-3 py-2 rounded-md text-base font-medium"
						>Services</a
					>
					<a
						href="/contact"
						class="text-foreground hover:bg-muted block px-3 py-2 rounded-md text-base font-medium"
						>Contact</a
					>
				</div>
			</div>
		{/if}
	</nav>
{/if}
