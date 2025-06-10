// src/app/products/add/page.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// 初期カテゴリリストの例
const initialCategories = [
  "キッチン家電", "生活家電", "空調家電", "映像・音響機器", "情報・通信機器",
  "ヘルスケア・美容家電", "住宅設備", "工具・DIY用品", "自動車・バイク関連",
  "自転車関連", "家具・インテリア", "楽器", "カメラ・光学機器",
  "アウトドア用品", "スポーツ用品", "ベビー・キッズ用品", "その他"
];

export default function AddProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [productName, setProductName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [category, setCategory] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('');
  const [expectedLifespanYears, setExpectedLifespanYears] = useState('');
  const [expectedUsageHours, setExpectedUsageHours] = useState('');
  const [notes, setNotes] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [manualUrl, setManualUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // ... (既存のhandleSubmitロジックは変更なし) ...
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!session) {
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
          category,
          manufacturer,
          warrantyMonths: warrantyMonths ? parseInt(warrantyMonths, 10) : null,
          expectedLifespanYears: expectedLifespanYears ? parseInt(expectedLifespanYears, 10) : null,
          notes,
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
          imageUrl,
          manualUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `製品の登録に失敗しました。ステータス: ${response.status}`);
      }

      const newProduct = await response.json();
      setSuccessMessage(`製品「${newProduct.name}」が正常に登録されました。`);

      setProductName('');
      setModelNumber('');
      setPurchaseDate('');
      setCategory('');
      setManufacturer('');
      setWarrantyMonths('');
      setExpectedLifespanYears('');
      setExpectedUsageHours('');
      setNotes('');
      setPurchasePrice('');
      setImageUrl('');
      setManualUrl('');

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('予期せぬエラーが発生しました。');
      }
      console.error('製品登録フォームエラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- ここからダミーデータ入力ボタンの処理 ---
  const handleFillDummyData = () => {
    const dummyDate = new Date();
    const year = dummyDate.getFullYear();
    const month = (dummyDate.getMonth() + 1).toString().padStart(2, '0'); // 月は0から始まるため+1
    const day = dummyDate.getDate().toString().padStart(2, '0');
    const todayISO = `${year}-${month}-${day}`;

    setProductName(`テスト製品 ${Math.floor(Math.random() * 1000)}`);
    setModelNumber(`TM-${Math.floor(Math.random() * 9000) + 1000}`);
    setPurchaseDate(todayISO);
    setCategory(initialCategories[Math.floor(Math.random() * initialCategories.length)]);
    setManufacturer(`テストメーカー ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`); // A-Z
    setWarrantyMonths(Math.floor(Math.random() * 24 + 12).toString()); // 12-35ヶ月
    setExpectedLifespanYears(Math.floor(Math.random() * 5 + 3).toString()); // 3-7年
    setExpectedUsageHours(Math.floor(Math.random() * 800 + 200).toString()); 
    setNotes('これはダミーデータによる製品のメモです。\nテスト用に使用されています。');
    setPurchasePrice((Math.random() * 50000 + 5000).toFixed(0)); // 5000-55000円 (小数点なし)
    setImageUrl('https://via.placeholder.com/150/0000FF/808080?Text=DummyProduct');
    setManualUrl('https://www.example.com/manuals/dummy_manual.pdf');
    setSuccessMessage('ダミーデータが入力されました。'); // ユーザーへのフィードバック
    setError(null);
  };
  // --- ここまでダミーデータ入力ボタンの処理 ---


  if (status === 'loading') {}
  if (status === 'unauthenticated') {}

  return (
    <div>
      <h1>新しい製品を登録</h1>
      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
        {/* --- 既存のフォームフィールドは変更なし --- */}
        <div>
          <label htmlFor="productName">製品名:<span style={{color: 'red'}}>*</span></label>
          <input type="text" id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} required disabled={isLoading} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="modelNumber">型番:</label>
          <input type="text" id="modelNumber" value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} disabled={isLoading} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="purchaseDate">購入日:</label>
          <input type="date" id="purchaseDate" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} disabled={isLoading} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="category">カテゴリ:</label>
          <input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} list="categories-list" disabled={isLoading} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }}/>
          <datalist id="categories-list">
            {initialCategories.map(cat => <option key={cat} value={cat} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="manufacturer">メーカー名:</label>
          <input type="text" id="manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} disabled={isLoading} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="warrantyMonths">保証期間 (月数):</label>
          <input type="number" id="warrantyMonths" value={warrantyMonths} onChange={(e) => setWarrantyMonths(e.target.value)} disabled={isLoading} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="expectedLifespanYears">期待寿命 (年数):</label>
          <input type="number" id="expectedLifespanYears" value={expectedLifespanYears} onChange={(e) => setExpectedLifespanYears(e.target.value)} disabled={isLoading} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="expectedUsageHours">期待総使用時間 (時間):</label>
          <input
            type="number"
            id="expectedUsageHours"
            value={expectedUsageHours}
            onChange={(e) => setExpectedUsageHours(e.target.value)}
            disabled={isLoading}
            style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }}
          />
        </div>
        <div>
          <label htmlFor="purchasePrice">購入価格:</label>
          <input type="number" id="purchasePrice" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} step="any" disabled={isLoading} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} /> {/* step="any" で任意の小数を許可 */}
        </div>
        <div>
          <label htmlFor="notes">メモ:</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={isLoading} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="imageUrl">製品画像URL:</label>
          <input type="url" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" disabled={isLoading} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>
        <div>
          <label htmlFor="manualUrl">取扱説明書URL:</label>
          <input type="url" id="manualUrl" value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} placeholder="https://example.com/manual.pdf" disabled={isLoading} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }} />
        </div>

        <button type="submit" disabled={isLoading} style={{ padding: '0.75rem 1.5rem', border: '1px solid black', cursor: isLoading ? 'not-allowed' : 'pointer', backgroundColor: isLoading ? '#ccc' : '#0070f3', color: 'white', borderRadius: '5px', marginTop: '1rem' }} >
          {isLoading ? '登録中...' : '製品を登録'}
        </button>
      </form>

      {/* --- ここからダミーデータ入力ボタン --- */}
      <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
        <button
          type="button" // フォームのsubmitと区別するため type="button" を指定
          onClick={handleFillDummyData}
          disabled={isLoading} // 登録処理中などは無効化
          style={{ padding: '0.5rem 1rem', border: '1px solid #777', cursor: 'pointer', backgroundColor: '#f0f0f0', borderRadius: '5px' }}
        >
          ダミーデータを入力
        </button>
      </div>
      {/* --- ここまでダミーデータ入力ボタン --- */}
    </div>
  );
}