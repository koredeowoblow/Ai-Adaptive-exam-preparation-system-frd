import { useMutation } from '@tanstack/react-query';
import { aiApi, type GenerateExplanationPayload } from '../api/ai.api';

export const useAITutor = () => {
  return useMutation({
    mutationFn: (payload: GenerateExplanationPayload) => aiApi.generateExplanation(payload),
    onSuccess: () => {
      // The generated explanation will be available in the data property of the mutation result
    },
    onError: () => {
      // Error handled by mutation callers
    }
  });
};
