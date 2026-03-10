/** ヘッダー/フッターの3セクション（左・中央・右） */
export type HeaderFooterSection = {
  readonly left: string;
  readonly center: string;
  readonly right: string;
};

/** ヘッダー/フッター定義（パース済み） */
export type HeaderFooterDefinition = {
  readonly oddHeader?: HeaderFooterSection;
  readonly oddFooter?: HeaderFooterSection;
  readonly evenHeader?: HeaderFooterSection;
  readonly evenFooter?: HeaderFooterSection;
  readonly firstHeader?: HeaderFooterSection;
  readonly firstFooter?: HeaderFooterSection;
};
