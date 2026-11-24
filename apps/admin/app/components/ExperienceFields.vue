<script setup lang="ts">
import { persianMonths } from '@a/contracts'
import type { EditorDraft } from '../utils/content-editor'

const draft = defineModel<EditorDraft>({ required: true })
</script>

<template>
  <div class="field-pair">
    <label class="label">
      Company
      <input v-model="draft.company" required maxlength="160" />
    </label>
    <label class="label">
      Position
      <input v-model="draft.position" required maxlength="160" />
    </label>
  </div>

  <fieldset class="date-fields">
    <legend>Dates (Persian calendar)</legend>
    <div class="field-pair">
      <label class="label">
        Start month
        <select v-model="draft.startMonth" required>
          <option :value="null" disabled>Choose a month</option>
          <option
            v-for="(month, index) in persianMonths"
            :key="month"
            :value="index + 1"
          >
            {{ month }}
          </option>
        </select>
      </label>
      <label class="label">
        Start year
        <input
          v-model.number="draft.startYear"
          type="number"
          min="1"
          max="9999"
          required
        />
      </label>
      <label class="label">
        End month
        <select v-model="draft.endMonth">
          <option :value="null">Unknown</option>
          <option
            v-for="(month, index) in persianMonths"
            :key="month"
            :value="index + 1"
          >
            {{ month }}
          </option>
        </select>
      </label>
      <label class="label">
        End year
        <input
          v-model.number="draft.endYear"
          type="number"
          min="1"
          max="9999"
        />
      </label>
    </div>
  </fieldset>

  <label class="label">
    Employment status
    <select v-model="draft.employmentStatus">
      <option :value="null">Unknown</option>
      <option value="active">Active</option>
      <option value="ended">Ended</option>
    </select>
  </label>
</template>

<style scoped>
.date-fields {
  min-inline-size: 0;
  margin: 0;
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius);
  padding: 0.875rem;
}

legend {
  padding-inline: 0.25rem;
  font-weight: 650;
}
</style>
