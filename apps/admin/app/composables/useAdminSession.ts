interface AdminSession {
  owner: { email: string } | null
}

export function useAdminSession() {
  const session = useState<AdminSession>('admin-session', () => ({
    owner: null,
  }))
  const message = useState('admin-session-message', () => '')
  return { session, message }
}
