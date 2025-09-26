import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Trading App API',
      version: '1.0.0',
      description: 'API documentation for the Trading App',
      contact: {
        name: 'API Support',
        email: 'support@tradingapp.com'
      }
    },
    servers: [
      {
        url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authentication'
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token authentication'
        }
      }
    },
    tags: [
      {
        name: 'Admin',
        description: 'Administrative operations'
      },
      {
        name: 'Auth',
        description: 'Authentication operations including MFA'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Market Data',
        description: 'Market data operations and financial information'
      },
      {
        name: 'Trading',
        description: 'Trading operations and pricing data'
      }
    ]
  },
  apis: [
    './src/app/api/**/*.ts',
    './src/app/api/**/**/*.ts',
    './src/app/api/**/**/**/*.ts'
  ]
};

export const specs = swaggerJsdoc(options);
