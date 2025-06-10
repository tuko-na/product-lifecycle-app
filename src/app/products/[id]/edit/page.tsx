// src/app/products/[id]/edit/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const initialCategories = [
  "キッチン家電", "生活家電", "空調家電", "映像・音響機器", "情報・通信機器",
  "ヘルスケア・美容家電", "住宅設備", "工具・DIY用品", "自動車・バイク関連",
  "自転車関連", "家具・インテリア", "楽器", "カメラ・光学機器",
  "アウトドア用品", "スポーツ用品", "ベビー・キッズ用品", "その他"
];

// Productの型 (APIから返ってくる製品データの型)
interface Product {
  id: string;
  name: string;
  modelNumber: string | null;
  purchaseDate: string | null; // ISO文字列
  category: string | null;
  manufacturer: string | null;
  warrantyMonths: number | null;
  expectedLifespanYears: number | null;
  expectedUsageHours: number | null;
  notes: string | null;
  purchasePrice: number | null; // PrismaではDecimalだがJSONではnumber
  imageUrl: string | null;
  manualUrl: string | null;
}

interface ProductFormData {
  name: string;
  modelNumber: string;
  purchaseDate: string; // yyyy-mm-dd 形式の文字列
  category: string;
  manufacturer: string;
  warrantyMonths: string;
  expectedLifespanYears: string;
  expectedUsageHours: string;
  notes: string;
  purchasePrice: string;
  imageUrl: string;
  manualUrl: string;
}

export default function EditProductPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string | undefined;

  const [formData, setFormData] = useState<ProductFormData>({
    name: '', modelNumber: '', purchaseDate: '', category: '', manufacturer: '',
    warrantyMonths: '', expectedLifespanYears: '',expectedUsageHours: '', notes: '', purchasePrice: '',
    imageUrl: '', manualUrl: '',
  });

  const [isLoading, setIsLoading] = useState(false); // フォーム送信時のローディング
  const [isFetchingProduct, setIsFetchingProduct] = useState(true); // 製品データ取得時のローディング
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && productId) {
      setIsFetchingProduct(true);
      setError(null); // エラーをリセット
      fetch(`/api/products/${productId}`)
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: '製品データの取得に失敗しました。' }));
            throw new Error(errorData.error || `ステータス: ${res.status}`);
          }
          return res.json();
        })
        .then((productData: Product) => {
          // APIから取得したデータをフォームの初期値にセット
          setFormData({
            name: productData.name || '',
            modelNumber: productData.modelNumber || '',
            // purchaseDateはYYYY-MM-DD形式に変換
            purchaseDate: productData.purchaseDate ? productData.purchaseDate.split('T')[0] : '',
            category: productData.category || '',
            manufacturer: productData.manufacturer || '',
            warrantyMonths: productData.warrantyMonths?.toString() || '',
            expectedLifespanYears: productData.expectedLifespanYears?.toString() || '',
            expectedUsageHours: productData.expectedUsageHours?.toString() || '', 
            notes: productData.notes || '',
            purchasePrice: productData.purchasePrice?.toString() || '',
            imageUrl: productData.imageUrl || '',
            manualUrl: productData.manualUrl || '',
          });
        })
        .catch((err) => {
          console.error(err);
          setError(err.message);
        })
        .finally(() => {
          setIsFetchingProduct(false);
        });
    } else if (sessionStatus === 'unauthenticated') {
      setIsFetchingProduct(false); // 未認証ならローディング終了
      router.push('/api/auth/signin'); // サインインページへリダイレクト
    }
    // sessionStatus === 'loading' の場合は何もしない (上位のローディング表示でカバー)
  }, [sessionStatus, productId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!productId) {
      setError('製品IDが不明です。');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT', // 更新なのでPUTメソッド
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ // formDataからAPIの形式に合わせて変換
          name: formData.name,
          modelNumber: formData.modelNumber,
          purchaseDate: formData.purchaseDate || null,
          category: formData.category,
          manufacturer: formData.manufacturer,
          warrantyMonths: formData.warrantyMonths ? parseInt(formData.warrantyMonths, 10) : null,
          expectedLifespanYears: formData.expectedLifespanYears ? parseInt(formData.expectedLifespanYears, 10) : null,
          expectedUsageHours: formData.expectedUsageHours ? parseInt(formData.expectedUsageHours, 10) : null,
          notes: formData.notes,
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
          imageUrl: formData.imageUrl,
          manualUrl: formData.manualUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `製品情報の更新に失敗しました。ステータス: ${response.status}`);
      }

      const updatedProduct = await response.json();
      setSuccessMessage(`製品「${updatedProduct.name}」の情報が更新されました。`);
      // router.push(`/products/${productId}`); // 更新後、詳細ページに戻るなどの処理

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('予期せぬエラーが発生しました。');
      }
      console.error('製品更新エラー:', err);
    } finally {
      setIsLoading(false);
    }
  };


  if (sessionStatus === 'loading') {
    return <p>セッション情報を読み込み中...</p>;
  }
  // isFetchingProductのローディング表示は、セッション認証後に行う
  if (sessionStatus === 'authenticated' && isFetchingProduct) {
    return <p>製品情報を読み込み中...</p>;
  }

  if (sessionStatus === 'unauthenticated') {
    return <p>このページを表示するにはログインが必要です。</p>; // or redirect
  }
  
  if (error && !isFetchingProduct) { // データ取得エラー時に表示
    return <p style={{color: 'red'}}>エラー: {error}</p>
  }


  // フォームのJSX (変更なし、ただしvalueはformDataから取る)
  return (
    <div>
      <Link href={productId ? `/products/${productId}` : '/products'} style={{ display: 'inline-block', marginBottom: '1rem', color: '#0070f3' }}>
        &larr; 製品詳細に戻る
      </Link>
      <h1>製品情報を編集</h1>
      {/* エラーと成功メッセージの表示場所を変更 */}
      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
        {/* 各入力フィールドのvalueを formData.fieldName に変更 */}
        <div>
          <label htmlFor="name">製品名:<span style={{color: 'red'}}>*</span></label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required disabled={isLoading || isFetchingProduct} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        {/* ... 他のフィールドも同様に value={formData.fieldName} に ... */}
        <div>
          <label htmlFor="modelNumber">型番:</label>
          <input type="text" name="modelNumber" id="modelNumber" value={formData.modelNumber} onChange={handleChange} disabled={isLoading || isFetchingProduct} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="purchaseDate">購入日:</label>
          <input type="date" name="purchaseDate" id="purchaseDate" value={formData.purchaseDate} onChange={handleChange} disabled={isLoading || isFetchingProduct} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="category">カテゴリ:</label>
          <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} list="categories-list" disabled={isLoading || isFetchingProduct} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
          <datalist id="categories-list">
            {initialCategories.map(cat => <option key={cat} value={cat} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="manufacturer">メーカー名:</label>
          <input type="text" name="manufacturer" id="manufacturer" value={formData.manufacturer} onChange={handleChange} disabled={isLoading || isFetchingProduct} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="warrantyMonths">保証期間 (月数):</label>
          <input type="number" name="warrantyMonths" id="warrantyMonths" value={formData.warrantyMonths} onChange={handleChange} disabled={isLoading || isFetchingProduct} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="expectedLifespanYears">期待寿命 (年数):</label>
          <input type="number" name="expectedLifespanYears" id="expectedLifespanYears" value={formData.expectedLifespanYears} onChange={handleChange} disabled={isLoading || isFetchingProduct} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="expectedUsageHours">期待総使用時間 (時間):</label>
          <input
            type="number"
            name="expectedUsageHours" // name属性を追加
            id="expectedUsageHours"
            value={formData.expectedUsageHours}
            onChange={handleChange}
            disabled={isLoading || isFetchingProduct}
            style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }}
          />
        </div>
        <div>
          <label htmlFor="purchasePrice">購入価格:</label>
          <input type="number" name="purchasePrice" id="purchasePrice" value={formData.purchasePrice} onChange={handleChange} step="any" disabled={isLoading || isFetchingProduct} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="notes">メモ:</label>
          <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} disabled={isLoading || isFetchingProduct} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="imageUrl">製品画像URL:</label>
          <input type="url" name="imageUrl" id="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://example.com/image.jpg" disabled={isLoading || isFetchingProduct} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="manualUrl">取扱説明書URL:</label>
          <input type="url" name="manualUrl" id="manualUrl" value={formData.manualUrl} onChange={handleChange} placeholder="https://example.com/manual.pdf" disabled={isLoading || isFetchingProduct} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>

        <button type="submit" disabled={isLoading || isFetchingProduct} style={{ padding: '0.75rem 1.5rem', border: '1px solid black', cursor: (isLoading || isFetchingProduct) ? 'not-allowed' : 'pointer', backgroundColor: (isLoading || isFetchingProduct) ? '#ccc' : '#008000', color: 'white', borderRadius: '5px', marginTop: '1rem' }} >
          {isLoading ? '更新中...' : (isFetchingProduct ? 'データ読込中...' : '製品情報を更新')}
        </button>
      </form>
    </div>
  );
}