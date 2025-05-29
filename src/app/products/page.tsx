// src/app/products/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link'; // 「製品を追加」ボタンのため
import { useRouter } from 'next/navigation';

// Productの型を定義 (APIから返されるデータ構造に合わせる)
interface Product {
  id: string;
  name: string;
  modelNumber: string | null;
  purchaseDate: string | null; // APIからはISO文字列で来る想定
  createdAt: string;
  // 必要に応じて他のフィールドも追加
}

export default function ProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true); // データ取得中のローディング状態
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoading(true);
      fetch('/api/products')
        .then((res) => {
          if (!res.ok) {
            throw new Error('製品データの取得に失敗しました。');
          }
          return res.json();
        })
        .then((data) => {
          setProducts(data);
          setError(null);
        })
        .catch((err) => {
          console.error(err);
          setError(err.message);
          setProducts([]); // エラー時は製品リストを空にする
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (status === 'unauthenticated') {
      // 未認証の場合は何もしないか、ログインページへリダイレクト
      // router.push('/api/auth/signin'); // このページは認証必須なのでリダイレクトも有効
      setIsLoading(false); // ローディング終了
      setProducts([]); // 製品リストを空にする
    }
    // status === 'loading' の場合は、セッション情報取得中なので何もしない
  }, [status, router]); // status または router が変更された時に再実行

  if (status === 'loading') {
    return <p>セッション情報を読み込み中...</p>;
  }

  if (status === 'unauthenticated') {
    return (
      <div>
        <p>このページを表示するにはログインが必要です。</p>
        <button onClick={() => router.push('/api/auth/signin')} style={{ padding: '5px 10px', border: '1px solid black', cursor: 'pointer', marginTop: '10px' }}>
          サインインページへ
        </button>
      </div>
    );
  }

  // ここからは status === 'authenticated' の場合の表示
  if (isLoading) {
    return <p>製品情報を読み込み中...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>エラー: {error}</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>登録製品一覧</h1>
        <Link href="/products/add">
          <button style={{ padding: '8px 15px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            新しい製品を登録
          </button>
        </Link>
      </div>

      {products.length === 0 ? (
        <p>登録されている製品はありません。</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {products.map((product) => (
            <li key={product.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
              <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h2 style={{ margin: '0 0 5px 0', cursor: 'pointer', color: '#0070f3' }}>{product.name}</h2>
              </Link>
              <p style={{ margin: '0 0 5px 0' }}>型番: {product.modelNumber || '未登録'}</p>
              <p style={{ margin: '0 0 5px 0' }}>購入日: {product.purchaseDate ? new Date(product.purchaseDate).toLocaleDateString() : '未登録'}</p>
              <p style={{ fontSize: '0.8em', color: '#666', margin: 0 }}>登録日: {new Date(product.createdAt).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}