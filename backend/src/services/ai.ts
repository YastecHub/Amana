import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface LoanExplanationParams {
  memberName: string;
  score: number;
  band: string;
  breakdown: any;
  loanAmount: number;
  availableLoan: number;
  isThinFile: boolean;
}

export async function generateLoanExplanation(data: LoanExplanationParams): Promise<string> {
  const fallback = `Loan evaluation for ${data.memberName}: Credit score is ${data.score.toFixed(0)}/100 (Band ${data.band}). ` +
    `Requested: NGN ${data.loanAmount.toLocaleString()}, Maximum available: NGN ${data.availableLoan.toLocaleString()}. ` +
    (data.isThinFile ? 'Note: This is a provisional score as the member has no prior loan history.' : '');

  if (!genAI) {
    console.warn('[AI] No Gemini API key — returning fallback explanation');
    return fallback;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const breakdownText = Object.entries(data.breakdown)
      .map(([key, val]: [string, any]) =>
        `  - ${val.label}: ${val.raw}% raw → ${val.score} points (weight ${val.weight}%)`
      )
      .join('\n');

    const prompt = [
      'You are a cooperative lending assistant. Use ONLY the data provided below.',
      'Do not invent scores or facts. Write in clear, friendly English suitable for a Nigerian cooperative admin.',
      'Explain the credit score and loan decision in 2-3 readable paragraphs.',
      '',
      'MEMBER DATA:',
      `Name: ${data.memberName}`,
      `Credit Score: ${data.score.toFixed(0)} / 100 (Band ${data.band})`,
      `Thin File (no prior loan history): ${data.isThinFile ? 'Yes - weights redistributed' : 'No'}`,
      `Requested Loan Amount: NGN ${data.loanAmount.toLocaleString()}`,
      `Maximum Available Loan: NGN ${data.availableLoan.toLocaleString()}`,
      `Decision: ${data.loanAmount <= data.availableLoan ? 'ELIGIBLE' : 'NOT ELIGIBLE - exceeds capacity'}`,
      '',
      'SCORE BREAKDOWN:',
      breakdownText,
      '',
      'Please write a plain-language explanation of why this member received this score and whether their loan request should be approved.',
    ].join('\n');

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error('[AI] Explanation error:', error.message);
    return fallback;
  }
}

export interface AssistantContext {
  cooperative: any;
  members: any[];
  recentContributions: any[];
  recentLoans: any[];
}

export async function answerAssistantQuery(question: string, context: AssistantContext): Promise<string> {
  const fallback = "I'm unable to answer right now — AI capabilities are offline (no API key configured). " +
    "Please check your GEMINI_API_KEY in the .env file.";

  if (!genAI) {
    console.warn('[AI] No Gemini API key — returning fallback assistant response');
    return fallback;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = [
      'You are a helpful assistant for the Amana cooperative credit platform.',
      'Answer ONLY using the provided cooperative data below.',
      'If the answer is not in the data, say so clearly. Be concise and factual.',
      'Do not invent member details, scores, or amounts.',
      '',
      'COOPERATIVE DATA:',
      `Cooperative: ${JSON.stringify(context.cooperative, null, 2)}`,
      `Members (${context.members.length} shown): ${JSON.stringify(context.members, null, 2)}`,
      `Recent Contributions: ${JSON.stringify(context.recentContributions, null, 2)}`,
      `Recent Loans: ${JSON.stringify(context.recentLoans, null, 2)}`,
      '',
      `ADMIN QUESTION: ${question}`,
    ].join('\n');

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error('[AI] Assistant error:', error.message);
    return 'Sorry, I encountered an error while processing your question. Please try again.';
  }
}
