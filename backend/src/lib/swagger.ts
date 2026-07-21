import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Amana API',
      version: '1.0.0',
      description:
        'Cooperative credit-scoring & lending platform — built for APIConf Lagos 2026 Hackathon, powered by Monnify. ' +
        'Turns faithful cooperative savers into verifiable, bankable borrowers.',
      contact: {
        name: 'Amana Team',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        // Use an explicit API base URL when provided, otherwise use relative root paths
        // so Swagger UI works correctly behind proxies and on hosted platforms.
        url: process.env.API_BASE_URL || '/',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from POST /api/auth/login',
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────────────────
        LoginRequest: {
          type: 'object',
          required: ['phone', 'password'],
          properties: {
            phone: { type: 'string', example: '08000000001', description: 'Nigerian phone number' },
            password: { type: 'string', example: 'admin123', minLength: 6 },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', description: 'JWT bearer token (valid 7 days)' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    role: { type: 'string', enum: ['admin', 'member'] },
                  },
                },
              },
            },
          },
        },
        // ── Member ────────────────────────────────────────────────────────
        OnboardRequest: {
          type: 'object',
          required: ['name', 'phone', 'bvn', 'password'],
          properties: {
            name: { type: 'string', example: 'Ngozi Adeyemi', minLength: 2 },
            phone: { type: 'string', example: '08055551234', minLength: 10 },
            bvn: { type: 'string', example: '12345678901', minLength: 11, maxLength: 11, description: 'Mocked in sandbox' },
            password: { type: 'string', example: 'member123', minLength: 6 },
            cooperativeId: { type: 'string', description: 'Optional — auto-resolved to the first cooperative if omitted' },
          },
        },
        VirtualAccount: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            memberId: { type: 'string' },
            monnifyAccountReference: { type: 'string' },
            accountNumber: { type: 'string', example: '9012345678' },
            bankName: { type: 'string', example: 'Wema Bank' },
            bankCode: { type: 'string', example: '035' },
          },
        },
        Member: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            cooperativeId: { type: 'string' },
            userId: { type: 'string' },
            bvnStatus: { type: 'string', enum: ['pending', 'verified', 'mocked'] },
            joinDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['active', 'suspended'] },
            user: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
              },
            },
            virtualAccount: { $ref: '#/components/schemas/VirtualAccount' },
            latestScore: { $ref: '#/components/schemas/Score' },
            totalContributed: { type: 'number', description: 'Total NGN contributed to date' },
          },
        },
        // ── Score ─────────────────────────────────────────────────────────
        ScoreBreakdownFactor: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            weight: { type: 'number', description: 'Weight percentage (e.g. 40)' },
            raw: { type: 'number', description: 'Raw % value (0–100)' },
            score: { type: 'number', description: 'Weighted contribution to total score' },
            details: { type: 'string' },
          },
        },
        Score: {
          type: 'object',
          properties: {
            value: { type: 'number', minimum: 0, maximum: 100, example: 89 },
            band: { type: 'string', enum: ['A', 'B', 'C', 'D'], example: 'A' },
            label: { type: 'string', example: '' },
            isThinFile: { type: 'boolean', description: 'True if member has no prior loan history' },
            totalSavings: { type: 'number', example: 60000 },
            maxLoanMultiple: { type: 'number', example: 3 },
            maxLoan: { type: 'number', example: 180000 },
            availableLoan: { type: 'number', example: 180000, description: 'maxLoan minus outstanding balance' },
            breakdown: {
              type: 'object',
              properties: {
                repaymentReliability: { $ref: '#/components/schemas/ScoreBreakdownFactor' },
                contributionConsistency: { $ref: '#/components/schemas/ScoreBreakdownFactor' },
                membershipTenure: { $ref: '#/components/schemas/ScoreBreakdownFactor' },
                savingsDepth: { $ref: '#/components/schemas/ScoreBreakdownFactor' },
              },
            },
          },
        },
        // ── Contribution ──────────────────────────────────────────────────
        Contribution: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            memberId: { type: 'string' },
            amount: { type: 'number', example: 5000 },
            paidAt: { type: 'string', format: 'date-time' },
            monnifyTxnRef: { type: 'string' },
            narration: { type: 'string' },
            status: { type: 'string', enum: ['confirmed', 'failed'] },
          },
        },
        // ── Loan ──────────────────────────────────────────────────────────
        LoanRequest: {
          type: 'object',
          required: ['memberId', 'amount'],
          properties: {
            memberId: { type: 'string' },
            amount: { type: 'number', minimum: 1, example: 30000, description: 'Loan amount in NGN' },
          },
        },
        Loan: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            memberId: { type: 'string' },
            principal: { type: 'number', example: 30000 },
            status: {
              type: 'string',
              enum: ['requested', 'approved', 'disbursed', 'repaying', 'closed', 'defaulted'],
            },
            scoreAtDecision: { type: 'number', example: 89 },
            aiExplanation: { type: 'string', description: 'AI-generated plain-language explanation of the lending decision' },
            disbursementRef: { type: 'string', description: 'Monnify transfer reference — unique per loan (idempotency key)' },
            breakdownJson: { type: 'string', description: 'JSON-stringified score breakdown at decision time' },
            createdAt: { type: 'string', format: 'date-time' },
            repayments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Repayment' },
            },
          },
        },
        Repayment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            loanId: { type: 'string' },
            amount: { type: 'number', example: 15000 },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            paidAt: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['pending', 'paid', 'late'] },
          },
        },
        RepayRequest: {
          type: 'object',
          required: ['amount'],
          properties: {
            amount: { type: 'number', minimum: 1, example: 15000 },
          },
        },
        // ── Webhook ───────────────────────────────────────────────────────
        SimulateRequest: {
          type: 'object',
          required: ['memberId', 'amount'],
          properties: {
            memberId: { type: 'string' },
            amount: { type: 'number', example: 5000, description: 'Amount in NGN to simulate as a contribution' },
            reference: { type: 'string', description: 'Optional custom transaction reference (auto-generated if omitted)' },
          },
        },
        // ── Assistant ─────────────────────────────────────────────────────
        AssistantRequest: {
          type: 'object',
          required: ['question'],
          properties: {
            question: {
              type: 'string',
              minLength: 3,
              example: 'Which members have the highest credit scores?',
            },
          },
        },
        // ── Generic ───────────────────────────────────────────────────────
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Invalid phone or password' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication — login and token management' },
      { name: 'Members', description: 'Member onboarding, KYC, virtual accounts, ledger' },
      { name: 'Score', description: 'Credit scoring engine — rule-based, explainable' },
      { name: 'Loans', description: 'Loan lifecycle — request, approve, disburse, repay' },
      { name: 'Webhooks', description: 'Monnify webhook receiver + sandbox simulation endpoint' },
      { name: 'Assistant', description: 'AI natural-language assistant over cooperative data' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
