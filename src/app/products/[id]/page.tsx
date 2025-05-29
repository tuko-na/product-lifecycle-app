// src/app/products/[id]/page.tsx
'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  modelNumber: string | null;
  purchaseDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UsageLog {
  id: string;
  date: string;
  notes: string | null;
  duration: number | null;
  createdAt: string;
}

// IncidentReportの型を定義
interface IncidentReport {
  id: string;
  date: string; // APIからはISO文字列で来る想定
  description: string;
  severity: string | null;
  createdAt: string; // APIからはISO文字列で来る想定
}

export default function ProductDetailPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string | undefined;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // 使用履歴フォーム用 (既存)
  const [usageDate, setUsageDate] = useState('');
  const [usageNotes, setUsageNotes] = useState('');
  const [usageDuration, setUsageDuration] = useState('');
  const [isSubmittingUsage, setIsSubmittingUsage] = useState(false);
  const [usageFormError, setUsageFormError] = useState<string | null>(null);
  const [usageFormSuccess, setUsageFormSuccess] = useState<string | null>(null);

  // 使用履歴一覧表示用 (既存)
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [isLoadingUsageLogs, setIsLoadingUsageLogs] = useState(true);
  const [usageLogsError, setUsageLogsError] = useState<string | null>(null);

  // --- ここからインシデント報告用の新しいState ---
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState('');
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
  const [incidentFormError, setIncidentFormError] = useState<string | null>(null);
  const [incidentFormSuccess, setIncidentFormSuccess] = useState<string | null>(null);

  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);
  // --- ここまでインシデント報告用の新しいState ---


  // 製品詳細取得useEffect (既存・変更なし)
  useEffect(() => {
    // ... (内容は変更なし)
    if (sessionStatus === 'authenticated' && productId) {
      setIsLoadingProduct(true);
      fetch(`/api/products/${productId}`)
        .then((res) => {
          if (res.status === 401) throw new Error('認証されていません。');
          if (res.status === 404) throw new Error('製品が見つかりませんでした。');
          if (!res.ok) throw new Error('製品データの取得に失敗しました。');
          return res.json();
        })
        .then((data) => {
          setProduct(data);
          setProductError(null);
        })
        .catch((err) => {
          console.error(err);
          setProductError(err.message);
          setProduct(null);
        })
        .finally(() => {
          setIsLoadingProduct(false);
        });
    } else if (sessionStatus === 'unauthenticated') {
      setIsLoadingProduct(false);
      setProduct(null);
    }
  }, [sessionStatus, productId]);

  // 使用履歴を取得する関数 (既存・変更なし)
  const fetchUsageLogs = useCallback(async () => {
    // ... (内容は変更なし)
    if (!productId || sessionStatus !== 'authenticated') {
      setUsageLogs([]);
      setIsLoadingUsageLogs(false);
      return;
    }
    setIsLoadingUsageLogs(true);
    setUsageLogsError(null);
    try {
      const response = await fetch(`/api/products/${productId}/usage`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `使用履歴の取得に失敗しました。ステータス: ${response.status}`);
      }
      const data = await response.json();
      setUsageLogs(data);
    } catch (err) {
      if (err instanceof Error) setUsageLogsError(err.message);
      else setUsageLogsError('予期せぬエラーで履歴を取得できませんでした。');
      setUsageLogs([]);
    } finally {
      setIsLoadingUsageLogs(false);
    }
  }, [productId, sessionStatus]);

  // 使用履歴取得useEffect (既存・変更なし)
  useEffect(() => {
    fetchUsageLogs();
  }, [fetchUsageLogs]);

  // --- ここからインシデント報告関連の新しい関数 ---
  const fetchIncidentReports = useCallback(async () => {
    if (!productId || sessionStatus !== 'authenticated') {
      setIncidentReports([]);
      setIsLoadingIncidents(false);
      return;
    }
    setIsLoadingIncidents(true);
    setIncidentsError(null);
    try {
      const response = await fetch(`/api/products/${productId}/incidents`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `インシデント履歴の取得に失敗しました。ステータス: ${response.status}`);
      }
      const data = await response.json();
      setIncidentReports(data);
    } catch (err) {
      if (err instanceof Error) setIncidentsError(err.message);
      else setIncidentsError('予期せぬエラーでインシデント履歴を取得できませんでした。');
      setIncidentReports([]);
    } finally {
      setIsLoadingIncidents(false);
    }
  }, [productId, sessionStatus]);

  useEffect(() => {
    fetchIncidentReports();
  }, [fetchIncidentReports]);

  const handleIncidentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingIncident(true);
    setIncidentFormError(null);
    setIncidentFormSuccess(null);

    if (!productId) {
      setIncidentFormError('製品IDが不明です。');
      setIsSubmittingIncident(false);
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: incidentDate,
          description: incidentDescription,
          severity: incidentSeverity || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `インシデントの登録に失敗しました。ステータス: ${response.status}`);
      }
      const newIncident = await response.json();
      setIncidentFormSuccess(`インシデント (ID: ${newIncident.id}) が登録されました。`);
      setIncidentDate('');
      setIncidentDescription('');
      setIncidentSeverity('');
      fetchIncidentReports(); // 成功したらインシデント一覧を再読み込み
    } catch (err) {
      if (err instanceof Error) setIncidentFormError(err.message);
      else setIncidentFormError('予期せぬエラーが発生しました。');
    } finally {
      setIsSubmittingIncident(false);
    }
  };
  // --- ここまでインシデント報告関連の新しい関数 ---


  // 使用履歴登録フォームの送信処理 (handleSubmitUsage) - 名前を変更して明確化 (既存のhandleUsageSubmitから変更)
  const handleSubmitUsage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingUsage(true);
    setUsageFormError(null);
    setUsageFormSuccess(null);
    // ... (中身は既存のhandleUsageSubmitと同じ)
    if (!productId) {
        setUsageFormError('製品IDが不明です。');
        setIsSubmittingUsage(false);
        return;
    }
    try {
      const response = await fetch(`/api/products/${productId}/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: usageDate,
          notes: usageNotes,
          duration: usageDuration ? parseInt(usageDuration, 10) : null,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `使用履歴の登録に失敗しました。ステータス: ${response.status}`);
      }
      const newUsageLog = await response.json();
      setUsageFormSuccess(`使用履歴 (ID: ${newUsageLog.id}) が登録されました。`);
      setUsageDate('');
      setUsageNotes('');
      setUsageDuration('');
      fetchUsageLogs();
    } catch (err) {
        if (err instanceof Error) setUsageFormError(err.message);
        else setUsageFormError('予期せぬエラーが発生しました。');
    } finally {
      setIsSubmittingUsage(false);
    }
  };


  // --- JSXレンダリング部分 ---
  if (sessionStatus === 'loading') return <p>セッション情報を読み込み中...</p>;
  if (sessionStatus === 'unauthenticated') { /* ... (既存の未認証時表示) ... */
    return (
        <div>
          <p>このページを表示するにはログインが必要です。</p>
          <button onClick={() => router.push('/api/auth/signin')} style={{ padding: '5px 10px', border: '1px solid black', cursor: 'pointer', marginTop: '10px' }}>
            サインインページへ
          </button>
        </div>
      );
  }
  if (isLoadingProduct) return <p>製品情報を読み込み中...</p>;
  if (productError) return <p style={{ color: 'red' }}>エラー: {productError}</p>;
  if (!product) return <p>製品情報が見つかりませんでした。</p>;

  return (
    <div>
      {/* ... (既存の製品詳細表示JSX) ... */}
      <Link href="/products" style={{ display: 'inline-block', marginBottom: '1rem', color: '#0070f3' }}>
        &larr; 製品一覧に戻る
      </Link>
      <h1>{product.name}</h1>
      <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <p><strong>型番:</strong> {product.modelNumber || '未登録'}</p>
        <p><strong>購入日:</strong> {product.purchaseDate ? new Date(product.purchaseDate).toLocaleDateString() : '未登録'}</p>
        {/* ... 他の製品情報 ... */}
      </div>

      {/* --- 使用履歴セクション (既存のhandleSubmitをhandleSubmitUsageに変更) --- */}
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>使用履歴を記録</h2>
        {usageFormError && <p style={{ color: 'red' }}>エラー: {usageFormError}</p>}
        {usageFormSuccess && <p style={{ color: 'green' }}>{usageFormSuccess}</p>}
        <form onSubmit={handleSubmitUsage}> {/* 関数名を変更 */}
            {/* ... (フォームの中身は変更なし) ... */}
            <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="usageDate" style={{ display: 'block', marginBottom: '0.5rem' }}>使用日:</label>
            <input type="date" id="usageDate" value={usageDate} onChange={(e) => setUsageDate(e.target.value)} required disabled={isSubmittingUsage} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }}/>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="usageDuration" style={{ display: 'block', marginBottom: '0.5rem' }}>使用時間 (分):</label>
            <input type="number" id="usageDuration" value={usageDuration} onChange={(e) => setUsageDuration(e.target.value)} placeholder="例: 30" disabled={isSubmittingUsage} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }}/>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="usageNotes" style={{ display: 'block', marginBottom: '0.5rem' }}>メモ:</label>
            <textarea id="usageNotes" value={usageNotes} onChange={(e) => setUsageNotes(e.target.value)} rows={3} disabled={isSubmittingUsage} style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }}/>
          </div>
          <button type="submit" disabled={isSubmittingUsage} style={{ padding: '0.75rem 1.5rem', border: '1px solid black', cursor: isSubmittingUsage ? 'not-allowed' : 'pointer', backgroundColor: isSubmittingUsage ? '#ccc' : '#0070f3', color: 'white', borderRadius: '5px' }}>
            {isSubmittingUsage ? '記録中...' : '使用履歴を記録'}
          </button>
        </form>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <h2>使用履歴一覧</h2>
        {/* ... (既存の使用履歴一覧表示JSXは変更なし) ... */}
        {isLoadingUsageLogs && <p>使用履歴を読み込み中...</p>}
        {usageLogsError && <p style={{ color: 'red' }}>エラー: {usageLogsError}</p>}
        {!isLoadingUsageLogs && !usageLogsError && usageLogs.length === 0 && ( <p>使用履歴はまだありません。</p> )}
        {!isLoadingUsageLogs && !usageLogsError && usageLogs.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {usageLogs.map((log) => (
              <li key={log.id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                <p><strong>使用日:</strong> {new Date(log.date).toLocaleDateString()}</p>
                {log.duration && <p><strong>使用時間:</strong> {log.duration} 分</p>}
                {log.notes && <p><strong>メモ:</strong> {log.notes}</p>}
                <p style={{ fontSize: '0.8em', color: '#666' }}>記録日: {new Date(log.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- ここからインシデント記録フォームと一覧表示 --- */}
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>インシデント/レビューを記録</h2>
        {incidentFormError && <p style={{ color: 'red' }}>エラー: {incidentFormError}</p>}
        {incidentFormSuccess && <p style={{ color: 'green' }}>{incidentFormSuccess}</p>}
        <form onSubmit={handleIncidentSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="incidentDate" style={{ display: 'block', marginBottom: '0.5rem' }}>発生/記録日:</label>
            <input
              type="date"
              id="incidentDate"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              required
              disabled={isSubmittingIncident}
              style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="incidentSeverity" style={{ display: 'block', marginBottom: '0.5rem' }}>重要度/種類:</label>
            <input
              type="text"
              id="incidentSeverity"
              value={incidentSeverity}
              onChange={(e) => setIncidentSeverity(e.target.value)}
              placeholder="例: 軽微な異音, 故障, 使いやすい点"
              disabled={isSubmittingIncident}
              style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="incidentDescription" style={{ display: 'block', marginBottom: '0.5rem' }}>内容詳細:</label>
            <textarea
              id="incidentDescription"
              value={incidentDescription}
              onChange={(e) => setIncidentDescription(e.target.value)}
              rows={4}
              required
              disabled={isSubmittingIncident}
              style={{ border: '1px solid black', padding: '0.5rem', width: '100%' }}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmittingIncident}
            style={{ padding: '0.75rem 1.5rem', border: '1px solid black', cursor: isSubmittingIncident ? 'not-allowed' : 'pointer', backgroundColor: isSubmittingIncident ? '#ccc' : '#0070f3', color: 'white', borderRadius: '5px' }}
          >
            {isSubmittingIncident ? '記録中...' : 'インシデント/レビューを記録'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>インシデント/レビュー一覧</h2>
        {isLoadingIncidents && <p>インシデント履歴を読み込み中...</p>}
        {incidentsError && <p style={{ color: 'red' }}>エラー: {incidentsError}</p>}
        {!isLoadingIncidents && !incidentsError && incidentReports.length === 0 && (
          <p>インシデント/レビューの記録はまだありません。</p>
        )}
        {!isLoadingIncidents && !incidentsError && incidentReports.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {incidentReports.map((report) => (
              <li key={report.id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                <p><strong>発生/記録日:</strong> {new Date(report.date).toLocaleDateString()}</p>
                {report.severity && <p><strong>重要度/種類:</strong> {report.severity}</p>}
                <p><strong>内容:</strong> {report.description}</p>
                <p style={{ fontSize: '0.8em', color: '#666' }}>記録日: {new Date(report.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* --- ここまでインシデント記録フォームと一覧表示 --- */}
    </div>
  );
}