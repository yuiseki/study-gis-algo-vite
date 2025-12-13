# study-gis-algo-vite

Turf.js と MapLibre（react-map-gl）を使って、GISで頻出するアルゴリズム／考え方を **手を動かしながら** 学ぶための実験用リポジトリです。  
各「Lab」は地図上でクリックやスライダー操作を行い、GeoJSONとして結果を描画して確認できる構成になっています。

---

## 目的

- GISスペシャリストが前提として知っている “基本アルゴリズム／基本概念” を、実装と可視化で体得する
- Turf.js の各関数が「何を計算しているのか」「どんな近似や前提があるのか」を、自分の言葉で説明できるようにする

---

## 技術スタック

- Vite + React + TypeScript
- react-map-gl（MapLibre バインディング）
  - https://github.com/visgl/react-map-gl
- maplibre-gl
  - https://github.com/visgl/react-map-gl
- @turf/turf
  - https://github.com/Turfjs/turf

---

## セットアップ

Node.js が入っている前提です。

```bash
npm ci
npm run dev
```

- ブラウザで表示されたローカルURLを開いてください（Viteのデフォルト出力に従います）
- もし地図が表示されない場合は mapStyle（スタイルURL）を差し替えてください

## 使い方（基本）

1. 画面上部の Lab セレクターで実験を選ぶ
2. 地図上をクリック（またはパネルの入力を操作）
3. 右側パネルで数値・説明を確認
4. 地図上の描画（LineString / Polygon など）で直感的に差を観察

## ディレクトリ構成（概要）

- `src/labs/`
各Labの実装（計算 + UIパネル + メタ情報）

- `src/map/`
Map表示、クリックなどのインタラクション、GeoJSON描画

- `src/ui/`
Labセレクタやパネル、入力コンポーネント

- `src/shared/`
GeoJSONユーティリティ、単位系など共通処理

- `src/consts/`
Lab一覧など定数

## 新しいLabを追加する手順（ざっくり）

1. `src/labs/<new-lab>/index.tsx` を作る
2. Labメタ（タイトル・説明・初期ViewState）を定義する
3. compute(state) で「入力 → GeoJSON（描画結果）」を返す
4. Panel(...) で「入力UI（スライダー等）＋結果表示」を用意する
5. labList に追加してセレクタに出す

「まず結果をGeoJSONで返す」設計にしておくと、可視化と検証が速く回せます。

## 注意点（このリポジトリの方針）

- 表示は地図レンダリング都合の座標系（投影）に依存します
- Turf.jsの多くは “球面近似” を前提とするため、楕円体上の厳密測地線とは一致しない場合があります
- steps や近似の置き方で、面積や形が（見た目以上に）変わることがあります
→ 「どの前提・どのモデルで正しいと言っているか」をメモするのが目的です

