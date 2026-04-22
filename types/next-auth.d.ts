import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      isMasterAdmin: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    isMasterAdmin: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    isMasterAdmin: boolean;
  }
}
