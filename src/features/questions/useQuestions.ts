import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QuestionResult } from '@/types/database'
import { createQuestion, deleteQuestion, listQuestionsByExam, listWrongAnswers, submitReview } from './questionsApi'

export function questionsQueryKey(examId: string) {
  return ['questions', examId] as const
}
export const wrongAnswersQueryKey = ['wrong-answers'] as const

export function useQuestionsByExam(examId: string) {
  return useQuery({ queryKey: questionsQueryKey(examId), queryFn: () => listQuestionsByExam(examId) })
}

export function useWrongAnswers() {
  return useQuery({ queryKey: wrongAnswersQueryKey, queryFn: listWrongAnswers })
}

function useInvalidateQuestionQueries() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['questions'] })
    queryClient.invalidateQueries({ queryKey: wrongAnswersQueryKey })
  }
}

export function useCreateQuestion() {
  const invalidate = useInvalidateQuestionQueries()
  return useMutation({ mutationFn: createQuestion, onSuccess: invalidate })
}

export function useDeleteQuestion() {
  const invalidate = useInvalidateQuestionQueries()
  return useMutation({ mutationFn: deleteQuestion, onSuccess: invalidate })
}

export function useSubmitReview() {
  const invalidate = useInvalidateQuestionQueries()
  return useMutation({
    mutationFn: ({ questionId, result }: { questionId: string; result: QuestionResult }) =>
      submitReview(questionId, result),
    onSuccess: invalidate,
  })
}
