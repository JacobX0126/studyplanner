import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserSettings, updateUserSettings } from './settingsApi'

export const userSettingsQueryKey = ['user_settings'] as const

export function useUserSettings() {
  return useQuery({ queryKey: userSettingsQueryKey, queryFn: getUserSettings })
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateUserSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userSettingsQueryKey }),
  })
}
