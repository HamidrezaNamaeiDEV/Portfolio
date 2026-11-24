<script setup lang="ts">
import { computed, ref } from 'vue'

interface Choice {
  id: string
  name: string
}

const props = defineProps<{
  title: string
  filterLabel: string
  choices: Choice[]
}>()
const value = defineModel<string[]>({ required: true })
const query = ref('')
const filtered = computed(() => {
  const term = query.value.trim().toLowerCase()
  return props.choices.filter(({ name }) => name.toLowerCase().includes(term))
})
</script>

<template>
  <fieldset class="relations">
    <legend>{{ props.title }}</legend>
    <p v-if="!props.choices.length" class="muted">
      There are no records to link yet.
    </p>
    <template v-else>
      <div class="relations__header">
        <label>
          <span class="a11y-only">{{ props.filterLabel }}</span>
          <input
            v-model="query"
            type="search"
            :placeholder="props.filterLabel"
          />
        </label>
        <span class="muted">{{ value.length }} selected</span>
      </div>
      <div class="relations__list">
        <label v-for="choice in filtered" :key="choice.id">
          <input v-model="value" type="checkbox" :value="choice.id" />
          {{ choice.name }}
        </label>
        <p v-if="!filtered.length" class="muted">No matching records.</p>
      </div>
    </template>
  </fieldset>
</template>

<style scoped>
.relations {
  margin: 0;
  min-inline-size: 0;
  padding: 0.875rem;
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius);
}

legend {
  padding-inline: 0.25rem;
  font-weight: 650;
}

.relations__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: space-between;
  margin-block-end: 0.5rem;
  font-size: 0.8125rem;
}

.relations__list {
  max-block-size: 13rem;
  overflow: auto;
  padding: 0.25rem;
}

.relations__list label {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-block-size: 2.25rem;
  cursor: pointer;
  overflow-wrap: anywhere;
}

.relations__list input {
  flex-shrink: 0;
}

@media (max-width: 25rem) {
  .relations__header {
    flex-wrap: wrap;
  }
}
</style>
