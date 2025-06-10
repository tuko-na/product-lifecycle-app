// src/app/api/products/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // authOptionsのパスを確認
// import { Underdog } from 'next/font/google'; // ← この行はAPIルートでは通常不要ですので削除を推奨します

// 製品一覧を取得する GET ハンドラ
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        userId: session.user.id, // ログインしているユーザーの製品のみを取得
      },
      orderBy: {
        createdAt: 'desc', // 作成日の降順で並び替え (任意)
      },
      // 必要であれば、ここで返すフィールドを選択(select)することも可能です
      // select: { id: true, name: true, modelNumber: true, purchaseDate: true, category: true /* ...など */ }
    });
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error('製品一覧取得エラー:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: '製品一覧の取得に失敗しました。', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: '製品一覧の取得に失敗しました。' }, { status: 500 });
  }
}

// 製品を登録する POST ハンドラ (既存のコードはそのまま)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      productName,
      modelNumber,
      purchaseDate,
      category,
      manufacturer,
      warrantyMonths,
      expectedLifespanYears,
      expectedUsageHours,
      notes,
      purchasePrice,
      imageUrl,
      manualUrl,
    } = body;

    if (!productName) {
      return NextResponse.json({ error: '製品名は必須です。' }, { status: 400 });
    }

    const productData: any = {
      name: productName,
      modelNumber: modelNumber || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      userId: session.user.id,
      category: category || null,
      manufacturer: manufacturer || null,
      notes: notes || null,
      imageUrl: imageUrl || null,
      manualUrl: manualUrl || null,
    };

    if (warrantyMonths !== undefined && warrantyMonths !== null && warrantyMonths !== '') {
      productData.warrantyMonths = parseInt(warrantyMonths, 10);
      if (isNaN(productData.warrantyMonths)) {
        return NextResponse.json({ error: '保証期間（月数）は有効な数値である必要があります。' }, { status: 400 });
      }
    } else {
      productData.warrantyMonths = null;
    }

    if (expectedLifespanYears !== undefined && expectedLifespanYears !== null && expectedLifespanYears !== '') {
      productData.expectedLifespanYears = parseInt(expectedLifespanYears, 10);
      if (isNaN(productData.expectedLifespanYears)) {
        return NextResponse.json({ error: '期待寿命（年数）は有効な数値である必要があります。' }, { status: 400 });
      }
    } else {
      productData.expectedLifespanYears = null;
    }
    if (expectedUsageHours !== undefined && expectedUsageHours !== null && expectedUsageHours !== '') {
      productData.expectedUsageHours = parseInt(expectedUsageHours, 10);
      if (isNaN(productData.expectedUsageHours)) {
        return NextResponse.json({ error: '期待総使用時間は有効な数値である必要があります。' }, { status: 400 });
      }
    } else {
      productData.expectedUsageHours = null;
    }
    if (purchasePrice !== undefined && purchasePrice !== null && purchasePrice !== '') {
      productData.purchasePrice = parseFloat(purchasePrice);
      if (isNaN(productData.purchasePrice)) {
        return NextResponse.json({ error: '購入価格は有効な数値である必要があります。' }, { status: 400 });
      }
    } else {
      productData.purchasePrice = null;
    }

    const newProduct = await prisma.product.create({
      data: productData,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('製品登録エラー:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: '製品の登録に失敗しました。', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: '製品の登録に失敗しました。' }, { status: 500 });
  }
}