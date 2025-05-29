// src/app/api/products/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // authOptionsのパスは適宜調整

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;
  const { id: productId } = resolvedParams; // URLから製品IDを取得

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  if (!productId) {
    return NextResponse.json({ error: '製品IDが指定されていません。' }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        userId: session.user.id, // ログインしているユーザーの製品であることも確認
      },
    });

    if (!product) {
      return NextResponse.json({ error: '製品が見つからないか、アクセス権がありません。' }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error(`製品 (ID: ${productId}) 取得エラー:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ error: '製品の取得に失敗しました。', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: '製品の取得に失敗しました。' }, { status: 500 });
  }
}