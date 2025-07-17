// /frontend/app/api/order/route.ts

import { OrderWithCounter } from "@opensea/seaport-js/lib/types";
import { NextResponse } from "next/server";

// 売り注文の中央データベース（メモリ内）
const orderDatas: Array<OrderWithCounter> = [];

// 売り注文（sell order）を登録・公開する POST API
export async function POST(request: Request) {
  const data = (await request.json()) as OrderWithCounter;
  orderDatas.push(data);
  return NextResponse.json({ message: "SUCCESS" });
}

// 公開中の売り注文（sell order）一覧を取得する GET API
export async function GET() {
  return NextResponse.json(orderDatas);
}

// 登録された売り注文（sell order）を削除する DELETE API
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // indexの指定が正しくなければエラー
  if (!id || isNaN(+id)) {
    return NextResponse.json({ message: "ERROR No index" }, { status: 400 });
  }

  const res = orderDatas.splice(+id, 1);

  // 削除ができていなければエラー
  if (res.length !== 1) {
    return NextResponse.json({ message: "ERROR Not Found" }, { status: 404 });
  }

  return NextResponse.json({ message: "SUCCESS" });
}
