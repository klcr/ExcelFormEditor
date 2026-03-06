/**
 * SheetJS PoC: テスト用ワークブックを生成する。
 *
 * ExcelJS 版の createTestWorkbook() を再利用し、同一の .xlsx バッファを返す。
 * これにより、同じファイルを SheetJS で読み込んだ際の API 挙動を公平に比較できる。
 */
import { createTestWorkbook as createExcelJSWorkbook } from '../../exceljs/fixtures/createTestWorkbook';

/** テスト用ワークブックをバッファとして生成する（ExcelJS 版と同一バッファ） */
export async function createTestWorkbook(): Promise<Buffer> {
  return createExcelJSWorkbook();
}
