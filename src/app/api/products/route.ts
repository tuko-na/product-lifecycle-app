// src/app/api/products/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma'; // Prisma Clientのインポート
import { getServerSession } from 'next-auth/next'; // サーバーサイドでセッションを取得
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // authOptionsをインポート

export async function POST(request: NextRequest) {
  // サーバーサイドで現在のセッション情報を取得
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    // ユーザーが認証されていない、またはユーザーIDがない場合はエラー
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productName, modelNumber, purchaseDate } = body;

    // 簡単なバリデーション
    if (!productName) {
      return NextResponse.json({ error: '製品名は必須です。' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name: productName,
        modelNumber: modelNumber || null, // modelNumberが空の場合はnullを許容 (スキーマ定義による)
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null, // purchaseDateが空の場合はnullを許容
        userId: session.user.id, // ログインしているユーザーのIDを紐付ける
      },
    });

    return NextResponse.json(newProduct, { status: 201 }); // 201 Created
  } catch (error) {
    console.error('製品登録エラー:', error);
    // エラーが PrismaClientKnownRequestError のインスタンスであるかなどをチェックして、
    // より詳細なエラーハンドリングを行うことも可能です。
    if (error instanceof Error) {
        return NextResponse.json({ error: '製品の登録に失敗しました。', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: '製品の登録に失敗しました。' }, { status: 500 });
  }
}