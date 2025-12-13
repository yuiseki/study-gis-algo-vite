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
- maplibre-gl
- @turf/turf

---

## セットアップ

Node.js が入っている前提です。

```bash
npm ci
npm run dev
```
