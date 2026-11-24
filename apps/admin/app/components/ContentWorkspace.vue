<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef } from 'vue'
import type { AdminContent, ContentKind } from '@a/contracts'
import {
  recordDetail,
  recordName,
  sections,
  type ContentRecord,
} from '../utils/content-editor'
import { apiMessage, isUnauthorized } from '../utils/api-errors'

const emit = defineEmits<{ expired: [] }>()
const primary = ['skills', 'experiences', 'projects'] as const
const taxonomy = ['categories', 'proficiencies'] as const
const kind = ref<ContentKind>('skills')
const section = computed(() => sections[kind.value])
const content = shallowRef<AdminContent>()
const loading = ref(true)
const loadFailure = ref('')
const search = ref('')
const status = ref('')
const editing = shallowRef<{ item?: ContentRecord }>()
const editor = ref<{ dirty: boolean }>()
const sectionTitle = ref<HTMLElement>()
const busy = ref(false)
const editorFailure = ref('')
const notice = ref('')

const records = computed<ContentRecord[]>(
  () => content.value?.[kind.value] ?? [],
)
const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return records.value.filter(
    (record) =>
      (!status.value || record.status === status.value) &&
      (!term ||
        [recordName(record), recordDetail(record)].some((text) =>
          text?.toLowerCase().includes(term),
        )),
  )
})

async function load() {
  loading.value = true
  loadFailure.value = ''
  try {
    content.value = await $fetch<AdminContent>('/api/content')
  } catch (error) {
    if (isUnauthorized(error)) {
      emit('expired')
      return
    }
    loadFailure.value = apiMessage(error, 'Could not load content. Try again.')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function mayLeaveEditor() {
  return (
    !busy.value &&
    (!editor.value?.dirty || window.confirm('Discard your unsaved changes?'))
  )
}

function showSection(next: ContentKind) {
  if (kind.value === next || !mayLeaveEditor()) return
  editing.value = undefined
  kind.value = next
  editorFailure.value = ''
  notice.value = ''
  clearFilters()
}

function clearFilters() {
  search.value = ''
  status.value = ''
}

function openEditor(item?: ContentRecord) {
  if (editing.value && editing.value.item?.id === item?.id) return
  if (!mayLeaveEditor()) return
  editorFailure.value = ''
  notice.value = ''
  editing.value = { item }
}

async function closeEditor() {
  editing.value = undefined
  editorFailure.value = ''
  await nextTick()
  sectionTitle.value?.focus()
}

function success(action: 'saved' | 'deleted') {
  const { singular } = section.value
  notice.value = `${singular.charAt(0).toUpperCase()}${singular.slice(1)} ${action}.`
}

function handleMutationError(error: unknown) {
  if (isUnauthorized(error)) {
    emit('expired')
    return
  }
  editorFailure.value = apiMessage(
    error,
    'Could not save this change. Try again.',
  )
}

async function save(data: Record<string, unknown>) {
  if (!editing.value || busy.value) return
  busy.value = true
  editorFailure.value = ''
  try {
    await $fetch('/api/content', {
      method: 'POST',
      body: { kind: kind.value, id: editing.value.item?.id, data },
    })
    success('saved')
    await closeEditor()
    await load()
  } catch (error) {
    handleMutationError(error)
  } finally {
    busy.value = false
  }
}

async function remove(item: ContentRecord) {
  if (busy.value) return
  busy.value = true
  editorFailure.value = ''
  try {
    await $fetch(`/api/content/${kind.value}/${encodeURIComponent(item.id)}`, {
      method: 'DELETE',
    })
    success('deleted')
    await closeEditor()
    await load()
  } catch (error) {
    handleMutationError(error)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="workspace">
    <aside class="workspace__sidebar">
      <nav aria-label="Content areas">
        <div class="nav-group">
          <p>Portfolio</p>
          <button
            v-for="item in primary"
            :key="item"
            type="button"
            :aria-current="kind === item ? 'page' : undefined"
            :disabled="busy"
            @click="showSection(item)"
          >
            {{ sections[item].title }}
          </button>
        </div>
        <div class="nav-group">
          <p>Skill settings</p>
          <button
            v-for="item in taxonomy"
            :key="item"
            type="button"
            :aria-current="kind === item ? 'page' : undefined"
            :disabled="busy"
            @click="showSection(item)"
          >
            {{ sections[item].title }}
          </button>
        </div>
      </nav>
    </aside>

    <main class="workspace__main" aria-labelledby="section-title">
      <div class="section-heading">
        <h1 id="section-title" ref="sectionTitle" tabindex="-1">
          {{ section.title }}
        </h1>
        <button
          v-if="content"
          class="button button--primary"
          type="button"
          :disabled="busy"
          @click="openEditor()"
        >
          Add {{ section.singular }}
        </button>
      </div>

      <p v-if="notice" class="notice" role="status">{{ notice }}</p>
      <ContentEditor
        v-if="content && editing"
        :key="`${kind}:${editing.item?.id ?? 'new'}`"
        ref="editor"
        :kind="kind"
        :content="content"
        :item="editing.item"
        :pending="busy"
        :failure="editorFailure"
        @save="save"
        @remove="remove"
        @cancel="closeEditor"
      />

      <div v-if="loading" class="empty-state" role="status">
        Loading content…
      </div>
      <div v-else-if="loadFailure" class="empty-state">
        <p class="feedback" role="alert">{{ loadFailure }}</p>
        <button class="button" type="button" @click="load">Try again</button>
      </div>
      <template v-else>
        <div v-if="records.length" class="list-toolbar">
          <label class="search-field">
            <span class="a11y-only">Search {{ section.empty }}</span>
            <input
              v-model="search"
              type="search"
              :placeholder="`Search ${section.empty}`"
            />
          </label>
          <label class="filter-field">
            <span class="a11y-only">Filter by publication status</span>
            <select v-model="status">
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <p class="muted list-count" aria-live="polite">
            {{ filtered.length }} of {{ records.length }}
          </p>
        </div>
        <div v-if="filtered.length" class="table-wrap">
          <table>
            <caption class="a11y-only">
              {{
                section.title
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Status</th>
                <th scope="col">Order</th>
                <th scope="col"><span class="a11y-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filtered" :key="item.id">
                <th scope="row">
                  <span>{{ recordName(item) }}</span>
                  <small v-if="recordDetail(item)" class="muted">{{
                    recordDetail(item)
                  }}</small>
                </th>
                <td>
                  <span
                    class="publication-status"
                    :class="{
                      'publication-status--live':
                        item.status === 'published' && item.visible,
                    }"
                  >
                    {{ item.status === 'draft' ? 'Draft' : 'Published' }}
                  </span>
                  <small v-if="!item.visible" class="muted">Hidden</small>
                </td>
                <td class="order">{{ item.sortOrder }}</td>
                <td>
                  <button
                    class="button row-action"
                    type="button"
                    :aria-label="`Edit ${recordName(item)}`"
                    :disabled="busy"
                    @click="openEditor(item)"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">
          <template v-if="records.length">
            <p>No {{ section.empty }} match these filters.</p>
            <button class="button" type="button" @click="clearFilters">
              Clear filters
            </button>
          </template>
          <template v-else>
            <h2>No {{ section.empty }} yet</h2>
            <p class="muted">Add a record to start building this section.</p>
          </template>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.workspace {
  display: grid;
  grid-template-columns: 13.5rem minmax(0, 1fr);
  max-inline-size: var(--admin-max);
  min-block-size: calc(100svh - 4.25rem);
  margin-inline: auto;
}

.workspace__sidebar {
  padding: var(--a-space-8) var(--a-space-4);
  border-inline-end: 1px solid var(--admin-line);
}

.workspace__sidebar nav,
.nav-group {
  display: grid;
  gap: 0.375rem;
}

.workspace__sidebar nav {
  gap: 1.75rem;
}

.nav-group p {
  padding-inline: 0.75rem;
  margin-block-end: 0.125rem;
  color: var(--a-color-muted);
  font-size: 0.8125rem;
  font-weight: 550;
}

.nav-group button {
  min-block-size: 2.5rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid transparent;
  border-radius: var(--admin-radius);
  background: transparent;
  color: var(--a-color-text);
  text-align: start;
  font-weight: 600;
  cursor: pointer;
}

.nav-group button:hover:not([aria-current]) {
  background: var(--admin-hover);
}

.nav-group button[aria-current] {
  background: var(--admin-hover);
  border-color: var(--admin-line);
  color: var(--a-color-accent);
}

.workspace__main {
  min-inline-size: 0;
  padding: var(--a-space-8) clamp(1rem, 4vw, 3rem);
}

.section-heading,
.list-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.section-heading {
  justify-content: space-between;
  margin-block-end: var(--a-space-8);
}

.list-toolbar {
  margin-block-end: var(--a-space-4);
}

.search-field {
  flex: 0 1 22rem;
}

.filter-field {
  flex: 0 0 auto;
}

.list-count {
  margin-inline-start: auto;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

.notice {
  margin-block: 0 var(--a-space-4);
  color: var(--a-color-accent);
}

.table-wrap {
  overflow: auto;
  border: 1px solid var(--admin-line);
  border-radius: 0.75rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: start;
  background: var(--admin-panel);
  font-size: 0.875rem;
}

th,
td {
  border-block-end: 1px solid var(--admin-line);
  padding: 0.75rem clamp(0.375rem, 2vw, 1rem);
  text-align: start;
  overflow-wrap: anywhere;
}

thead th {
  color: var(--a-color-muted);
  font-weight: 650;
  background: var(--admin-input);
}

tbody th {
  font-weight: 650;
  inline-size: 62%;
}

tbody tr:last-child :is(th, td) {
  border-block-end: 0;
}

tbody th small,
td small {
  display: block;
  font-size: 0.8125rem;
  font-weight: 450;
}

tbody th small {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.publication-status {
  display: inline-block;
  font-weight: 650;
}

.publication-status--live {
  color: var(--a-color-accent);
}

.order {
  font-variant-numeric: tabular-nums;
}

.row-action {
  min-block-size: 2.625rem;
  padding-inline: 0.625rem;
}

.empty-state {
  display: grid;
  justify-items: start;
  gap: 0.625rem;
  padding: 1.5rem;
  border: 1px solid var(--admin-line);
  border-radius: 0.75rem;
}

@media (max-width: 55rem) {
  .workspace {
    display: block;
  }

  .workspace__sidebar {
    padding: var(--a-space-4);
    border-inline-end: 0;
    border-block-end: 1px solid var(--admin-line);
  }

  .workspace__sidebar nav {
    gap: 0.5rem;
  }

  .nav-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
  }

  .nav-group p {
    inline-size: 7rem;
  }
}

@media (max-width: 32rem) {
  .section-heading h1 {
    font-size: 1.625rem;
  }

  .section-heading {
    margin-block-end: var(--a-space-4);
  }

  .search-field {
    flex-basis: 100%;
  }

  .nav-group p {
    flex-basis: 100%;
  }
}
</style>
