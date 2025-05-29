// src/components/AuthButton.tsx
'use client'; // クライアントコンポーネントとしてマーク

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (session) {
    return (
      <>
        {session.user?.name || session.user?.email}さん、こんにちは！{' '}
        <button onClick={() => signOut()}>サインアウト</button>
      </>
    );
  }

  return (
    <>
      未ログインです。{' '}
      {/* signIn() を直接呼び出すか、カスタムログインページへリンクします */}
      {/* NextAuth.jsのデフォルトサインインページを使う場合: */}
      <button onClick={() => signIn()}>サインイン</button>
      {/* カスタムサインインページがある場合（例: /auth/signin）: */}
      {/* <Link href="/auth/signin">サインイン</Link> */}
    </>
  );
}