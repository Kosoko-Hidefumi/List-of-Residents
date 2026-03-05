# 研修医マスタ & 専門科ダッシュボード Webアプリ 実装プロンプト

---

## 🎯 プロジェクト概要

Excelファイル（.xlsx / .xlsm）をドラッグ&ドロップまたはクリックでアップロードすると、
自動的に「研修医マスタ一覧」と「専門科ダッシュボード」の2タブ構成のWebアプリを生成するSPA（Single Page Application）を実装してください。

バックエンドは不要です。すべてブラウザ上のフロントエンドのみで完結させてください。

---

## 🛠 技術スタック

| 用途 | ライブラリ |
|------|-----------|
| フレームワーク | React 18 + TypeScript |
| ビルドツール | Vite |
| スタイリング | Tailwind CSS v3 |
| Excel解析 | SheetJS (`xlsx`) |
| グラフ描画 | Chart.js v4 + react-chartjs-2 |
| アイコン | Lucide React |
| 状態管理 | React useState / useContext（外部ライブラリ不要） |

---

## 📁 ディレクトリ構成

```
src/
├── main.tsx
├── App.tsx                        # ルートコンポーネント・タブ管理
├── types/
│   └── index.ts                   # 共通型定義
├── hooks/
│   ├── useExcelParser.ts          # Excelファイル解析フック
│   └── useDataFilter.ts           # フィルタ・ソートロジック
├── utils/
│   ├── normalizeDept.ts           # 専門科名の正規化
│   └── colors.ts                  # 学年・専門科カラーマッピング
├── components/
│   ├── layout/
│   │   ├── TabHeader.tsx          # タブ切り替えヘッダー
│   │   └── ControlBar.tsx         # 検索・フィルタ・ソートバー
│   ├── upload/
│   │   └── FileUpload.tsx         # ファイルアップロード画面
│   ├── master/
│   │   ├── MasterTab.tsx          # 研修医マスタ タブ本体
│   │   ├── YearTabs.tsx           # 年度タブ
│   │   ├── GradeSection.tsx       # 学年セクション
│   │   ├── PersonCard.tsx         # 個人カード
│   │   ├── PersonTable.tsx        # 一覧テーブル
│   │   └── PersonModal.tsx        # 詳細モーダル
│   └── dashboard/
│       ├── DashboardTab.tsx       # ダッシュボード タブ本体
│       ├── KpiCards.tsx           # KPIカード群
│       ├── BarChart.tsx           # 専門科別横棒グラフ
│       ├── DoughnutChart.tsx      # 構成比ドーナツグラフ
│       ├── TrendChart.tsx         # 年度推移折れ線グラフ
│       ├── StackedChart.tsx       # 学年×専門科積み上げ棒
│       ├── GenderChart.tsx        # 男女比積み上げ横棒
│       └── RankTable.tsx          # ランキングテーブル
└── index.css
```

---

## 📊 データ仕様

### Excelファイル構造

- シート名: `main`（最初のシートをフォールバックとして使用）
- 1行目: ヘッダー行
- 2行目以降: データ行

### カラム定義（TypeScript型）

```typescript
// src/types/index.ts

export interface ResidentRecord {
  年度: string;         // "2025" など（数値でも文字列に変換）
  学年: string;         // "PGY1" | "PGY2" | "PGY3" | "PGY4" | "PGY5" | "PGY6"
  "初・後": string;     // "51期" など
  PHS: string;          // PHS番号（数値の場合は文字列変換）
  名前: string;
  ふりがな: string;
  性別: string;         // "男" | "女"
  専門科: string;       // 生の専門科名
  進路: string;
  動向調査: string;
  本籍: string;
  出身大学: string;
  備考: string;
  email: string;
  // 正規化済みフィールド（パース時に追加）
  専門科正規化?: string;
}

export type ViewMode = "card" | "table";
export type SortMode = "grade" | "kana" | "dept";
export type TabType = "master" | "dashboard";
```

---

## 🔧 専門科名の正規化ロジック

`src/utils/normalizeDept.ts` に以下のロジックを実装してください。
表記揺れを統一し、グラフ・集計に使用します。

```typescript
export function normalizeDept(dept: string): string {
  if (!dept) return "不明";
  if (dept.includes("外科（一般外科）") || dept.includes("外科(一般外科）"))
    return "外科（一般外科）";
  if (dept.includes("外科（整形") || dept.includes("外科(整形)"))
    return "外科（整形外科）";
  if (dept.includes("外科（形成"))
    return "外科（形成外科）";
  if (dept.includes("外科（脳") || dept.includes("外科(脳") || dept.includes("脳神経外科"))
    return "外科（脳神経外科）";
  if (dept.includes("外科（耳鼻") || dept.includes("外科（泌尿") || dept.includes("耳鼻咽喉科"))
    return "外科（その他）";
  if (dept.includes("外科系")) return "外科系";
  if (dept.includes("外科"))    return "外科";
  if (
    dept.includes("救命救急科") || dept.includes("救急救命科") ||
    dept.includes("救急科")     || dept.includes("救急")
  ) return "救急科";
  if (dept.includes("内科"))    return "内科";
  if (dept.includes("泌尿器"))  return "泌尿器科";
  return dept;
}
```

---

## 🎨 カラー定義

`src/utils/colors.ts` に以下を定義してください。

```typescript
export const GRADE_COLORS: Record<string, string> = {
  PGY1: "#3B82F6",
  PGY2: "#10B981",
  PGY3: "#F59E0B",
  PGY4: "#EF4444",
  PGY5: "#8B5CF6",
  PGY6: "#EC4899",
};

export const DEPT_COLORS: Record<string, string> = {
  "内科":           "#3B82F6",
  "総合診療科":     "#10B981",
  "救急科":         "#F59E0B",
  "産婦人科":       "#EC4899",
  "小児科":         "#8B5CF6",
  "外科":           "#EF4444",
  "外科（一般外科）": "#F97316",
  "プライマリ":     "#22C55E",
  "外科（脳神経外科）": "#84CC16",
  "外科（形成外科）":  "#14B8A6",
  "外科（整形外科）":  "#A78BFA",
  "外科（その他）":    "#64748B",
  "外科系":         "#FB923C",
  "泌尿器科":       "#6B7280",
  "麻酔科":         "#06B6D4",
  "病理":           "#94A3B8",
  "精神科":         "#0EA5E9",
  "うるま":         "#78716C",
};

export function getDeptColor(dept: string): string {
  return DEPT_COLORS[dept] ?? "#94A3B8";
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
```

---

## 📤 Excelパースフック

`src/hooks/useExcelParser.ts` に以下を実装してください。

```typescript
import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { ResidentRecord } from "../types";
import { normalizeDept } from "../utils/normalizeDept";

export function useExcelParser() {
  const [data, setData] = useState<ResidentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const parseFile = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: "array" });
        // "main" シートを優先、なければ最初のシート
        const sheetName = wb.SheetNames.includes("main")
          ? "main"
          : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: "",
        });
        const parsed: ResidentRecord[] = rows
          .filter((r) => r["名前"])
          .map((r) => ({
            年度:   String(r["年度"]   ?? ""),
            学年:   String(r["学年"]   ?? ""),
            "初・後": String(r["初・後"] ?? ""),
            PHS:    String(r["PHS"]    ?? ""),
            名前:   String(r["名前"]   ?? ""),
            ふりがな: String(r["ふりがな"] ?? ""),
            性別:   String(r["性別"]   ?? ""),
            専門科: String(r["専門科"] ?? ""),
            進路:   String(r["進路"]   ?? ""),
            動向調査: String(r["動向調査"] ?? ""),
            本籍:   String(r["本籍"]   ?? ""),
            出身大学: String(r["出身大学"] ?? ""),
            備考:   String(r["備考"]   ?? ""),
            email:  String(r["email"]  ?? ""),
            専門科正規化: normalizeDept(String(r["専門科"] ?? "")),
          }));
        setData(parsed);
      } catch (err) {
        setError("Excelファイルの読み込みに失敗しました。形式を確認してください。");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  return { data, isLoading, error, fileName, parseFile };
}
```

---

## 🖥 画面仕様

### 1. アップロード画面（data が空の初期状態）

- 画面中央にドラッグ&ドロップエリアを表示
- `.xlsx` / `.xlsm` のみ受け付け
- ドラッグオーバー時にハイライト表示
- ファイル選択ボタンも表示
- アップロード中はスピナー表示
- エラー時は赤色メッセージ表示
- デザイン: グラデーションヘッダー + 白カード + シャドウ

```
┌─────────────────────────────────────────────────────────┐
│  🏥  研修医マスタ & ダッシュボード                        │  ← ヘッダー（紺→青グラデ）
└─────────────────────────────────────────────────────────┘
│                                                           │
│   ┌─────────────────────────────────────────────────┐   │
│   │                                                   │   │
│   │       📂                                          │   │
│   │   Excelファイルをドラッグ&ドロップ                │   │
│   │   または クリックしてファイルを選択               │   │
│   │                                                   │   │
│   │   対応形式: .xlsx / .xlsm                         │   │
│   │                                                   │   │
│   └─────────────────────────────────────────────────┘   │
│                                                           │
```

### 2. メイン画面（data がある状態）

#### 2-1. タブヘッダー（sticky top-0）

```
┌────────────────────────────────────────────────────────────────┐
│ 🏥 研修医マスタ  │  👤 研修医マスタ  │  📊 専門科ダッシュボード │
│                  │  ─────────────    │                          │
└────────────────────────────────────────────────────────────────┘
```

- ロゴ + アプリ名を左端に表示
- アクティブタブは白文字 + 水色アンダーライン
- 非アクティブは半透明白文字

#### 2-2. 研修医マスタ タブ

**コントロールバー（sticky、タブヘッダー直下に固定）:**
- 🔍 テキスト検索: 名前・ふりがな・出身大学・専門科・本籍 に対して部分一致
- 📌 学年フィルタ（select）: すべて / PGY1 〜 PGY6
- ⚧ 性別フィルタ（select）: すべて / 男性 / 女性
- 🏥 専門科フィルタ（select）: すべて / データから動的生成（生の専門科名一覧）
- 🔀 並び替えボタン群（3択トグル）:
  - 🎓 学年別: 学年グループ分け、グループ内はデータ元順
  - あ 五十音: 学年グループ内をふりがな昇順（ふりがな空の場合は名前でフォールバック）
  - 🏥 専門科別: 学年グループ内で専門科ごとのサブセクション表示（サブ内は五十音順）
- ⊞/≡ カード/テーブル 表示切替ボタン
- 右端: 「N 件」件数表示

**年度タブ（コントロールバー下）:**
- ボタン形式: 全年度 / 2017年度 / 2018年度 ... 2025年度（データから動的生成）
- アクティブは紺色背景、非アクティブは白背景
- 全年度タブはダークネイビー背景

**カード表示:**
- 学年ごとにセクション分け（PGY1 → PGY6 順）
- セクションヘッダー: 学年カラーバッジ + "PGYn 研修医" + 人数
- カードグリッド: `grid-template-columns: repeat(auto-fill, minmax(193px, 1fr))`
- 各カードの構成:
  ```
  ┌───────────────────┐  ← 上部3px カラーバー（専門科色）
  │              📞PHS│  ← PHS番号（右上）
  │ 名前（太字）       │
  │ ふりがな（小・灰）  │
  │ [専門科] [♂/♀] [大学名] │  ← タグ群
  └───────────────────┘
  ```
- カードクリックで詳細モーダルを開く
- ホバーで2px上昇 + シャドウ + アクセントカラーボーダー
- 全年度表示時は「[年度]年」タグも表示

**専門科別ソート時のサブセクション:**
- 学年セクション内に専門科別サブグループを表示
- サブヘッダー: 専門科色背景の角丸バー + "🏥 専門科名" + 人数
- **注意**: サブグループのグリッド要素はIDに頼らずDOM直接参照で実装すること（日本語IDによる衝突バグ回避）

**テーブル表示:**
- 学年ごとにテーブルを分割表示
- カラム: 名前（ふりがな）/ 性別 / 期 / 専門科 / 出身大学 / 本籍 / 進路 / PHS / 備考
- 全年度表示時は左端に「年度」カラムを追加
- ヘッダークリックでカラムソート（昇順→降順トグル、ソート中カラムは青ハイライト + ▲/▼）
- ソート対象: ふりがな / 性別 / 期 / 専門科 / 出身大学 / 本籍 / 進路 / PHS（備考はソート不可）
- 行クリックで詳細モーダルを開く
- `テーブルヘッダーの sticky top` で列ヘッダー固定は不要（テーブル内スクロールで対応）

**詳細モーダル:**
- 画面中央に出現（オーバーレイ背景 rgba(0,0,0,0.5)）
- 右上 × ボタン or オーバーレイクリックで閉じる
- 表示項目: 学年バッジ + 専門科バッジ / 名前（大きく） / ふりがな / 2カラムグリッドで各フィールド
- 全フィールド: 年度・学年・期・性別・専門科・進路・出身大学・本籍・PHS・Email（値がある項目のみ表示）
- 動向調査・備考は全幅（2カラムまたがり）で表示

#### 2-3. 専門科ダッシュボード タブ

**コントロールバー（sticky）:**
- 📅 年度フィルタ（select）: 全年度 / 2017年度 ... 2025年度
- 🎓 学年フィルタ（select）: すべて / PGY1 〜 PGY6
- ⚧ 性別フィルタ（select）: すべて / 男性 / 女性
- フィルタ変更時に全グラフをリアルタイム更新

**KPIカード行（グリッド: minmax(145px, 1fr)）:**
- 総人数: フィルタ後の合計人数
- 専門科数: フィルタ後の専門科種類数
- 1位・2位・3位の専門科名と人数・割合
- 各カードは左側4pxカラーボーダー付き

**グラフ1: 専門科別 人数（横棒グラフ）**
- Chart.js type: `bar` + `indexAxis: 'y'`
- 多い順にソート
- 各バーは専門科カラー
- ホバーで「N 名」ツールチップ

**グラフ2: 専門科別 構成比（ドーナツグラフ）**
- Chart.js type: `doughnut`
- cutout: "60%"
- 凡例は右側に表示（専門科名 + 人数）
- ホバーで「科名: N名 (X.X%)」ツールチップ

**グラフ3: 専門科別 年度推移（折れ線グラフ）**
- 全期間のデータを使用（年度フィルタに関わらず全年度表示）
- 上位6専門科をラインで表示（正規化済み専門科名で集計）
- tension: 0.4 で滑らかな曲線
- ホバーで全ライン同時表示（mode: 'index'）

**グラフ4: 学年別 × 専門科 構成（積み上げ棒グラフ）**
- X軸: PGY1〜PGY6
- 上位8専門科を積み上げ
- 年度フィルタ・性別フィルタに連動

**グラフ5: 専門科別 男女比（積み上げ横棒グラフ）**
- Y軸: 専門科名（上位10科）
- 男性（青）・女性（ピンク）の積み上げ
- 年度フィルタ・学年フィルタに連動

**ランキングテーブル:**
- 専門科名 / プログレスバー / 人数 / 割合（%）を一覧
- 専門科ドット（●）が専門科カラーで表示
- 「全N専門科 / 合計N名」のサブタイトル表示

---

## 🔩 実装上の重要な注意事項

### 1. 専門科別サブグループのDOM操作
学年内で専門科ごとにサブグループを作る際、**日本語の専門科名をHTML要素のIDに使ってはいけません**。
「内科」「外科」などがすべて同じIDになり要素が衝突します。
React であれば ref や直接的なコンポーネント分離で安全に実装できます。

### 2. Chart.js の再描画
タブ切り替えや状態変更時にチャートを再描画する際は、
必ず前のインスタンスを `destroy()` してから新しいチャートを作成してください。
react-chartjs-2 を使う場合は `key` prop の変更で自動的に再マウントされます。

### 3. Excelデータの型変換
SheetJS で読み込むと数値型になる場合があります（PHS番号、年度など）。
すべてのフィールドを `String()` で文字列変換してください。

### 4. ふりがなのない五十音ソート
ふりがなが空文字の場合は `名前` フィールドでフォールバックして `localeCompare(str, 'ja')` でソートしてください。
漢字の localeCompare は完全ではないため、可能であれば「ふりがなあり」データのみを先に表示するか、
名前の読みがわからない旨をUIで表現しても構いません。

### 5. ファイル再アップロード
ヘッダー右端に「ファイルを変更」ボタンを設置し、
クリックするとアップロード画面に戻れるようにしてください（state リセット）。

---

## 🚀 セットアップ手順（README.md に記載）

```bash
# 1. プロジェクト作成
npm create vite@latest resident-dashboard -- --template react-ts
cd resident-dashboard

# 2. 依存ライブラリインストール
npm install xlsx chart.js react-chartjs-2 lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. Tailwind設定（tailwind.config.js）
# content: ["./index.html", "./src/**/*.{ts,tsx}"] を設定

# 4. index.css に @tailwind directives を追加

# 5. 開発サーバー起動
npm run dev
```

---

## 🎨 デザイントークン（Tailwind カスタムカラー）

`tailwind.config.js` に以下を追加してください:

```js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: "#1e3a5f",
        light: "#2563eb",
      },
      accent: "#0ea5e9",
      "bg-base": "#f0f4f8",
    },
  },
},
```

---

## 📐 レイアウト構造（App.tsx）

```
<App>
  {!data.length ? (
    <FileUpload onFileSelect={parseFile} isLoading={isLoading} error={error} />
  ) : (
    <>
      <TabHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        fileName={fileName}
        onReset={() => setData([])}
      />
      {activeTab === "master" && (
        <MasterTab data={data} />
      )}
      {activeTab === "dashboard" && (
        <DashboardTab data={data} />
      )}
    </>
  )}
</App>
```

---

## ✅ 完成チェックリスト

- [ ] Excelファイル（.xlsx/.xlsm）のドラッグ&ドロップアップロード
- [ ] `main` シート優先、ない場合は最初のシートを使用
- [ ] データが空の場合はアップロード画面を表示
- [ ] タブ切り替え（研修医マスタ / 専門科ダッシュボード）
- [ ] 年度タブによる絞り込み
- [ ] テキスト検索（名前・ふりがな・大学・専門科・本籍）
- [ ] 学年・性別・専門科フィルタ
- [ ] 並び替え: 学年別 / 五十音 / 専門科別サブグループ
- [ ] カード表示 / テーブル表示 切り替え
- [ ] テーブルのカラムクリックソート
- [ ] 詳細モーダル（カード・テーブル行クリック）
- [ ] KPIカード（5種）
- [ ] 横棒グラフ（専門科別人数）
- [ ] ドーナツグラフ（構成比）
- [ ] 折れ線グラフ（年度推移）
- [ ] 積み上げ棒グラフ（学年×専門科）
- [ ] 積み上げ横棒グラフ（男女比）
- [ ] ランキングテーブル
- [ ] ダッシュボードのフィルタ全グラフ連動
- [ ] レスポンシブ対応（スマホ〜PC）
- [ ] 「ファイルを変更」ボタン
