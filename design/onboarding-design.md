# StormQuest オンボーディング設計

モック: [`onboarding-mock.html`](./onboarding-mock.html)（mobile 390px・自己完結・触って確認可）

## 由来

ベンチマーク調査 → UI/UX デザイナー5人パネル（並列）→ 統合 → 3審査官の敵対的検証、の多エージェント設計ワークフローで作成。
5人の独立設計が**同じ4ビート構造**に収束した（強い設計シグナル）。検証 3名が全員 `fix-then-ship` を返し、その修正をすべて反映済み（下記「検証で直したこと」）。

不変原則の順序を背骨にした: **① ドメインの正確さ ＞ ② 学習の誠実さ ＞ ③ ゲームの juice ＞ ④ コンテンツ量**（`DESIGN.md`）。

## コンセプト

「**置く → あとからラベルと“なぜ”がめくれる**」を3回くり返し、最後にその3枚が1本の線でつながって因果連鎖が生まれる、ピザ盤1シーン固定・全4画面のオンボ。
報酬は得点/XP/星でなく「なぜ正解か」＝**コンピテンス・フィードバック**（過正当化を避ける。`DESIGN.md` 非射幸性）。

## フロー（4画面・scaffolded discovery）

| 画面 | 目的 | 操作 | juice |
|---|---|---|---|
| **S0 価値とトーン**（読むだけ3秒） | 「DDD=難しい→挫折」の警戒を温かさ＋スキル約束で解く（Headspace型 preview-of-product） | 主CTA「付箋を置いてみる」1タップで S1 へ | 付箋チップ（カード色の小片）で製品を予告、CTA 沈み込み、ドット先頭うっすら金（endowed-progress） |
| **S1 イベントを置く**（最速の成功10秒） | 橙＝過去形の事実＝ドメインイベントを“置いてから”自分で気づく | tap-source→tap-target（精密ドラッグを正解にしない） | 吸着＋置いた真下にラベル開示 |
| **S2 コマンドを置く** | 水色＝現在形の意図＝コマンドを、S1 との**時制の対比**で弁別（色だけに頼らせない）。「起こすのは人とは限らない（ポリシー）」を一言伏線 | tap-source→tap-target | 吸着のみ（cheer 温存）＋対比の開示 |
| **S3 因果をつなぐ**（山場） | 紫ポリシーを中央に置き、**Event → Policy → Command → Event** が1本につながりループが閉じる。「事実が起きたら次の指示を自動で呼ぶ」を体感 | 紫ポリシー1枚を中央スロットへ tap-place | 緑グロー＋`?→✓`＋ループ閉じ＋ボルト cheer（**2度目の本物の達成**）。締めに本編CTA＋再開導線 |

ドット進行4つ・スキップ可（一方通行にせずメニューから再開可）・CTA は全画面下40%の同位置固定（親指が1点を学習）・縦スクロール0。

## ドメインの正確さ（捏造ゼロ）

因果連鎖は `CONTEXT.md` L58 の正典定義 **Event → Policy → Command → Event**（4ノード・ループが閉じる）に厳密一致。
実ステージデータをそのまま使用（合成だが捏造ではない。出典を正確に記す）:

- Event `ピザが焼き上がった`（`ch1-s3` の `s3-baked`）
- Policy `焼き上がったら配達を手配する`（`ch1-s4` の `s4-t-policyBake` / en: When baked, arrange delivery）
- Command `配達員を割り当てる`（`ch1-s4` の `s4-c-assign`）
- 閉じる Event `配達員が割り当てられた`（実在 `s2-assigned` / `s3-assigned`）

色は `CARD_META` / `tokens.css` に厳密一致（event `#ffb74d` / command `#64b5f6` / policy `#ce93d8`）。全カード三重冗長（色＋lucideアイコン＋ラベル）。時制は event=過去形 / command=現在形で全画面厳密。

## 意匠（tokens.css に厳密一致）

ウォーム・クラフト基調（クラフト紙＋付箋）／ティール primary（`--accent #167a7a`）／真鍮ゴールドの報酬（星・達成専用）／3Dチャンキーピル（押下で沈む）。
**オンボ（S0含む）にマスコットは使わない**（ユーザー判断）。S0 の温かさは付箋チップ（カード色の小片）＋クラフト地で出し、cheer の代わりに配置の吸着・緑グローで juice を担保する。
**写真調マスコット（円メダリオン）の配置**: ブランドの顔＝アプリアイコン/PWA/OGP（`public/brand/`）と、最も希少な達成＝**完走画面のみ**（`MascotImage`、`CompleteScreen` で SVG→写真に差し替え）。盤面の記法アイコン・オンボ・通常リザルトには使わない（三重冗長と希少性を保つ）。表情: wink=祝福、idea=ひらめき（予備）。
**S0 はクラフト紙の明るい地**（`--paper`・本編とトーンを揃える）。ダーク板はやめ、上に淡いティールの放射光を一筋だけ敷く。文字はエスプレッソのインク（kicker=ティール / 補助文=ink-muted）。コントラストは AA 実測済み（title 13.3:1 / kicker 4.6:1 / sub 5.2:1）。
モーションは既存資産のみ（pulse / 緑グロー / 吸着 / 3Dピル）。新規射幸機構ゼロ。confetti はオンボで使わず本編完走に温存。

## 検証で直したこと（3審査官 fix-then-ship）

1. **【ドメイン正確さ・最優先】** 因果連鎖を3ノード→**4ノード（…→Event）**に是正。ループが閉じる正典定義に合わせ、S3 末尾で「指示が新しい事実『配達員が割り当てられた』を生み、また次のルールを呼ぶ」を明示。
2. **【モバイル】** S3 の3枚横並びは390pxで破綻 → **縦積み**（事実/ルール/指示/新事実）に変更。全画面 `scrollWidth === clientWidth === 390`（横はみ出しゼロを実機相当で確認）。
3. **【a11y】** 因果成立の定常状態を**緑実線 border**（animation でなく）にし、reduced-motion でアニメ無効でも緑が残る（色覚×動き無効の二重不利ユーザーを守る）。因果方向は色だけに頼らず `chain アイコン＋?→✓＋静的ラベル`で冗長化。
4. **【誠実さ】** haptic を「既存資産流用」表記から外し「**任意の progressive enhancement（新規・feature-detect 必須・視覚snap＋aria-live で等価）**」に正直に再分類。
5. **【a11y】** 点線下線の語・ⓘ を **44px ヒット領域**（inline-block＋padding）に。
6. **【a11y】** `role=status aria-live=polite` のアナウンサを新設し、配置・開示・連結を SR に等価通知。
7. **【誠実さ】** コピーの万能感を弱め competence-entry に（「読めるようになる」→「色と文法の**読み方**がつかめる」、S3「読めれば地図になる」→「本編で試していけば地図になっていく」）。

## 却下した案（理由付き）

6〜7画面の網羅版（モバイル<5の鉄則・離脱点が増える）／用語図鑑点灯の完了画面（集める演出の目的化＝過正当化に近い・本編に温存）／ストリーク・ハート・通知・見出しXP・星カウンタ（`DESIGN.md` 非射幸性）／価値訴求カルーセル（84%が1枚目で離脱）／精密ドラッグを正解動線にする案（片手390pxで事故）／distractor 混入（オンボは“必ず成功”を死守。誤配置からの学びは本編 Stage2 へ逃がす）。

## 実装ステータス

**実装済み**（`src/components/Onboarding.tsx` を4画面フローに置き換え）。
- `track('onboarding_step', {step})`（analytics.ts に EventName 追加）／`onboarding_complete {skipped, lastStep}` を計測。
- 既存 `Sticky` / `DefinitionSheet` / `Icon` / `GLOSSARY` を流用。CSS は `.ob-*` 名前空間（旧 `.onboard-*` は撤去）。`.sr-only` ユーティリティを app.css に追加。
- 因果連鎖は実データ一致（Event ピザが焼き上がった → Policy 焼き上がったら配達を手配する → Command 配達員を割り当てる → Event 配達員が割り当てられた）。
- 検証: tsc clean / 189 テスト緑（copy-consistency 含む）/ production build 成功 / 実機相当 390px で S0→S1→S2→S3→home の全遷移・定義シート・aria-live・計測をブラウザ確認。

## 実装メモ

- このHTML（`onboarding-mock.html`）は**図（派生物）**。正は React（`src/components/Onboarding.tsx`）。
- カード/スロット/ボタンは既存 class（`.sticky` / `.onboard-slot` / `.btn-primary` / トリガーモードの連結語彙）を流用し、新規 CSS を最小化。
- 状態は `useReducer`（既存 store の `screen='onboarding'`）。各画面遷移で `track('onboarding_step')`、スキップ/完了で `track('onboarding_complete',{skipped})` を計測（離脱点 S0/S1 の skip 率を観測してから画面を削れるよう各画面を独立構造に保つ）。
- haptic は `if (navigator.vibrate) navigator.vibrate(10)` を S1 初成功と S3 連結成立の2回だけ。非対応端末は視覚snap＋aria-live で等価。
