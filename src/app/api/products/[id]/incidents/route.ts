// src/app/api/products/[id]/incidents/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // authOptionsのパスを確認

interface RouteContext {
  params: {
    id: string; // 製品ID (ディレクトリ名が [id] なので 'id' を使用)
  };
}

// 新しいインシデントを登録する POST ハンドラ
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession(authOptions);
  const { id: productId } = await context.params; // paramsをawaitで解決

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  if (!productId) {
    return NextResponse.json({ error: '製品IDが指定されていません。' }, { status: 400 });
  }

  try {
    // 製品の所有権を確認
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: '製品が見つかりません。' }, { status: 404 });
    }

    if (product.userId !== session.user.id) {
      return NextResponse.json({ error: 'この製品へのアクセス権がありません。' }, { status: 403 });
    }

    const body = await request.json();
    const { date, description, severity } = body;

    if (!date || !description) {
      return NextResponse.json({ error: '発生日と内容は必須です。' }, { status: 400 });
    }

    const newIncidentReport = await prisma.incidentReport.create({
      data: {
        date: new Date(date),
        description: description,
        severity: severity || null,
        productId: productId,
      },
    });

    return NextResponse.json(newIncidentReport, { status: 201 });
  } catch (error) {
    console.error(`製品 (ID: ${productId}) のインシデント登録エラー:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ error: 'インシデントの登録に失敗しました。', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'インシデントの登録に失敗しました。' }, { status: 500 });
  }
}

// 特定の製品のインシデント一覧を取得する GET ハンドラ
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession(authOptions);
  const { id: productId } = await context.params; // paramsをawaitで解決

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  if (!productId) {
    return NextResponse.json({ error: '製品IDが指定されていません。' }, { status: 400 });
  }

  try {
    // 製品の所有権を確認 (任意だが、他人の製品のインシデントは見せない方が良い場合)
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: session.user.id,
      },
    });

    if (!product) {
      return NextResponse.json({ error: '製品が見つからないか、アクセス権がありません。' }, { status: 404 });
    }

    const incidents = await prisma.incidentReport.findMany({
      where: {
        productId: productId,
      },
      orderBy: {
        date: 'desc', // 発生日の降順で並び替え
      },
    });

    return NextResponse.json(incidents, { status: 200 });
  } catch (error) {
    console.error(`製品 (ID: ${productId}) のインシデント取得エラー:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ error: 'インシデントの取得に失敗しました。', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'インシデントの取得に失敗しました。' }, { status: 500 });
  }
}