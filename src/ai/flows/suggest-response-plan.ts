'use server';

/**
 * @fileOverview Generates suggestions for how to respond to an emergency based on the alert details and the user's medical history.
 *
 * - suggestResponsePlan - A function that generates the response plan.
 * - SuggestResponsePlanInput - The input type for the suggestResponsePlan function.
 * - SuggestResponsePlanOutput - The return type for the suggestResponsePlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestResponsePlanInputSchema = z.object({
  alertDetails: z
    .string()
    .describe('Details of the emergency alert, including location, type, and severity.'),
  medicalHistory: z
    .string()
    .optional()
    .describe('The user medical history, including conditions, allergies, and medications.'),
});
export type SuggestResponsePlanInput = z.infer<typeof SuggestResponsePlanInputSchema>;

const SuggestResponsePlanOutputSchema = z.object({
  responsePlan: z
    .string()
    .describe('A suggested plan for responding to the emergency, including specific actions and considerations.'),
});
export type SuggestResponsePlanOutput = z.infer<typeof SuggestResponsePlanOutputSchema>;

export async function suggestResponsePlan(input: SuggestResponsePlanInput): Promise<SuggestResponsePlanOutput> {
  return suggestResponsePlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestResponsePlanPrompt',
  input: {schema: SuggestResponsePlanInputSchema},
  output: {schema: SuggestResponsePlanOutputSchema},
  prompt: `You are an expert emergency response planner. Based on the alert details and the user's medical history, suggest a detailed plan for how to respond to the emergency.

Alert Details: {{{alertDetails}}}

Medical History: {{{medicalHistory}}}

Response Plan:`,
});

const suggestResponsePlanFlow = ai.defineFlow(
  {
    name: 'suggestResponsePlanFlow',
    inputSchema: SuggestResponsePlanInputSchema,
    outputSchema: SuggestResponsePlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
