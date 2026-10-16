import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      balance: number;
      /** Prediction-market wallet (/polymarket). */
      predictionBalance: number;
      leverage: number;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    balance: number;
    predictionBalance?: number;
    leverage: number;
    image?: string | null;
  }
}
