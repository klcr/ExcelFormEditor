import { describe, expect, it } from 'vitest';
import { parsePrintAreas, parseWorkbook } from './WorkbookParser';

const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="帳票サンプル" sheetId="1" r:id="rId1"/>
    <sheet name="fitToPage" sheetId="2" r:id="rId2"/>
  </sheets>
  <definedNames>
    <definedName name="_xlnm.Print_Area" localSheetId="0">'帳票サンプル'!$A$1:$H$20</definedName>
  </definedNames>
</workbook>`;

const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
</Relationships>`;

describe('parseWorkbook', () => {
  it('シート一覧を抽出する', () => {
    const sheets = parseWorkbook(workbookXml, relsXml);
    expect(sheets).toHaveLength(2);
    expect(sheets[0]).toEqual({
      name: '帳票サンプル',
      sheetId: 1,
      rId: 'rId1',
      path: 'xl/worksheets/sheet1.xml',
    });
    expect(sheets[1]).toEqual({
      name: 'fitToPage',
      sheetId: 2,
      rId: 'rId2',
      path: 'xl/worksheets/sheet2.xml',
    });
  });

  it('シートが1つのみでも配列として処理する', () => {
    const singleXml = `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
    </workbook>`;
    const singleRels = `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Target="worksheets/sheet1.xml"/>
    </Relationships>`;
    const sheets = parseWorkbook(singleXml, singleRels);
    expect(sheets).toHaveLength(1);
    expect(sheets[0]?.name).toBe('Sheet1');
  });
});

describe('parsePrintAreas', () => {
  it('印刷エリアを抽出する', () => {
    const areas = parsePrintAreas(workbookXml);
    expect(areas.get('帳票サンプル')).toBe('A1:H20');
  });

  it('definedNames が無い場合は空マップ', () => {
    const xml = `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <sheets><sheet name="S1" sheetId="1" r:id="rId1"/></sheets>
    </workbook>`;
    expect(parsePrintAreas(xml).size).toBe(0);
  });
});
