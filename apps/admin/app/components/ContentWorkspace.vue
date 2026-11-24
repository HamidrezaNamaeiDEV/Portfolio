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

const primary = ['skills', 'experiences', 'projects'] as const
const taxonomy = ['categories', 'proficiencies'] as const
const route = useRoute()
function initialKind(value: unknown): ContentKind {
  return value === 'experiences' ||
    value === 'projects' ||
    value === 'categories' ||
    value === 'proficiencies'
    ? value
    : 'skills'
}
const kind = ref<ContentKind>(initialKind(route.query.section))
const section = computed(() => sections[kind.value])
const content = shallowRef<AdminContent>()
const loading = ref(true)
const loadFailure = ref('')
const search = ref('')
const status = ref('')
const visibility = ref('')
const categoryId = ref('')
const proficiencyId = ref('')
const selected = ref<string[]>([])
const editing = shallowRef<{ item?: ContentRecord }>()
const editor = ref<{ dirty: boolean }>()
const sectionTitle = ref<HTMLElement>()
const busy = ref(false)
const editorFailure = ref('')
const notice = ref('')
const { session, message: sessionMessage } = useAdminSession()

const records = computed<ContentRecord[]>(
  () => content.value?.[kind.value] ?? [],
)
const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return records.value.filter(
    (record) =>
      (!status.value || record.status === status.value) &&
      (!visibility.value ||
        (visibility.value === 'visible' ? record.visible : !record.visible)) &&
      (!categoryId.value ||
        ('proficiency' in record &&
          record.category?.id === categoryId.value)) &&
      (!proficiencyId.value ||
        ('proficiency' in record &&
          record.proficiency?.id === proficiencyId.value)) &&
      (!term ||
        [recordName(record), recordDetail(record)].some((text) =>
          text?.toLowerCase().includes(term),
        )),
  )
})
const selectedOutsideFilteredCount = computed(() => {
  const filteredIds = new Set(filtered.value.map(({ id }) => id))
  return selected.value.filter((id) => !filteredIds.has(id)).length
})

async function load() {
  loading.value = true
  loadFailure.value = ''
  try {
    content.value = await $fetch<AdminContent>('/api/content')
    if (route.query.create === 'skill' && kind.value === 'skills') {
      await nextTick()
      openEditor()
      await navigateTo('/content')
    }
  } catch (error) {
    if (isUnauthorized(error)) {
      expireSession()
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

function expireSession() {
  session.value = { owner: null }
  sessionMessage.value = 'Your session expired. Sign in again to continue.'
}

function showSection(next: ContentKind) {
  if (kind.value === next || !mayLeaveEditor()) return
  editing.value = undefined
  kind.value = next
  editorFailure.value = ''
  notice.value = ''
  selected.value = []
  clearFilters()
}

function clearFilters() {
  search.value = ''
  status.value = ''
  visibility.value = ''
  categoryId.value = ''
  proficiencyId.value = ''
}

function toggleAllFiltered(event: Event) {
  const checked = (event.currentTarget as HTMLInputElement).checked
  selected.value = checked ? filtered.value.map(({ id }) => id) : []
}

function toggleSelected(id: string, event: Event) {
  const checked = (event.currentTarget as HTMLInputElement).checked
  selected.value = checked
    ? [...new Set([...selected.value, id])]
    : selected.value.filter((selectedId) => selectedId !== id)
}

function clearSelection() {
  selected.value = []
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
    expireSession()
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

async function bulkChange(
  change: 'status' | 'visible',
  value: string | boolean,
) {
  const ids = [...selected.value]
  if (!ids.length || busy.value) return
  const action =
    change === 'status'
      ? value === 'published'
        ? 'publish'
        : 'move to drafts'
      : value
        ? 'show'
        : 'hide'
  if (
    !window.confirm(
      `${action[0]!.toUpperCase()}${action.slice(1)} ${ids.length} selected skills?`,
    )
  )
    return

  busy.value = true
  editorFailure.value = ''
  try {
    await $fetch('/api/content/bulk', {
      method: 'POST',
      body: { ids, [change]: value },
    })
    selected.value = []
    notice.value = `Updated ${ids.length} selected skills.`
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
    <main class="workspace__main" aria-labelledby="section-title">
      <nav class="workspace__sections" aria-label="Content areas">
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
        <span class="workspace__divider" aria-hidden="true"></span>
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
      </nav>

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
            <span>Search</span>
            <input
              v-model="search"
              type="search"
              :placeholder="`Search ${section.empty}`"
            />
          </label>
          <label class="filter-field">
            <span>Publication status</span>
            <select v-model="status">
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <label class="filter-field">
            <span>Visibility</span>
            <select v-model="visibility" aria-label="Filter by visibility">
              <option value="">All visibility</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>
          <label v-if="kind === 'skills'" class="filter-field">
            <span>Category</span>
            <select v-model="categoryId" aria-label="Filter by category">
              <option value="">All categories</option>
              <option
                v-for="item in content?.categories"
                :key="item.id"
                :value="item.id"
              >
                {{ item.name }}
              </option>
            </select>
          </label>
          <label v-if="kind === 'skills'" class="filter-field">
            <span>Proficiency</span>
            <select v-model="proficiencyId" aria-label="Filter by proficiency">
              <option value="">All levels</option>
              <option
                v-for="item in content?.proficiencies"
                :key="item.id"
                :value="item.id"
              >
                {{ item.name }}
              </option>
            </select>
          </label>
          <p class="muted list-count" aria-live="polite">
            {{ filtered.length }} of {{ records.length }}
          </p>
        </div>
        <div
          v-if="kind === 'skills' && selected.length"
          class="bulk-actions"
          role="group"
          aria-label="Selected skill actions"
        >
          <span aria-live="polite">
            {{ selected.length }} selected<span
              v-if="selectedOutsideFilteredCount"
              >, {{ selectedOutsideFilteredCount }} outside current
              filters</span
            >
          </span>
          <button
            class="button"
            type="button"
            :disabled="busy"
            @click="clearSelection"
          >
            Clear selection
          </button>
          <button
            class="button button--primary"
            type="button"
            :disabled="busy"
            @click="bulkChange('status', 'published')"
          >
            Publish selected skills
          </button>
          <button
            class="button"
            type="button"
            :disabled="busy"
            @click="bulkChange('status', 'draft')"
          >
            Move selected skills to drafts
          </button>
          <button
            class="button"
            type="button"
            :disabled="busy"
            @click="bulkChange('visible', false)"
          >
            Hide selected skills
          </button>
          <button
            class="button"
            type="button"
            :disabled="busy"
            @click="bulkChange('visible', true)"
          >
            Show selected skills
          </button>
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
                <th scope="col">
                  <label v-if="kind === 'skills'" class="select-all">
                    <input
                      type="checkbox"
                      aria-label="Select all filtered skills"
                      :checked="
                        filtered.length > 0 &&
                        filtered.every((item) => selected.includes(item.id))
                      "
                      :disabled="busy"
                      @change="toggleAllFiltered"
                    />
                    <span>Name</span>
                  </label>
                  <span v-else>Name</span>
                </th>
                <th scope="col">Publication status</th>
                <th scope="col">Order</th>
                <th scope="col"><span class="a11y-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filtered" :key="item.id">
                <th scope="row">
                  <div class="record-name">
                    <input
                      v-if="kind === 'skills'"
                      type="checkbox"
                      :aria-label="`Select ${recordName(item)}`"
                      :checked="selected.includes(item.id)"
                      :disabled="busy"
                      @change="toggleSelected(item.id, $event)"
                    />
                    <img
                      v-if="'proficiency' in item && item.logo"
                      :src="item.logo"
                      :alt="`${item.name} logo`"
                      width="36"
                      height="36"
                    />
                    <div class="record-name__text">
                      <span>{{ recordName(item) }}</span>
                      <small v-if="recordDetail(item)" class="muted">{{
                        recordDetail(item)
                      }}</small>
                    </div>
                  </div>
                </th>
                <td class="status-cell">
                  <span class="cell-label">Status</span>
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
                <td class="order">
                  <span class="cell-label">Order</span>
                  {{ item.sortOrder }}
                </td>
                <td class="action-cell">
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
  max-inline-size: var(--admin-max);
  min-block-size: calc(100svh - 4.25rem);
  margin-inline: auto;
}

.workspace__sections {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-block-end: var(--a-space-6);
  border-block-end: 1px solid var(--admin-line);
  padding-block-end: var(--a-space-2);
}

.workspace__sections button {
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

.workspace__sections button:hover:not([aria-current]) {
  background: var(--admin-hover);
}

.workspace__sections button[aria-current] {
  background: var(--admin-hover);
  border-color: var(--admin-line);
  color: var(--a-color-accent);
}

.workspace__divider {
  inline-size: 1px;
  block-size: 1.5rem;
  margin-inline: 0.25rem;
  background: var(--admin-line);
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
  display: grid;
  flex: 1 1 16rem;
  min-inline-size: min(100%, 16rem);
  gap: 0.25rem;
}

.filter-field {
  display: grid;
  flex: 0 1 12rem;
  min-inline-size: min(100%, 9rem);
  gap: 0.25rem;
  color: var(--a-color-muted);
  font-size: 0.8125rem;
}

.list-count {
  margin-inline-start: auto;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

.bulk-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--a-space-2);
  margin-block-end: var(--a-space-4);
  padding: var(--a-space-3);
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius);
  background: var(--admin-panel);
}

.bulk-actions > span {
  margin-inline-end: auto;
  color: var(--a-color-muted);
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
  overflow-wrap: break-word;
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
  margin-block-start: 0.125rem;
  overflow-wrap: break-word;
}

.record-name {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-inline-size: 0;
}

.record-name img {
  flex: 0 0 auto;
  inline-size: 2.25rem;
  block-size: 2.25rem;
  border: 1px solid var(--admin-line);
  border-radius: 0.375rem;
  background: var(--admin-input);
  object-fit: contain;
  padding: 0.125rem;
}

.record-name__text {
  min-inline-size: 0;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.select-all input {
  flex: 0 0 auto;
}

.cell-label {
  display: none;
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

@media (max-width: 32rem) {
  .section-heading h1 {
    font-size: 1.625rem;
  }

  .section-heading {
    margin-block-end: var(--a-space-4);
  }

  .search-field {
    min-inline-size: 100%;
  }

  .workspace__main {
    padding-block-start: var(--a-space-4);
  }

  .workspace__sections {
    flex-wrap: wrap;
    overflow: visible;
  }

  .workspace__sections button {
    flex: 0 0 auto;
  }

  .workspace__divider {
    display: none;
  }

  .table-wrap {
    overflow: visible;
    border: 0;
  }

  table,
  tbody {
    display: block;
    background: transparent;
  }

  thead {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    clip-path: inset(50%);
    overflow: hidden;
    white-space: nowrap;
  }

  tbody {
    display: grid;
    gap: var(--a-space-2);
  }

  tbody tr {
    display: grid;
    grid-template-areas: 'name status action' 'name order action';
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 0.375rem 0.625rem;
    padding: var(--a-space-3);
    border: 1px solid var(--admin-line);
    border-radius: var(--a-radius-surface);
    background: var(--admin-panel);
  }

  tbody tr:last-child :is(th, td) {
    border-block-end: 0;
  }

  tbody th {
    grid-area: name;
    inline-size: auto;
    min-inline-size: 0;
    padding: 0;
    border: 0;
    word-break: normal;
  }

  tbody td {
    padding: 0;
    border: 0;
  }

  .status-cell {
    grid-area: status;
    white-space: nowrap;
  }

  .order {
    grid-area: order;
    display: flex;
    justify-content: flex-end;
    gap: 0.375rem;
    white-space: nowrap;
  }

  .action-cell {
    grid-area: action;
  }

  .cell-label {
    display: inline;
    color: var(--a-color-muted);
    font-size: 0.75rem;
    font-weight: 450;
  }

  .status-cell .cell-label {
    display: none;
  }
}
</style>
