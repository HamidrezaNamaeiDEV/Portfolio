<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ label: string }>()
const image = defineModel<string>({ required: true })
const emit = defineEmits<{ loading: [busy: boolean] }>()
const failure = ref('')
let selection = 0

const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']

function remove() {
  selection += 1
  image.value = ''
  failure.value = ''
  emit('loading', false)
}

function pick(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const id = ++selection
  emit('loading', false)
  failure.value = ''
  if (!allowedTypes.includes(file.type) || file.size > 256 * 1024) {
    failure.value = 'Choose a PNG, JPEG or WebP image of 256 KiB or less.'
    return
  }

  const reader = new FileReader()
  emit('loading', true)
  reader.onload = () => {
    if (id === selection && typeof reader.result === 'string') {
      image.value = reader.result
      emit('loading', false)
    }
  }
  reader.onerror = () => {
    if (id === selection) {
      failure.value = 'Could not read this image. Choose another file.'
      emit('loading', false)
    }
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="image-picker">
    <label class="label">
      {{ props.label }}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        @change="pick"
      />
      <small class="muted">PNG, JPEG or WebP. Maximum 256 KiB.</small>
    </label>
    <p v-if="failure" class="feedback" role="alert">{{ failure }}</p>
    <div v-if="image" class="image-picker__preview">
      <img
        :src="image"
        :alt="`${props.label} preview`"
        width="92"
        height="72"
      />
      <button type="button" class="button" @click="remove">
        Remove {{ props.label.toLowerCase() }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.image-picker {
  display: grid;
  gap: 0.75rem;
}

.image-picker__preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

img {
  background: var(--admin-input);
  border: 1px solid var(--admin-line);
  object-fit: contain;
  padding: 0.25rem;
}

input::file-selector-button {
  border: 0;
  border-radius: 0.25rem;
  background: var(--admin-hover);
  color: var(--a-color-text);
  font: inherit;
  margin-inline-end: 0.5rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
}
</style>
