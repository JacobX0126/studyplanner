import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { weekStart } from '@/lib/date'
import { getFriendsScreenTime, getMyScreenTime, upsertMyScreenTime } from './screenTimeApi'

export function useMyScreenTime() {
  return useQuery({ queryKey: ['my-screen-time', weekStart()], queryFn: () => getMyScreenTime() })
}

export function useUpsertScreenTime() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (minutes: number) => upsertMyScreenTime(minutes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-screen-time'] }),
  })
}

export function useFriendsScreenTime(friendIds: string[]) {
  return useQuery({
    queryKey: ['friends-screen-time', weekStart(), friendIds.slice().sort().join(',')],
    queryFn: () => getFriendsScreenTime(friendIds),
    enabled: friendIds.length > 0,
  })
}
