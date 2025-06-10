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
    async session({ session, user, token }) {
      console.log('[NextAuth Callback] Session callback triggered');
      console.log('[NextAuth Callback] Received session:', JSON.stringify(session, null, 2));
      console.log('[NextAuth Callback] Received user (from adapter):', JSON.stringify(user, null, 2));
      console.log('[NextAuth Callback] Received token (if any):', JSON.stringify(token, null, 2));

      if (session?.user && user?.id) {
        session.user.id = user.id;
        console.log('[NextAuth Callback] Successfully set session.user.id:', user.id);
      } else {
        console.warn('[NextAuth Callback] Could not set session.user.id. Current session.user:', session?.user, 'Adapter user:', user);
        // session.user が存在しない場合に初期化するのは良いですが、
        // user.id が取得できない根本的な原因に対処する方が重要です。
        // この初期化は、session.user.id にアクセスしようとする際の
        // TypeScriptエラーを一時的に回避するかもしれませんが、
        // ログインユーザーの特定ができない問題は残ります。
        if (session && !session.user) { // session自体は存在し、session.userがない場合
            session.user = {} as any; // 型アサーションで一時的にエラーを回避 (より良い型定義を推奨)
        }
      }
      // この return は session コールバックの最後に配置する
      return session;
    },
    // jwt コールバックは 'database' ストラテジーでは通常不要
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