import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMyProfile,
  getWeeklyDistractions,
  listFriendsSummary,
  listIncomingRequests,
  listOutgoingRequests,
  removeFriend,
  respondFriendRequest,
  sendFriendRequest,
} from './friendsApi'

export const friendsSummaryQueryKey = ['friends-summary'] as const
const incomingRequestsQueryKey = ['friend-requests', 'incoming'] as const
const outgoingRequestsQueryKey = ['friend-requests', 'outgoing'] as const

export function useMyProfile() {
  return useQuery({ queryKey: ['my-profile'], queryFn: getMyProfile })
}

export function useFriendsSummary() {
  return useQuery({ queryKey: friendsSummaryQueryKey, queryFn: listFriendsSummary })
}

export function useIncomingRequests() {
  return useQuery({ queryKey: incomingRequestsQueryKey, queryFn: listIncomingRequests })
}

export function useOutgoingRequests() {
  return useQuery({ queryKey: outgoingRequestsQueryKey, queryFn: listOutgoingRequests })
}

export function useWeeklyDistractions(friendIds: string[]) {
  return useQuery({
    queryKey: ['weekly-distractions', friendIds.slice().sort().join(',')],
    queryFn: () => getWeeklyDistractions(friendIds),
    enabled: friendIds.length > 0,
  })
}

function useInvalidateFriendQueries() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: friendsSummaryQueryKey })
    queryClient.invalidateQueries({ queryKey: incomingRequestsQueryKey })
    queryClient.invalidateQueries({ queryKey: outgoingRequestsQueryKey })
  }
}

export function useSendFriendRequest() {
  const invalidate = useInvalidateFriendQueries()
  return useMutation({ mutationFn: sendFriendRequest, onSuccess: invalidate })
}

export function useRespondFriendRequest() {
  const invalidate = useInvalidateFriendQueries()
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      respondFriendRequest(requestId, accept),
    onSuccess: invalidate,
  })
}

export function useRemoveFriend() {
  const invalidate = useInvalidateFriendQueries()
  return useMutation({ mutationFn: removeFriend, onSuccess: invalidate })
}
