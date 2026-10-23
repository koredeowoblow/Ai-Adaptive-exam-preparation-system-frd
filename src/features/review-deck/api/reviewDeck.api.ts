import { apiClient } from '../../../shared/api-client/client';
import type {
  ReviewDeckSummaryResponse,
  DueCardsResponse,
  SubmitReviewResponse,
  ReviewRating,
} from '../../../types/reviewDeck.types';

export const reviewDeckApi = {
  getSummary: async (courseId?: string): Promise<ReviewDeckSummaryResponse> => {
    const params = courseId ? { courseId } : undefined;
    return apiClient.get('/review-deck/summary', { params });
  },

  getDueCards: async (courseId?: string, limit = 50): Promise<DueCardsResponse> => {
    const params: Record<string, any> = { limit };
    if (courseId) params.courseId = courseId;
    return apiClient.get('/review-deck/due', { params });
  },

  submitReview: async (cardId: string, rating: ReviewRating): Promise<SubmitReviewResponse> => {
    return apiClient.post(`/review-deck/${cardId}/review`, { rating });
  },

  addCard: async (questionId: string) => {
    return apiClient.post('/review-deck/add', { questionId });
  },

  removeCard: async (cardId: string) => {
    return apiClient.delete(`/review-deck/${cardId}`);
  },
};
