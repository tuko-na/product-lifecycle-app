// src/components/UsageChart.tsx
'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// このコンポーネントが受け取るpropsの型定義
interface UsageLog {
  date: string;
  duration: number | null;
}

interface UsageChartProps {
  data: UsageLog[];
}

export default function UsageChart({ data }: UsageChartProps) {
  // useMemoを使って、propsのdataが変更されたときだけ集計処理を実行
  const monthlyData = useMemo(() => {
    // 使用時間が記録されているログのみを対象にする
    const logsWithDuration = data.filter(log => typeof log.duration === 'number' && log.duration > 0);
    
    if (logsWithDuration.length === 0) {
      return []; // グラフ描画に必要なデータがない場合は空配列を返す
    }
    
    const aggregatedData: { [key: string]: number } = {};

    logsWithDuration.forEach(log => {
      // log.duration が null でないことは上で filter しているので、ここでは number として扱える
      const duration = log.duration!;
      const date = new Date(log.date);
      // 'YYYY-MM' 形式のキーを作成 (例: '2025-06')
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!aggregatedData[monthKey]) {
        aggregatedData[monthKey] = 0;
      }
      aggregatedData[monthKey] += duration;
    });

    // Rechartsが扱いやすい形式に変換し、月でソート
    return Object.entries(aggregatedData)
      .map(([month, totalDuration]) => ({
        name: month, // X軸に表示される月の名前
        '総使用時間 (分)': totalDuration, // グラフのバーの値
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

  }, [data]); // dataが変わったときだけ再計算

  if (monthlyData.length === 0) {
    return <p>グラフを表示するための使用履歴データ（使用時間）がありません。</p>;
  }

  return (
    // ResponsiveContainerで親要素のサイズに合わせてグラフを描画
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={monthlyData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis label={{ value: '分', angle: -90, position: 'insideLeft' }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #ccc' }}
          labelStyle={{ fontWeight: 'bold' }}
        />
        <Legend />
        <Bar dataKey="総使用時間 (分)" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}