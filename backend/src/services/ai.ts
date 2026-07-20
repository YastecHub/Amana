import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const generateLoanExplanation = async (data: {
  memberName: string;
  score: number;
  band: string;
  breakdown: any;
  loanAmount: number;
  availableLoan: number;
  isThinFile: boolean;
}) => {
  if (!genAI) {
    return \`Loan request evaluated for \${data.memberName}. Score: \${data.score} (Band \${data.band}). Requested: \${data.loanAmount}, Available: \${data.availableLoan}. Explanation unavailable due to missing AI configuration.\`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = \`
You are a cooperative lending assistant. Use ONLY the provided data. Do not invent scores or facts. Write in clear, friendly English suitable for a Nigerian cooperative admin. Explain the loan decision logically.

Data:
- Member Name: \${data.memberName}
- Score: \${data.score.toFixed(2)} / 100
- Band: \${data.band}
- Is Thin File (No previous loans): \${data.isThinFile ? 'Yes' : 'No'}
- Requested Loan Amount: NGN \${data.loanAmount}
- Max Available Loan Amount: NGN \${data.availableLoan}
- Score Breakdown: \${JSON.stringify(data.breakdown)}

Please provide a 2-3 paragraph plain-language explanation of the member's credit score and whether this loan should be approved based on the requested amount versus the available amount.
\`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating AI explanation', error);
    return 'Error generating explanation.';
  }
};

export const answerAssistantQuery = async (question: string, context: {
  cooperative: any;
  members: any[];
  recentContributions: any[];
  recentLoans: any[];
}) => {
  if (!genAI) {
    return "I'm sorry, my AI capabilities are currently offline because the API key is not configured.";
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = \`
You are a helpful assistant for the Amana cooperative platform. Answer ONLY using the provided cooperative data. If the answer is not in the data, say so clearly. Be concise.

Context Data:
Cooperative Info: \${JSON.stringify(context.cooperative)}
Members (\${context.members.length}): \${JSON.stringify(context.members)}
Recent Contributions: \${JSON.stringify(context.recentContributions)}
Recent Loans: \${JSON.stringify(context.recentLoans)}

User Question: \${question}
\`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating AI assistant answer', error);
    return 'Sorry, I encountered an error while trying to answer your question.';
  }
};
