// src/app/products/[id]/page.tsx
'use client';

import { useState, useEffect, FormEvent, useCallback, useMemo} from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import UsageChart from '@/components/UsageChart';

// --- 型定義 ---
interface Product {
  id: string;
  name: string;
  modelNumber: string | null;
  purchaseDate: string | null;
  createdAt: string;
  updatedAt: string;
  category: string | null;
  manufacturer: string | null;
  warrantyMonths: number | null;
  expectedLifespanYears: number | null;
  notes: string | null;
  purchasePrice: number | null;
  imageUrl: string | null;
  manualUrl: string | null;
  expectedUsageHours: number | null;
}

interface UsageLog {
  id: string;
  date: string;
  notes: string | null;
  duration: number | null;
  createdAt: string;
}

interface IncidentReport {
  id: string;
  date: string;
  description: string;
  severity: string | null;
  createdAt: string;
}

type ActiveTab = 'overview' | 'usage' | 'incidents';

// --- ヘルパー関数 ---
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '未登録';
  return new Date(dateString).toLocaleDateString();
};

const daysUntil = (targetDate: Date | null, today: Date): number | null => {
  if (!targetDate) return null;
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- コンポーネント ---
export default function ProductDetailPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string | undefined;

  // --- State定義 ---
  // Product
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // Usage Logs
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [isLoadingUsageLogs, setIsLoadingUsageLogs] = useState(true);
  const [usageLogsError, setUsageLogsError] = useState<string | null>(null);
  const [usageDate, setUsageDate] = useState('');
  const [usageNotes, setUsageNotes] = useState('');
  const [usageDuration, setUsageDuration] = useState('');
  const [isSubmittingUsage, setIsSubmittingUsage] = useState(false);
  const [usageFormError, setUsageFormError] = useState<string | null>(null);
  const [usageFormSuccess, setUsageFormSuccess] = useState<string | null>(null);

  // Incident Reports
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState('');
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
  const [incidentFormError, setIncidentFormError] = useState<string | null>(null);
  const [incidentFormSuccess, setIncidentFormSuccess] = useState<string | null>(null);
  
  // Product Delete
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // --- データ取得関数 ---
  const fetchProductDetails = useCallback(async () => {
    if (!productId) return;
    setIsLoadingProduct(true);
    setProductError(null);
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `製品データの取得に失敗しました (${res.status})`);
      }
      const data: Product = await res.json();
      setProduct(data);
    } catch (err) {
      setProductError(err instanceof Error ? err.message : String(err));
      setProduct(null);
    } finally {
      setIsLoadingProduct(false);
    }
  }, [productId]);

  const fetchUsageLogs = useCallback(async () => {
    if (!productId) return;
    setIsLoadingUsageLogs(true);
    setUsageLogsError(null);
    try {
      const res = await fetch(`/api/products/${productId}/usage`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `使用履歴の取得に失敗しました (${res.status})`);
      }
      const data: UsageLog[] = await res.json();
      setUsageLogs(data);
    } catch (err) {
      setUsageLogsError(err instanceof Error ? err.message : String(err));
      setUsageLogs([]);
    } finally {
      setIsLoadingUsageLogs(false);
    }
  }, [productId]);

  const fetchIncidentReports = useCallback(async () => {
    if (!productId) return;
    setIsLoadingIncidents(true);
    setIncidentsError(null);
    try {
      const res = await fetch(`/api/products/${productId}/incidents`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `インシデント履歴の取得に失敗しました (${res.status})`);
      }
      const data: IncidentReport[] = await res.json();
      setIncidentReports(data);
    } catch (err) {
      setIncidentsError(err instanceof Error ? err.message : String(err));
      setIncidentReports([]);
    } finally {
      setIsLoadingIncidents(false);
    }
  }, [productId]);

  // --- 初期データ取得 useEffect ---
  useEffect(() => {
    if (sessionStatus === 'authenticated' && productId) {
      fetchProductDetails();
      fetchUsageLogs();
      fetchIncidentReports();
    } else if (sessionStatus === 'unauthenticated') {
      setIsLoadingProduct(false);
      setIsLoadingUsageLogs(false);
      setIsLoadingIncidents(false);
    }
    // sessionStatus === 'loading' の時は何もしない (上位のローディング表示でカバー)
  }, [sessionStatus, productId, fetchProductDetails, fetchUsageLogs, fetchIncidentReports]);

  // --- フォーム送信・削除処理 ---
  const handleSubmitUsage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productId) { setUsageFormError('製品IDが不明'); return; }
    setIsSubmittingUsage(true);
    setUsageFormError(null); setUsageFormSuccess(null);
    try {
      const response = await fetch(`/api/products/${productId}/usage`, { /* ... (POSTリクエスト) ... */ 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: usageDate, notes: usageNotes, duration: usageDuration ? parseInt(usageDuration) : null }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '登録失敗');
      }
      const newLog = await response.json();
      setUsageFormSuccess(`使用履歴(ID: ${newLog.id})登録成功`);
      setUsageDate(''); setUsageNotes(''); setUsageDuration('');
      fetchUsageLogs(); // 一覧を更新
    } catch (err) {
      setUsageFormError(err instanceof Error ? err.message : '登録エラー');
    } finally {
      setIsSubmittingUsage(false);
    }
  };

  const handleIncidentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productId) { setIncidentFormError('製品IDが不明'); return; }
    setIsSubmittingIncident(true);
    setIncidentFormError(null); setIncidentFormSuccess(null);
    try {
      const response = await fetch(`/api/products/${productId}/incidents`, { /* ... (POSTリクエスト) ... */
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: incidentDate, description: incidentDescription, severity: incidentSeverity || null }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '登録失敗');
      }
      const newIncident = await response.json();
      setIncidentFormSuccess(`インシデント(ID: ${newIncident.id})登録成功`);
      setIncidentDate(''); setIncidentDescription(''); setIncidentSeverity('');
      fetchIncidentReports(); // 一覧を更新
    } catch (err) {
      setIncidentFormError(err instanceof Error ? err.message : '登録エラー');
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productId || !product) return;
    if (!window.confirm(`製品「${product.name}」を本当に削除しますか？`)) return;
    setIsDeleting(true); setDeleteError(null);
    try {
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '削除失敗');
      }
      alert('製品を削除しました。');
      router.push('/products');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '削除エラー');
    } finally {
      setIsDeleting(false);
    }
  };

    // 総使用時間（分）を計算
  const totalUsageMinutes = useMemo(() => {
    return usageLogs.reduce((total, log) => total + (log.duration || 0), 0);
  }, [usageLogs]); // usageLogsが変更されたときだけ再計算

  // 寿命進捗率を計算
  const usageLifespanProgress = useMemo(() => {
    if (product?.expectedUsageHours && totalUsageMinutes > 0) {
      const expectedMinutes = product.expectedUsageHours * 60;
      if (expectedMinutes === 0) return 0; // 0除算を防ぐ
      const progress = Math.round((totalUsageMinutes / expectedMinutes) * 100);
      return Math.min(progress, 100); // 100%を上限とする
    }
    return 0; // 期待総使用時間がない場合などは0%
  }, [product?.expectedUsageHours, totalUsageMinutes]);

  // --- 日付計算関連 ---
  const today = new Date();
  const warrantyEndDate = product?.purchaseDate && typeof product.warrantyMonths === 'number'
    ? (() => { const d = new Date(product.purchaseDate); d.setMonth(d.getMonth() + product.warrantyMonths); return d; })()
    : null;
  const expectedEOLDate = product?.purchaseDate && typeof product.expectedLifespanYears === 'number'
    ? (() => { const d = new Date(product.purchaseDate); d.setFullYear(d.getFullYear() + product.expectedLifespanYears); return d; })()
    : null;
  const daysToWarrantyEnd = daysUntil(warrantyEndDate, today);
  const daysToExpectedEOL = daysUntil(expectedEOLDate, today);


  // --- レンダリングロジック ---
  if (sessionStatus === 'loading') {
    return <p>セッション情報を読み込み中...</p>;
  }  
  if (!product) return null;
  if (sessionStatus === 'unauthenticated') {

    return (
      <div>
        <p>このページを表示するにはログインが必要です。</p>
        <button onClick={() => router.push('/api/auth/signin')} style={buttonStyle}>サインインページへ</button>
      </div>
    );
  }

  // 製品情報、使用履歴、インシデント履歴のいずれかがローディング中
  if (isLoadingProduct || isLoadingUsageLogs || isLoadingIncidents) {
    return <p>情報を読み込み中...</p>;
  }

  // 製品情報取得エラー (かつ製品データがまだない場合)
  if (productError && !product) {
    return <p style={{ color: 'red' }}>エラー: {productError}</p>;
  }
  // ローディング完了後、製品データがない (見つからなかった) 場合
  if (!product) {
    return <p>製品情報が見つかりませんでした。</p>;
  }

  // ここまでくれば product は null ではない
  return (
    <div>
      {/* ヘッダー (戻るボタン、編集・削除ボタン) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Link href="/products" style={{ color: '#0070f3' }}>&larr; 製品一覧に戻る</Link>
        <div>
          <Link href={`/products/${product.id}/edit`} style={{ marginRight: '10px' }}>
            <button style={buttonStyle}>製品情報を編集</button>
          </Link>
          <button onClick={handleDeleteProduct} disabled={isDeleting} style={{...buttonStyle, backgroundColor: '#d9534f'}}>
            {isDeleting ? '削除中...' : '製品を削除'}
          </button>
        </div>
      </div>
      {deleteError && <p style={{ color: 'red' }}>削除エラー: {deleteError}</p>}

      <h1>{product.name}</h1>

      {/* タブナビゲーション */}
      <div style={{ marginBottom: '1rem', borderBottom: '1px solid #ccc' }}>
        <button onClick={() => setActiveTab('overview')} style={activeTab === 'overview' ? tabButtonStyleActive : tabButtonStyle}>概要</button>
        <button onClick={() => setActiveTab('usage')} style={activeTab === 'usage' ? tabButtonStyleActive : tabButtonStyle}>使用履歴</button>
        <button onClick={() => setActiveTab('incidents')} style={activeTab === 'incidents' ? tabButtonStyleActive : tabButtonStyle}>インシデント</button>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'overview' && (
        <div>
          <h2>製品概要</h2>
          <div style={sectionStyle}>
            <strong>カテゴリ:</strong>         <span>{product.category || '未登録'}</span>
            {/* ... 他の製品情報 ... */}
            <strong>購入日:</strong>           <span>{formatDate(product.purchaseDate)}</span>
            <strong>保証期間:</strong>         <span>{product.warrantyMonths ? `${product.warrantyMonths}ヶ月` : '未登録'}</span>
            <strong>期待寿命:</strong>         <span>{product.expectedLifespanYears ? `${product.expectedLifespanYears}年` : '未登録'}</span>
            <strong>購入価格:</strong>         <span>{product.purchasePrice !== null ? `${product.purchasePrice.toLocaleString()}円` : '未登録'}</span>
          </div>
          <h3>保証・寿命情報</h3>
          <div style={sectionStyle}>
            {warrantyEndDate ? (
              <p style={{ color: daysToWarrantyEnd !== null && daysToWarrantyEnd < 0 ? 'red' : (daysToWarrantyEnd !== null && daysToWarrantyEnd <= 30 ? 'orange' : 'inherit')}}>
                <strong>保証終了日:</strong> {warrantyEndDate.toLocaleDateString()}
                {daysToWarrantyEnd !== null && (
                  daysToWarrantyEnd < 0 ? ` (保証切れ)` : ` (あと ${daysToWarrantyEnd} 日)`
                )}
              </p>
            ) : (
              <p>保証期間: 未登録</p>
            )}
            {expectedEOLDate ? (
              <p style={{ color: daysToExpectedEOL !== null && daysToExpectedEOL < 0 ? 'grey' : (daysToExpectedEOL !== null && daysToExpectedEOL <= 180 ? 'orange' : 'inherit')}}>
                <strong>期待寿命期限:</strong> {expectedEOLDate.toLocaleDateString()}
                {daysToExpectedEOL !== null && (
                  daysToExpectedEOL < 0 ? ` (期待寿命超過)` : ` (あと約 ${Math.floor(daysToExpectedEOL / 30)} ヶ月)` // ここもdaysToExpectedEOLを使用
                )}
              </p>
            ) : (
              <p>期待寿命: 未登録</p>
            )}
          </div>
          <h3>使用量ベースの寿命</h3>
          <div style={sectionStyle}>
            {product.expectedUsageHours ? (
              <div>
                <p>
                  <strong>総使用時間:</strong> {Math.floor(totalUsageMinutes / 60)} 時間 {totalUsageMinutes % 60} 分
                  <span style={{ color: '#666', marginLeft: '10px' }}>
                    / 期待総使用時間: {product.expectedUsageHours} 時間
                  </span>
                </p>
                <div style={{ backgroundColor: '#e9ecef', borderRadius: '0.25rem', overflow: 'hidden', width: '100%', height: '20px' }}>
                  <div
                    style={{
                      width: `${usageLifespanProgress}%`,
                      height: '100%',
                      backgroundColor: usageLifespanProgress > 90 ? '#d9534f' : (usageLifespanProgress > 70 ? '#f0ad4e' : '#5cb85c'),
                      transition: 'width 0.6s ease-in-out',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}
                  >
                    {usageLifespanProgress}%
                  </div>
                </div>
              </div>
            ) : (
              <p>期待総使用時間が設定されていません。製品情報を編集して設定してください。</p>
            )}
          </div>
          <h3>メモ</h3>
          <div style={{...sectionStyle, whiteSpace: 'pre-wrap'}}>{product.notes || 'メモはありません。'}</div>
        </div>
      )}

      {activeTab === 'usage' && (
        <div id="usage-content">
          <div style={{ marginBottom: '2rem' }}>
            <h2>使用状況グラフ (月別)</h2>
            {isLoadingUsageLogs ? (
              <p>グラフデータを読み込み中...</p>
            ) : (
              <UsageChart data={usageLogs} />
            )}
          </div>
          <div>
            <h2>使用履歴を記録</h2>
            {usageFormError && <p style={{ color: 'red' }}>{usageFormError}</p>}
            {usageFormSuccess && <p style={{ color: 'green' }}>{usageFormSuccess}</p>}
            <form onSubmit={handleSubmitUsage} style={formStyle}>
              {/* 使用履歴フォームの各フィールド */}
              <div><label htmlFor="usageDate">使用日:</label><input type="date" id="usageDate" value={usageDate} onChange={e => setUsageDate(e.target.value)} required disabled={isSubmittingUsage} style={inputStyle}/></div>
              <div><label htmlFor="usageDuration">使用時間(分):</label><input type="number" id="usageDuration" value={usageDuration} onChange={e => setUsageDuration(e.target.value)} disabled={isSubmittingUsage} style={inputStyle}/></div>
              <div><label htmlFor="usageNotes">メモ:</label><textarea id="usageNotes" value={usageNotes} onChange={e => setUsageNotes(e.target.value)} rows={3} disabled={isSubmittingUsage} style={inputStyle}/></div>
              <button type="submit" disabled={isSubmittingUsage} style={buttonStyle}>{isSubmittingUsage ? '記録中...' : '使用履歴を記録'}</button>
            </form>
            <h2 style={{marginTop: '2rem'}}>使用履歴一覧</h2>
            {isLoadingUsageLogs && <p>読み込み中...</p>}
            {usageLogsError && <p style={{ color: 'red' }}>{usageLogsError}</p>}
            {!isLoadingUsageLogs && !usageLogsError && usageLogs.length === 0 && <p>使用履歴はありません。</p>}
            {!isLoadingUsageLogs && !usageLogsError && usageLogs.length > 0 && (
              <ul style={{listStyle:'none', padding:0}}>{usageLogs.map(log => <li key={log.id} style={listItemStyle}><p><strong>使用日:</strong> {formatDate(log.date)}</p>{log.duration && <p><strong>使用時間:</strong> {log.duration}分</p>}{log.notes && <p><strong>メモ:</strong> {log.notes}</p>}<p style={smallTextStyle}>記録日: {formatDate(log.createdAt)}</p></li>)}</ul>
            )}
          </div>
        </div>
      )}

      {activeTab === 'incidents' && (
         <div>
          <h2>インシデント/レビューを記録</h2>
          {incidentFormError && <p style={{ color: 'red' }}>{incidentFormError}</p>}
          {incidentFormSuccess && <p style={{ color: 'green' }}>{incidentFormSuccess}</p>}
          <form onSubmit={handleIncidentSubmit} style={formStyle}>
            {/* インシデントフォームの各フィールド */}
            <div><label htmlFor="incidentDate">発生/記録日:</label><input type="date" id="incidentDate" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} required disabled={isSubmittingIncident} style={inputStyle}/></div>
            <div><label htmlFor="incidentSeverity">重要度/種類:</label><input type="text" id="incidentSeverity" value={incidentSeverity} onChange={e => setIncidentSeverity(e.target.value)} disabled={isSubmittingIncident} style={inputStyle}/></div>
            <div><label htmlFor="incidentDescription">内容詳細:</label><textarea id="incidentDescription" value={incidentDescription} onChange={e => setIncidentDescription(e.target.value)} rows={4} required disabled={isSubmittingIncident} style={inputStyle}/></div>
            <button type="submit" disabled={isSubmittingIncident} style={buttonStyle}>{isSubmittingIncident ? '記録中...' : 'インシデント/レビューを記録'}</button>
          </form>
          <h2 style={{marginTop: '2rem'}}>インシデント/レビュー一覧</h2>
          {isLoadingIncidents && <p>読み込み中...</p>}
          {incidentsError && <p style={{ color: 'red' }}>{incidentsError}</p>}
          {!isLoadingIncidents && !incidentsError && incidentReports.length === 0 && <p>記録はありません。</p>}
          {!isLoadingIncidents && !incidentsError && incidentReports.length > 0 && (
             <ul style={{listStyle:'none', padding:0}}>{incidentReports.map(report => <li key={report.id} style={listItemStyle}><p><strong>発生/記録日:</strong> {formatDate(report.date)}</p>{report.severity && <p><strong>重要度/種類:</strong> {report.severity}</p>}<p><strong>内容:</strong> {report.description}</p><p style={smallTextStyle}>記録日: {formatDate(report.createdAt)}</p></li>)}</ul>
          )}
        </div>
      )}
    </div>
  );
}

// --- スタイル定義 (共通化) ---
const tabButtonStyle = { padding: '10px 15px', cursor: 'pointer', border: 'none', borderBottom: '2px solid transparent', backgroundColor: 'transparent', marginRight: '5px', fontSize: '1rem' };
const tabButtonStyleActive = { ...tabButtonStyle, borderBottom: '2px solid #0070f3', fontWeight: 'bold', color: '#0070f3' };
const sectionStyle = { border: '1px solid #eee', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' };
const formStyle = { display: 'flex', flexDirection: 'column' as 'column', gap: '1rem' }; // as 'column' で型エラー回避
const inputStyle = { border: '1px solid black', padding: '0.5rem', width: '100%' };
const buttonStyle = { padding: '0.75rem 1.5rem', border: '1px solid black', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', borderRadius: '5px', marginTop: '1rem' };
const listItemStyle = { border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '5px' };
const smallTextStyle = { fontSize: '0.8em', color: '#666' };