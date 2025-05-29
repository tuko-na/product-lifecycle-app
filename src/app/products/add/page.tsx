// src/app/products/add/page.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AddProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [productName, setProductName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [isLoading, setIsLoading] = useState(false); // ローディング状態を追加
  const [error, setError] = useState<string | null>(null); // エラーメッセージ用
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // 成功メッセージ用

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // エラーメッセージをリセット
    setSuccessMessage(null); // 成功メッセージをリセット
    setIsLoading(true); // ローディング開始

    if (!session || !session.user?.id) {
      alert('製品を登録するにはログインが必要です。');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName,
          modelNumber,
          purchaseDate,
          // userId はAPI側でセッションから取得するため、ここでは送信不要
        }),
      });

      if (!response.ok) {
        // レスポンスがOKでない場合 (例: 400, 401, 500エラー)
        const errorData = await response.json();
        throw new Error(errorData.error || `製品の登録に失敗しました。ステータス: ${response.status}`);
      }

      // 成功した場合
      const newProduct = await response.json();
      setSuccessMessage(`製品「${newProduct.name}」が正常に登録されました。`);
      // console.log('登録された製品:', newProduct);

      // フォームをクリアする
      setProductName('');
      setModelNumber('');
      setPurchaseDate('');

      // 必要に応じて他のページにリダイレクト
      // router.push('/products'); // 例えば製品一覧ページへ
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('予期せぬエラーが発生しました。');
      }
      console.error('製品登録フォームエラー:', err);
    } finally {
      setIsLoading(false); // ローディング終了
    }
  };

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (status === 'unauthenticated') {
    return <p>このページを表示するにはログインが必要です。ヘッダーからサインインしてください。</p>;
  }

  return (
    <div>
      <h1>新しい製品を登録</h1>
      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="productName">製品名:</label>
          <input
            type="text"
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            disabled={isLoading} // ローディング中は無効化
            style={{ border: '1px solid black', marginLeft: '5px', padding: '2px' }}
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="modelNumber">型番:</label>
          <input
            type="text"
            id="modelNumber"
            value={modelNumber}
            onChange={(e) => setModelNumber(e.target.value)}
            disabled={isLoading} // ローディング中は無効化
            style={{ border: '1px solid black', marginLeft: '5px', padding: '2px' }}
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <label htmlFor="purchaseDate">購入日:</label>
          <input
            type="date"
            id="purchaseDate"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            disabled={isLoading} // ローディング中は無効化
            style={{ border: '1px solid black', marginLeft: '5px', padding: '2px' }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading} // ローディング中は無効化
          style={{ marginTop: '20px', padding: '5px 10px', border: '1px solid black', cursor: isLoading ? 'not-allowed' : 'pointer' }}
        >
          {isLoading ? '登録中...' : '製品を登録'}
        </button>
      </form>
    </div>
  );
}