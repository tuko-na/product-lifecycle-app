// src/app/api/products/[id]/usage/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface Params {
  id: string; // productId から id に変更
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;
  const { id: productId } = resolvedParams;

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  if (!productId) {
    return NextResponse.json({ error: '製品IDが指定されていません。' }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId, // productId (params.id) を使用
      },
    });

    if (!product) {
      return NextResponse.json({ error: '製品が見つかりません。' }, { status: 404 });
    }

    if (product.userId !== session.user.id) {
      return NextResponse.json({ error: 'この製品へのアクセス権がありません。' }, { status: 403 });
    }

    const body = await request.json();
    const { date, notes, duration } = body;

    if (!date) {
      return NextResponse.json({ error: '使用日は必須です。' }, { status: 400 });
    }

    const newUsageLog = await prisma.usageLog.create({
      data: {
        date: new Date(date),
        notes: notes || null,
        duration: duration ? parseInt(duration, 10) : null,
        productId: productId, // 製品の 'id' とマッピングされることを確認
      },
    });

    return NextResponse.json(newUsageLog, { status: 201 });
  } catch (error) {
    console.error(`製品 (ID: ${productId}) の使用履歴登録エラー:`, error);
    // ... (エラーハンドリング)
    if (error instanceof Error) {
        return NextResponse.json({ error: '使用履歴の登録に失敗しました。', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: '使用履歴の登録に失敗しました。' }, { status: 500 });
  }
}

// 後で使用履歴を取得するためのGETハンドラもここに追加します
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> } 
) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params; // params を await で解決
  const { id: productId } = resolvedParams;

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "認証されていません。" }, { status: 401 });
  }

  if (!productId) {
    return NextResponse.json({ error: "製品IDが指定されていません。" }, { status: 400 });
  }

  try {
    // まず製品の所有権を確認
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: session.user.id,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "製品が見つからないか、アクセス権がありません。" }, { status: 404 });
    }

    // 製品の使用履歴を取得
    const usageLogs = await prisma.usageLog.findMany({
      where: {
        productId: productId,
      },
      orderBy: {
        date: 'desc', // または createdAt: 'desc'
      },
    });
    return NextResponse.json(usageLogs, { status: 200 });
  } catch (error) {
    console.error(`製品 (ID: ${productId}) の使用履歴取得エラー:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ error: '使用履歴の取得に失敗しました。', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: '使用履歴の取得に失敗しました。' }, { status: 500 });
  }
}