<script>
	import { page } from '$app/state';
	import CounterForm from '$lib/CounterForm.svelte';
</script>

<svelte:head>
	<title>{page.params.id === 'new' ? 'New counter' : 'Edit counter'}</title>
</svelte:head>

<!-- Remount on id change so the form re-seeds from the right counter. -->
{#key page.params.id}
	<CounterForm id={page.params.id} />
{/key}
