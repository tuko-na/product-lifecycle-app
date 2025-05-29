// src/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * `useSession`, `getSession` から返される型、
   * または `SessionProvider` の React Context の prop として受け取る型です。
   */
  interface Session {
    user: {
      /** ユーザーの一意なID */
      id: string;
    } & DefaultSession["user"]; // デフォルトの user プロパティ (name, email, image) も維持
  }

  /**
   * User モデルの型。
   * PrismaのUserモデルと一致させるか、
   * session コールバックに渡される user オブジェクトの型です。
   * DefaultUser には既に id: string が含まれています。
   */
  // interface User extends DefaultUser {
  //   // 他に User オブジェクトに追加したいプロパティがあればここに記述
  // }
}

// もしJWT戦略でtokenに情報を追加している場合は、JWTの型も拡張します。
// declare module "next-auth/jwt" {
//   interface JWT {
//     id?: string;
//   }
// }