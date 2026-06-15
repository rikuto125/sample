# ADR 0001: ダミー付箋（distractor）のタップは★評価で減点しない

- Status: Accepted
- Date: 2026-06-15

## Context

MODE1 タイムラインには「イベントでないカード（distractor）」が混ざる。これを弾けることが記法理解の証（CONTEXT.md「ダミーカード」）。

実装上、`TimelineMode.placeFromHand` はダミーをタップした瞬間に `mistakes++`（＋`stage_retry` 計測）していた。`scoreStars` は `mistakes>=1` で★3を落とすため、**ダミーを一度でも触ると最終★が最大2**になっていた。

これは design-system.md §3.1「星は情報」「★3=ノーミス」「**隠れた減点を作らない**」、および DESIGN.md §3 の優先順位「②学習の誠実さ ＞ ③juice」に抵触する。ダミーを試しに触るのは記法を学ぶ過程の試行錯誤であり、それを目に見えない形で罰するのは誠実さを欠く。

後戻りコストが高い（採点契約の意味づけ・テストの凍結に関わる）ため ADR に残す。

## Decision

**ダミー付箋のタップは `mistakes` に数えない。** 弾いたことは「弾きトースト」で種別を教える学習フィードバックとしてのみ扱い、★評価には影響させない。

- distractor タップ → `onMistake(reason)` でトースト表示（記法へ誘導）。`setMistakes` は呼ばない。
- 一方、**誤接続・誤順序・不変条件ゲートの誤判断**（＝明らかな誤り）は従来どおり `mistakes` に数える。これらは「正しく置けるか」を問う本筋で、試行錯誤ではなく判断ミスだから。

## Consequences

- ★3＝「本筋の操作をノーミス」で取れる。ダミーを触っても、最終的に正しく置ければ★3が可能（誠実さ②を満たす）。
- distractor 弾きの計測は `stage_retry` を引き続き発火してよい（学習行動の観測）が、`mistakes`（採点入力）とは切り離す。
- `scoreStars`（engine 純粋関数）は不変。変更は UI 側（各モードの `mistakes` 加算条件）のみ。
- 関連: design-system.md §3.1 / §4.3、DESIGN.md §3。
