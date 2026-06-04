<script>
	import { page } from '$app/state';
	import { t } from '$lib/i18n.svelte';
	import CounterForm from '$lib/CounterForm.svelte';
</script>

<svelte:head>
	<title>{page.params.id === 'new' ? t('editor.titleNew') : t('editor.titleEdit')}</title>
</svelte:head>

<!-- Remount on id change so the form re-seeds from the right counter. -->
{#key page.params.id}
	<CounterForm id={page.params.id} />
{/key}
