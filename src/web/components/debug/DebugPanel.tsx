import type {
  ExcelParseResult,
  FullParseResult,
  SheetParseResult,
} from '@web/services/parseExcelFile';
import { paperSizeLabel } from '@web/services/parseExcelFile';
import { useState } from 'react';
import styles from './DebugPanel.module.css';

type DebugPanelProps = {
  readonly parseState:
    | { readonly status: 'idle' }
    | { readonly status: 'parsing' }
    | { readonly status: 'success'; readonly result: FullParseResult }
    | { readonly status: 'error'; readonly error: string };
};

export function DebugPanel({ parseState }: DebugPanelProps) {
  if (parseState.status === 'idle') {
    return (
      <div className={styles.panel}>
        <p className={styles.placeholder}>
          .xlsx ファイルをアップロードするとパース結果が表示されます
        </p>
      </div>
    );
  }

  if (parseState.status === 'parsing') {
    return (
      <div className={styles.panel}>
        <p className={styles.loading}>パース中...</p>
      </div>
    );
  }

  if (parseState.status === 'error') {
    return (
      <div className={styles.panel}>
        <p className={styles.error}>エラー: {parseState.error}</p>
      </div>
    );
  }

  return <ParseResultView result={parseState.result.debug} />;
}

function ParseResultView({ result }: { readonly result: ExcelParseResult }) {
  const [activeSheet, setActiveSheet] = useState(0);
  const sheet = result.sheets[activeSheet];

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>パース結果: {result.fileName}</h3>
      <p className={styles.meta}>シート数: {result.sheetCount}</p>

      {result.sheets.length > 1 && (
        <div className={styles.tabs}>
          {result.sheets.map((s, i) => (
            <button
              key={s.name}
              type="button"
              className={`${styles.tab} ${i === activeSheet ? styles.tabActive : ''}`}
              onClick={() => setActiveSheet(i)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {sheet && <SheetDetail sheet={sheet} />}
    </div>
  );
}

function SheetDetail({ sheet }: { readonly sheet: SheetParseResult }) {
  return (
    <div className={styles.sections}>
      <Section title="ページ設定">
        <dl className={styles.dl}>
          <dt>用紙サイズ</dt>
          <dd>{paperSizeLabel(sheet.pageSetup.paperSize)}</dd>
          <dt>方向</dt>
          <dd>{sheet.pageSetup.orientation ?? '未設定'}</dd>
          <dt>倍率</dt>
          <dd>
            {sheet.pageSetup.fitToPage
              ? `フィット (幅:${sheet.pageSetup.fitToWidth} 高:${sheet.pageSetup.fitToHeight})`
              : `${sheet.pageSetup.scale ?? 100}%`}
          </dd>
          <dt>印刷範囲</dt>
          <dd>{sheet.pageSetup.printArea ?? '未設定'}</dd>
          <dt>水平中央揃え</dt>
          <dd>{sheet.pageSetup.horizontalCentered ? 'はい' : 'いいえ'}</dd>
          <dt>垂直中央揃え</dt>
          <dd>{sheet.pageSetup.verticalCentered ? 'はい' : 'いいえ'}</dd>
        </dl>
      </Section>

      {sheet.pageSetup.headerFooter && (
        <Section title="ヘッダー/フッター">
          <dl className={styles.dl}>
            {sheet.pageSetup.headerFooter.oddHeader && (
              <>
                <dt>ヘッダー (奇数ページ)</dt>
                <dd className={styles.cellValue}>{sheet.pageSetup.headerFooter.oddHeader}</dd>
              </>
            )}
            {sheet.pageSetup.headerFooter.oddFooter && (
              <>
                <dt>フッター (奇数ページ)</dt>
                <dd className={styles.cellValue}>{sheet.pageSetup.headerFooter.oddFooter}</dd>
              </>
            )}
            {sheet.pageSetup.headerFooter.evenHeader && (
              <>
                <dt>ヘッダー (偶数ページ)</dt>
                <dd className={styles.cellValue}>{sheet.pageSetup.headerFooter.evenHeader}</dd>
              </>
            )}
            {sheet.pageSetup.headerFooter.evenFooter && (
              <>
                <dt>フッター (偶数ページ)</dt>
                <dd className={styles.cellValue}>{sheet.pageSetup.headerFooter.evenFooter}</dd>
              </>
            )}
            {sheet.pageSetup.headerFooter.firstHeader && (
              <>
                <dt>ヘッダー (先頭ページ)</dt>
                <dd className={styles.cellValue}>{sheet.pageSetup.headerFooter.firstHeader}</dd>
              </>
            )}
            {sheet.pageSetup.headerFooter.firstFooter && (
              <>
                <dt>フッター (先頭ページ)</dt>
                <dd className={styles.cellValue}>{sheet.pageSetup.headerFooter.firstFooter}</dd>
              </>
            )}
          </dl>
        </Section>
      )}

      <Section title="余白 (インチ)">
        {sheet.margins ? (
          <dl className={styles.dl}>
            <dt>上 / 下</dt>
            <dd>
              {sheet.margins.top.toFixed(2)} / {sheet.margins.bottom.toFixed(2)}
            </dd>
            <dt>左 / 右</dt>
            <dd>
              {sheet.margins.left.toFixed(2)} / {sheet.margins.right.toFixed(2)}
            </dd>
            <dt>ヘッダー / フッター</dt>
            <dd>
              {sheet.margins.header.toFixed(2)} / {sheet.margins.footer.toFixed(2)}
            </dd>
          </dl>
        ) : (
          <p className={styles.noData}>未設定（デフォルト値使用）</p>
        )}
      </Section>

      <Section title={`結合セル (${sheet.merges.length}件)`}>
        {sheet.merges.length > 0 ? (
          <ul className={styles.list}>
            {sheet.merges.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.noData}>なし</p>
        )}
      </Section>

      <Section title={`列幅 (${sheet.columns.length}列)`}>
        {sheet.columns.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>列</th>
                <th>幅(文字数)</th>
              </tr>
            </thead>
            <tbody>
              {sheet.columns.map((c) => (
                <tr key={c.col}>
                  <td>{c.col}</td>
                  <td>{c.width?.toFixed(2) ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.noData}>なし</p>
        )}
      </Section>

      <Section title={`行高 (${sheet.rows.length}行)`}>
        {sheet.rows.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>行</th>
                <th>高さ(pt)</th>
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((r) => (
                <tr key={r.row}>
                  <td>{r.row}</td>
                  <td>{r.height.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.noData}>なし</p>
        )}
      </Section>

      <Section title={`セル (${sheet.cellCount}件、先頭${Math.min(sheet.cellCount, 20)}件)`}>
        {sheet.sampleCells.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>セル</th>
                <th>値</th>
                <th>型</th>
                <th>結合</th>
                <th>罫線</th>
              </tr>
            </thead>
            <tbody>
              {sheet.sampleCells.map((c) => (
                <tr key={c.address}>
                  <td>{c.address}</td>
                  <td className={styles.cellValue}>{c.value || '-'}</td>
                  <td>{c.type}</td>
                  <td>{c.isMerged ? 'Yes' : '-'}</td>
                  <td>{c.hasBorder ? 'Yes' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.noData}>なし</p>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <details className={styles.section} open>
      <summary className={styles.sectionTitle}>{title}</summary>
      <div className={styles.sectionContent}>{children}</div>
    </details>
  );
}
