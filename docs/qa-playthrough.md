# QA — 通しプレイ検証ログ（#4）＋ 実機タッチ チェックリスト（#3）

最終検証: 2026-06-15（Playwright / Chromium / viewport 480×920 / 効果音 OFF）

## #4 自動検証（PASS）

### ステージ3「配達が遅れた!?」（MODE1 例外フロー）
- ダミー「クーポンを発行する」をタップ → **手札に残る**（スロットに入らない）・`stage_retry` 発火
- **ADR 0001**: ダミーをタップしても最終 ★3（`mistakes:0`）。試行錯誤を罰しない を確認
- イベント5枚を正順配置 → 確定 → **STAGE CLEAR ★3**
- `stage_clear { stage:'ch1-s3', stars:3, mistakes:0, usedHint:false }`
- reality「例外フローこそドメイン知識の宝庫」表示

### ステージ4「誰がトリガー？ そして因果の連鎖」（MODE2 トリガー接続）
- 顧客→注文確定 / 決済ゲートウェイ→支払い記録 / ポリシー→配達員割当 を接続
- 確定 → **STAGE CLEAR ★3**
- **🔗 因果の連鎖** chain-box 表示（Event→Policy→Command）
- **章クリア帯**「🍕第1章 クリア！」（記法色でなく中立色＋章アイコン）
- 「つぎの章へ ▶」ボタン・`chapter_complete` 発火

### 横断
- 効果音 OFF のまま両ステージで ★3 到達（§6.5 受け入れ条件）
- ★は `.star-pop` 3要素でアニメ表示
- analytics props に PII なし（Cookieless 維持）

## #3 実機タッチ — 人手必須チェックリスト

物理デバイスでないと判定できない項目（自動エミュは近似に留まる）。iOS Safari / Android Chrome 実機で確認する。

- [ ] **TimelineMode ドラッグ並べ替え**: drag-start の scale(1.08)/rotate(-4deg)+影が指に追従、着地 overshoot が不快でない
- [ ] **TouchSensor delay:120ms の体感**: 速タップが drag に化けない／ゆっくり置く時に反応が鈍くない
- [ ] **touch-action:none のスクロール競合**: ボード上で縦スクロールしたいのにカードを掴む／逆に掴めない、が起きないか（長い ch1-s2/s3 で特に）
- [ ] **タップ的中精度**: trigger tray / 付箋の ⓘ ボタン（stopPropagation）が指で押し分けられる・隣接誤タップしない（44px 標的）
- [ ] **機種依存**: ノッチ/Dynamic Island/ホームバー下に「確定 ▶」が潜らない・iPhone SE(375px) で手札横スクロール破綻なし・landscape 崩れなし・ダブルタップズームが配置を阻害しない
- [ ] **音（実機）**: 初期OFF・トグル切替・OFFのまま★3・完走ファンファーレ2秒以内・ONにした瞬間のタップで unlock し鳴る・gain上限で耳障りでない
- [ ] **juice 質感**: 正解 緑パルス450ms が1回だけ・誤配置シェイク+赤枠+Toast が過剰でない・MODE2 wireConnect・全クリア celebrateFlash 1回
- [ ] **色覚シミュレーション**: event/command/policy/external が ✓/✗・アイコン・ラベルで色なしでも判別可
- [ ] **スクリーンリーダー（VoiceOver/TalkBack）**: tray aria-pressed / slot aria-label 変化 / gate 通す・弾く / result stars aria-label / 音トグル aria-pressed / KeyboardSensor 並べ替え
- [ ] **prefers-reduced-motion 実機 ON**: アニメが体感で消える（iOS Reduce Motion はエミュと挙動差が出うる）。音は別軸で鳴ってよい
- [ ] **本番送信**: PROD ビルドに `VITE_GOATCOUNTER_CODE` を入れ、GoatCounter ダッシュボードに stage/clear・game/complete・share/clicked がヒット・term 等 PII がパスに出ていないことを目視

## 自動化の限界（記録）

- E2E は CI（deploy.yml）に組み込まない方針（ブラウザ取得失敗で本番デプロイを止めないため）。検証は手元 Playwright で実施しこのログに残す。
- TriggerMode の select→connect は React state 更新を挟むため、自動操作では「tray を実クリック → slot を click イベント」の2手で行う（同一 tick の連続操作は `selected` 反映前に connect が走り失敗する）。
