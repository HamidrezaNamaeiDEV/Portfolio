<script setup lang="ts">
defineOptions({ name: 'AdminOverviewPage' })

import type { AdminContent } from '@a/contracts'
import { apiMessage, isUnauthorized } from '../utils/api-errors'

const { session, message: sessionMessage } = useAdminSession()
const { data, pending, error, refresh } = await useFetch<AdminContent>(
  '/api/content',
  { key: 'admin-overview-content', immediate: Boolean(session.value.owner) },
)
const failure = computed(() =>
  error.value
    ? apiMessage(error.value, 'Could not load portfolio counts.')
    : '',
)

watch(
  () => session.value.owner?.email,
  (email) => {
    if (email) {
      void refresh()
    } else {
      data.value = undefined
    }
  },
)

watch(
  error,
  (value) => {
    if (value && isUnauthorized(value)) {
      session.value = { owner: null }
      sessionMessage.value = 'Your session expired. Sign in again to continue.'
    }
  },
  { immediate: true },
)
</script>

<template>
  <DashboardOverview
    :content="data"
    :pending="pending"
    :failure="failure"
    @retry="refresh()"
  />
</template>
