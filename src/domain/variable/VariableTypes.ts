/** 変数の型 */
export type VariableType = 'string' | 'number' | 'date' | 'boolean';

/** 変数定義 */
export type VariableDefinition = {
  readonly id: string;
  readonly name: string;
  readonly type: VariableType;
  readonly boxId: string; // ボックス集約への相互参照
};

/** ボックスと変数のバインディング */
export type VariableBinding = {
  readonly boxId: string;
  readonly variableId: string;
};
