import type { VariableDefinition, VariableType } from './VariableTypes';

/** VariableType から TypeScript の型名へのマッピング */
const TYPE_MAP: Record<VariableType, string> = {
  string: 'string',
  number: 'number',
  date: 'Date',
  boolean: 'boolean',
};

/**
 * 変数定義リストから TypeScript インターフェースを生成する
 * - プロパティは名前のアルファベット順にソートされる
 */
export function generateTypeScriptInterface(
  interfaceName: string,
  variables: readonly VariableDefinition[],
): string {
  const sorted = [...variables].sort((a, b) => a.name.localeCompare(b.name));

  const properties = sorted.map((v) => `  ${v.name}: ${TYPE_MAP[v.type]};`).join('\n');

  if (properties.length === 0) {
    return `interface ${interfaceName} {}\n`;
  }

  return `interface ${interfaceName} {\n${properties}\n}\n`;
}
