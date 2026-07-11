import { useMutation } from '@tanstack/react-query'
import { login } from '../../../api/auth.api'

export function useLoginMutation() {
  const mutation = useMutation({
    mutationKey: ['admin-login'],
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      login(username, password),
  })

  return {
    login: (username: string, password: string) => mutation.mutateAsync({ username, password }),
    isLoggingIn: mutation.isPending,
    loginError: mutation.error,
  }
}
