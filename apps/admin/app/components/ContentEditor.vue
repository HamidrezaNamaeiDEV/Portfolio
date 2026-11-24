<script setup lang="ts">
import { computed, onMounted, ref, useId } from 'vue'
import type { AdminContent, ContentKind } from '@a/contracts'
import {
  draftError,
  draftPayload,
  prepareDraft,
  recordName,
  sections,
  type ContentRecord,
} from '../utils/content-editor'

const props = defineProps<{
  kind: ContentKind
  content: AdminContent
  item?: ContentRecord
  pending: boolean
  failure: string
}>()
const emit = defineEmits<{
  cancel: []
  save: [payload: Record<string, unknown>]
  remove: [item: ContentRecord]
}>()

const original = prepareDraft(props.item)
const draft = ref(prepareDraft(props.item))
const dirty = computed(
  () => JSON.stringify(draft.value) !== JSON.stringify(original),
)
const section = computed(() => sections[props.kind])
const heading = ref<HTMLElement>()
const confirmation = ref<HTMLDialogElement>()
const dialogTitle = useId()
const localError = ref('')
const readingImage = ref(false)
const action = computed(() => (props.item ? 'Edit' : 'Add'))

onMounted(() => heading.value?.focus())

function leave() {
  if (!dirty.value || window.confirm('Discard your unsaved changes?')) {
    emit('cancel')
  }
}

function save() {
  localError.value = draftError(draft.value, props.kind)
  if (localError.value || props.pending || readingImage.value) return
  emit('save', draftPayload(draft.value, props.kind, original.image))
}

function remove() {
  confirmation.value?.close()
  if (props.item) emit('remove', props.item)
}

defineExpose({ dirty })
</script>

<template>
  <section class="editor" aria-labelledby="editor-title">
    <div class="editor__heading">
      <div>
        <h2 id="editor-title" ref="heading" tabindex="-1">
          {{ action }} {{ section.singular }}
        </h2>
        <p v-if="props.item" class="muted">{{ recordName(props.item) }}</p>
      </div>
      <button
        type="button"
        class="button"
        :disabled="props.pending"
        @click="leave"
      >
        Close
      </button>
    </div>

    <form @submit.prevent="save">
      <fieldset class="editor__fields" :disabled="props.pending">
        <legend class="a11y-only">{{ section.singular }} details</legend>
        <ExperienceFields v-if="props.kind === 'experiences'" v-model="draft" />
        <label v-else class="label">
          Name
          <input v-model="draft.name" required maxlength="120" />
        </label>

        <label v-if="props.kind === 'projects'" class="label">
          Slug
          <input
            v-model="draft.slug"
            required
            maxlength="120"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            aria-describedby="slug-help"
          />
          <small id="slug-help" class="muted"
            >Use lowercase letters, numbers and hyphens.</small
          >
        </label>

        <label class="label">
          {{ props.kind === 'projects' ? 'Short description' : 'Description' }}
          <textarea v-model="draft.description" rows="3" maxlength="8000" />
        </label>

        <template v-if="props.kind === 'experiences'">
          <label class="label">
            Responsibilities
            <textarea
              v-model="draft.responsibilities"
              rows="3"
              maxlength="8000"
            />
          </label>
          <label class="label">
            Achievements
            <textarea v-model="draft.achievements" rows="3" maxlength="8000" />
          </label>
        </template>

        <template v-if="props.kind === 'skills'">
          <div class="field-pair">
            <label class="label">
              Category
              <select v-model="draft.categoryId">
                <option :value="null">No category</option>
                <option
                  v-for="item in props.content.categories"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.name }}
                </option>
              </select>
            </label>
            <label class="label">
              Proficiency level
              <select v-model="draft.proficiencyId">
                <option :value="null">No proficiency level</option>
                <option
                  v-for="item in props.content.proficiencies"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.name }}
                </option>
              </select>
            </label>
          </div>
          <RelationPicker
            v-model="draft.projectIds"
            title="Related projects"
            filter-label="Filter projects"
            :choices="props.content.projects"
          />
          <EditorImage
            v-model="draft.image"
            label="Logo"
            @loading="readingImage = $event"
          />
        </template>

        <RelationPicker
          v-if="props.kind === 'projects' || props.kind === 'experiences'"
          v-model="draft.skillIds"
          title="Related skills"
          filter-label="Filter skills"
          :choices="props.content.skills"
        />
        <EditorImage
          v-if="props.kind === 'projects'"
          v-model="draft.image"
          label="Cover image"
          @loading="readingImage = $event"
        />

        <div class="editor__publication">
          <div class="field-pair">
            <label class="label">
              Publication status
              <select v-model="draft.status">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label class="label">
              Display order
              <input
                v-model.number="draft.sortOrder"
                type="number"
                min="0"
                max="999999"
                required
              />
              <small class="muted">Lower numbers appear first.</small>
            </label>
          </div>
          <label class="editor__visibility">
            <input v-model="draft.visible" type="checkbox" />
            Visible on the public website
          </label>
          <p class="muted">
            {{
              draft.status === 'published' && draft.visible
                ? 'Saving updates the public website immediately.'
                : 'This record will be hidden from the public website.'
            }}
          </p>
        </div>

        <p v-if="localError || props.failure" class="feedback" role="alert">
          {{ localError || props.failure }}
        </p>
        <div class="editor__actions">
          <button
            v-if="props.item"
            type="button"
            class="button button--danger"
            @click="confirmation?.showModal()"
          >
            Delete {{ section.singular }}
          </button>
          <button
            type="submit"
            class="button button--primary"
            :disabled="props.pending || readingImage"
          >
            {{ props.pending ? 'Saving…' : `Save ${section.singular}` }}
          </button>
        </div>
      </fieldset>
    </form>

    <dialog ref="confirmation" :aria-labelledby="dialogTitle">
      <form method="dialog">
        <h2 :id="dialogTitle">Delete {{ section.singular }}?</h2>
        <p v-if="props.item" class="muted">
          {{ recordName(props.item) }} will be removed from the portfolio and
          its linked records.
        </p>
        <div class="editor__actions">
          <button type="submit" class="button" autofocus>Cancel</button>
          <button type="button" class="button button--danger" @click="remove">
            Confirm delete
          </button>
        </div>
      </form>
    </dialog>
  </section>
</template>

<style scoped>
.editor {
  margin-block-end: var(--a-space-8);
  padding: clamp(1rem, 4vw, 1.75rem);
  background: var(--admin-panel);
  border: 1px solid var(--admin-line);
  border-radius: 0.75rem;
}

.editor__heading,
.editor__actions,
.editor__visibility {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.editor__heading {
  justify-content: space-between;
  margin-block-end: var(--a-space-4);
}

.editor__heading h2:focus {
  outline: none;
}

.editor__heading p {
  margin-block-start: 0.375rem;
}

.editor__fields {
  display: grid;
  gap: 1.25rem;
  min-inline-size: 0;
  border: 0;
  margin: 0;
  padding: 0;
}

.editor__publication {
  display: grid;
  gap: 0.625rem;
  border-block-start: 1px solid var(--admin-line);
  padding-block-start: var(--a-space-4);
}

.editor__visibility {
  cursor: pointer;
}

.editor__actions {
  justify-content: flex-end;
  flex-wrap: wrap;
}

dialog {
  inline-size: min(calc(100% - 2rem), 27rem);
  padding: 1.5rem;
  border: 1px solid var(--admin-line);
  border-radius: 0.75rem;
  background: var(--admin-panel);
  color: var(--a-color-text);
}

dialog::backdrop {
  background: rgb(0 0 0 / 62%);
}

dialog form {
  display: grid;
  gap: var(--a-space-4);
}
</style>
