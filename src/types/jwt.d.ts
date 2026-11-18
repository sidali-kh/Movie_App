declare global {
  namespace Jwt {
    interface JwtInput {
      _id: string;
      email: string;
      role: string;
    }
  
    interface JwtPayload {
      _id: string;
      email: string;
      role: string;
      iat: number;
      exp: number;
    }
  }

}

export {};