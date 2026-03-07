import type { BoxDefinition } from '@domain/box';
import type { PageDefinition } from '@domain/page';
import type { PaperDefinition } from '@domain/paper';
import { INCHES_TO_MM, PAPER_DIMENSIONS } from '@domain/paper';
import type { VariableDefinition } from '@domain/variable';
import { generateTypeScriptInterface } from '@domain/variable';
import type {
  FieldMapping,
  MultiPageTemplateManifest,
  PageManifestEntry,
  PaperInfo,
  TemplateManifest,
} from './ExportTypes';

type ManifestParams = {
  readonly boxes: readonly BoxDefinition[];
  readonly variables: readonly VariableDefinition[];
  readonly paper: PaperDefinition;
  readonly templateId: string;
  readonly templateVersion: string;
};

/** 用紙の物理寸法を orientation を考慮して計算する */
function computePaperDimensions(paper: PaperDefinition): { widthMm: number; heightMm: number } {
  const base = PAPER_DIMENSIONS[paper.size];
  if (paper.orientation === 'landscape') {
    return { widthMm: base.height, heightMm: base.width };
  }
  return { widthMm: base.width, heightMm: base.height };
}

/** 余白をインチから mm に変換する */
function computeMarginsMm(paper: PaperDefinition): PaperInfo['margins'] {
  return {
    top: paper.margins.top * INCHES_TO_MM,
    right: paper.margins.right * INCHES_TO_MM,
    bottom: paper.margins.bottom * INCHES_TO_MM,
    left: paper.margins.left * INCHES_TO_MM,
  };
}

/** テンプレートマニフェストを生成する */
export function generateManifest(params: ManifestParams): TemplateManifest {
  const { boxes, variables, paper, templateId, templateVersion } = params;
  const dims = computePaperDimensions(paper);
  const marginsMm = computeMarginsMm(paper);

  const fields: FieldMapping[] = variables.map((v) => {
    const box = boxes.find((b) => b.id === v.boxId);
    const region = box
      ? {
          x: box.rect.position.x,
          y: box.rect.position.y,
          width: box.rect.size.width,
          height: box.rect.size.height,
        }
      : { x: 0, y: 0, width: 0, height: 0 };

    return {
      variableId: v.id,
      variableName: v.name,
      variableType: v.type,
      boxId: v.boxId,
      region,
      absoluteRegion: {
        x: region.x + marginsMm.left,
        y: region.y + marginsMm.top,
        width: region.width,
        height: region.height,
      },
    };
  });

  const interfaceStr = generateTypeScriptInterface('TemplateData', variables);

  return {
    templateId,
    version: templateVersion,
    paper: {
      size: paper.size,
      orientation: paper.orientation,
      ...dims,
      margins: marginsMm,
    },
    fields,
    interface: interfaceStr,
  };
}

/** ページの PaperInfo を計算する */
function computePaperInfo(paper: PaperDefinition): PaperInfo {
  const dims = computePaperDimensions(paper);
  const marginsMm = computeMarginsMm(paper);
  return {
    size: paper.size,
    orientation: paper.orientation,
    ...dims,
    margins: marginsMm,
  };
}

/** ページのフィールドマッピングを計算する */
function computeFields(
  boxes: readonly BoxDefinition[],
  variables: readonly VariableDefinition[],
  marginsMm: PaperInfo['margins'],
): FieldMapping[] {
  return variables.map((v) => {
    const box = boxes.find((b) => b.id === v.boxId);
    const region = box
      ? {
          x: box.rect.position.x,
          y: box.rect.position.y,
          width: box.rect.size.width,
          height: box.rect.size.height,
        }
      : { x: 0, y: 0, width: 0, height: 0 };

    return {
      variableId: v.id,
      variableName: v.name,
      variableType: v.type,
      boxId: v.boxId,
      region,
      absoluteRegion: {
        x: region.x + marginsMm.left,
        y: region.y + marginsMm.top,
        width: region.width,
        height: region.height,
      },
    };
  });
}

type MultiPageManifestParams = {
  readonly pages: readonly PageDefinition[];
  readonly pageVariables: ReadonlyMap<number, readonly VariableDefinition[]>;
  readonly templateId: string;
  readonly templateVersion: string;
};

/** マルチページテンプレートマニフェストを生成する */
export function generateMultiPageManifest(
  params: MultiPageManifestParams,
): MultiPageTemplateManifest {
  const { pages, pageVariables, templateId, templateVersion } = params;

  const allVariables: VariableDefinition[] = [];
  const pageEntries: PageManifestEntry[] = pages.map((page) => {
    const paperInfo = computePaperInfo(page.paper);
    const vars = pageVariables.get(page.pageIndex) ?? [];
    allVariables.push(...vars);
    const fields = computeFields(page.boxes, vars, paperInfo.margins);

    return {
      pageIndex: page.pageIndex,
      sheetName: page.sheetName,
      paper: paperInfo,
      fields,
    };
  });

  const interfaceStr = generateTypeScriptInterface('TemplateData', allVariables);

  return {
    templateId,
    version: templateVersion,
    pages: pageEntries,
    interface: interfaceStr,
  };
}
