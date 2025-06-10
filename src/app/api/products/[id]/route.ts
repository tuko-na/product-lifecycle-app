// src/app/api/products/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // authOptionsのパスを確認

interface RouteContext {
  params: {
    id: string; // 製品ID
  };
}

// (既存のGET関数はそのまま)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession(authOptions);
  const { id: productId } = await context.params;

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
        userId: session.user.id,
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

// 製品情報を更新する PUT ハンドラ
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession(authOptions);
  const { id: productId } = await context.params;

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  if (!productId) {
    return NextResponse.json({ error: '製品IDが指定されていません。' }, { status: 400 });
  }

  try {
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: '更新対象の製品が見つかりません。' }, { status: 404 });
    }

    if (existingProduct.userId !== session.user.id) {
      return NextResponse.json({ error: 'この製品の編集権限がありません。' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
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

    // 製品名は必須
    if (name !== undefined && !name) { // nameが空文字列で送られてきた場合もエラーとする
      return NextResponse.json({ error: '製品名は必須です。' }, { status: 400 });
    }

    const updateData: any = {}; // 更新するデータのみを入れるオブジェクト

    if (name !== undefined) updateData.name = name;
    if (modelNumber !== undefined) updateData.modelNumber = modelNumber || null;
    if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    if (category !== undefined) updateData.category = category || null;
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (manualUrl !== undefined) updateData.manualUrl = manualUrl || null;

    if (warrantyMonths !== undefined) {
        updateData.warrantyMonths = warrantyMonths === '' || warrantyMonths === null ? null : parseInt(warrantyMonths, 10);
        if (updateData.warrantyMonths !== null && isNaN(updateData.warrantyMonths)) {
            return NextResponse.json({ error: '保証期間（月数）は有効な数値である必要があります。' }, { status: 400 });
        }
    }
    if (expectedLifespanYears !== undefined) {
        updateData.expectedLifespanYears = expectedLifespanYears === '' || expectedLifespanYears === null ? null : parseInt(expectedLifespanYears, 10);
        if (updateData.expectedLifespanYears !== null && isNaN(updateData.expectedLifespanYears)) {
            return NextResponse.json({ error: '期待寿命（年数）は有効な数値である必要があります。' }, { status: 400 });
        }
    }
    if (expectedUsageHours !== undefined) {
      updateData.expectedUsageHours = expectedUsageHours === '' || expectedUsageHours === null ? null : parseInt(expectedUsageHours, 10);
      if (updateData.expectedUsageHours !== null && isNaN(updateData.expectedUsageHours)) {
        return NextResponse.json({ error: '期待総使用時間は有効な数値である必要があります。' }, { status: 400 });
      }
    }
    if (purchasePrice !== undefined) {
        updateData.purchasePrice = purchasePrice === '' || purchasePrice === null ? null : parseFloat(purchasePrice);
        if (updateData.purchasePrice !== null && isNaN(updateData.purchasePrice)) {
            return NextResponse.json({ error: '購入価格は有効な数値である必要があります。' }, { status: 400 });
        }
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
        // userId: session.user.id, // where句で所有権も確認する (二重チェックになるがより安全)
      },
      data: updateData,
    });

    return NextResponse.json(updatedProduct, { status: 200 }); // 200 OK
  } catch (error) {
    console.error(`製品 (ID: ${productId}) 更新エラー:`, error);
    if (error instanceof Error) {
        return NextResponse.json({ error: '製品の更新に失敗しました。', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: '製品の更新に失敗しました。' }, { status: 500 });
  }
}

// 新しくDELETE関数を追加 (製品情報の削除)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const session = await getServerSession(authOptions);
  const { id: productId } = await context.params;

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: '認証されていません。' }, { status: 401 });
  }

  if (!productId) {
    return NextResponse.json({ error: '製品IDが指定されていません。' }, { status: 400 });
  }

  try {
    // まず、対象の製品が本当にこのユーザーのものかを確認
    const productToDelete = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!productToDelete) {
      return NextResponse.json({ error: '削除対象の製品が見つかりません。' }, { status: 404 });
    }

    if (productToDelete.userId !== session.user.id) {
      return NextResponse.json({ error: 'この製品の削除権限がありません。' }, { status: 403 });
    }

    // 関連するUsageLogとIncidentReportも削除される (スキーマで onDelete: Cascade が設定されていれば)
    await prisma.product.delete({
      where: {
        id: productId,
        // userId: session.user.id, // where句で所有権も確認
      },
    });

    return NextResponse.json({ message: '製品が正常に削除されました。' }, { status: 200 }); // 200 OK または 204 No Content
  } catch (error) {
    console.error(`製品 (ID: ${productId}) 削除エラー:`, error);
    if (error instanceof Error) {
        // Prismaの P2025 (Record to delete does not exist) なども考慮
        return NextResponse.json({ error: '製品の削除に失敗しました。', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: '製品の削除に失敗しました。' }, { status: 500 });
  }
}