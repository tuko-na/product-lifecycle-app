// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: 'database', 
  },
  callbacks: {
    async session({ session, user }) { // 'database' ストラテジーでは 'user' オブジェクトが渡されます
      if (session.user && user) {
        session.user.id = user.id; // データベースから取得したユーザーIDをセッションに追加
      }
      return session;
    },
    // 'jwt' コールバックは 'database' ストラテジーでは使用されないため、
    // コメントアウトまたは削除しても構いません。
    // async jwt({ token, user }) {
    //   if (user) {
    //     token.id = user.id;
    //   }
    //   return token;
    // }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };