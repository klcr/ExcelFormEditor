import { createBox } from '@domain/box';
import { createLine } from '@domain/line';
import type { PaperDefinition } from '@domain/paper';
import { DEFAULT_MARGINS } from '@domain/paper';
import type { VariableDefinition } from '@domain/variable';
import { describe, expect, it } from 'vitest';
import { exportAsHtml } from './TemplateExporter';

const PAPER: PaperDefinition = {
  size: 'A4',
  orientation: 'portrait',
  margins: DEFAULT_MARGINS,
  scaling: { mode: 'scale', percent: 100 },
  printableArea: { width: 171.45, height: 246.38 },
  centering: { horizontal: false, vertical: false },
};

describe('exportAsHtml', () => {
  it('produces valid HTML with DOCTYPE and structure', () => {
    const html = exportAsHtml({
      boxes: [],
      lines: [],
      variables: [],
      paper: PAPER,
      templateId: 'test-form',
      templateVersion: '1.0.0',
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="ja">');
    expect(html).toContain('<section class="sheet"');
    expect(html).toContain('data-template-id="test-form"');
    expect(html).toContain('data-template-version="1.0.0"');
    expect(html).toContain('data-paper-size="A4"');
    expect(html).toContain('data-orientation="portrait"');
    expect(html).toContain('data-origin="printable-area"');
  });

  it('includes @page CSS with correct dimensions and margins', () => {
    const html = exportAsHtml({
      boxes: [],
      lines: [],
      variables: [],
      paper: PAPER,
      templateId: 'test',
      templateVersion: '1.0.0',
    });

    expect(html).toContain('size: 210mm 297mm;');
    expect(html).toContain('.sheet {');
    expect(html).toContain('width: 171.45mm;');
    expect(html).toContain('height: 246.38mm;');
  });

  it('renders boxes with correct data attributes and CSS', () => {
    const box = createBox({
      id: 'box-1',
      rect: { position: { x: 10, y: 20 }, size: { width: 50, height: 8 } },
      content: '請求書',
    });

    const html = exportAsHtml({
      boxes: [box],
      lines: [],
      variables: [],
      paper: PAPER,
      templateId: 'test',
      templateVersion: '1.0.0',
    });

    expect(html).toContain('data-box-id="box-1"');
    expect(html).toContain('data-role="label"');
    expect(html).toContain('data-x-mm="10"');
    expect(html).toContain('data-y-mm="20"');
    expect(html).toContain('data-w-mm="50"');
    expect(html).toContain('data-h-mm="8"');
    expect(html).toContain('請求書');
  });

  it('renders field boxes with variable template syntax', () => {
    const box = createBox({
      id: 'box-1',
      rect: { position: { x: 0, y: 0 }, size: { width: 10, height: 5 } },
    });
    const variable: VariableDefinition = {
      id: 'v1',
      name: 'customerName',
      type: 'string',
      boxId: 'box-1',
    };

    const html = exportAsHtml({
      boxes: [box],
      lines: [],
      variables: [variable],
      paper: PAPER,
      templateId: 'test',
      templateVersion: '1.0.0',
    });

    expect(html).toContain('data-role="field"');
    expect(html).toContain('data-variable="customerName"');
    expect(html).toContain('data-type="string"');
    expect(html).toContain('{{customerName}}');
  });

  it('renders lines with correct data attributes', () => {
    const line = createLine({
      id: 'line-1',
      start: { x: 0, y: 10 },
      end: { x: 100, y: 10 },
      style: 'thin',
      color: '000000',
    });

    const html = exportAsHtml({
      boxes: [],
      lines: [line],
      variables: [],
      paper: PAPER,
      templateId: 'test',
      templateVersion: '1.0.0',
    });

    expect(html).toContain('data-line-id="line-1"');
    expect(html).toContain('data-x1-mm="0"');
    expect(html).toContain('data-y1-mm="10"');
    expect(html).toContain('data-x2-mm="100"');
    expect(html).toContain('data-y2-mm="10"');
    expect(html).toContain('border-top:');
  });

  it('embeds JSON manifest in script tag', () => {
    const html = exportAsHtml({
      boxes: [],
      lines: [],
      variables: [],
      paper: PAPER,
      templateId: 'test-id',
      templateVersion: '2.0.0',
    });

    expect(html).toContain('<script type="application/json" id="template-manifest">');
    expect(html).toContain('"templateId": "test-id"');
    expect(html).toContain('"version": "2.0.0"');
  });

  it('escapes HTML special characters in content', () => {
    const box = createBox({
      id: 'box-1',
      rect: { position: { x: 0, y: 0 }, size: { width: 10, height: 5 } },
      content: '<script>alert("xss")</script>',
    });

    const html = exportAsHtml({
      boxes: [box],
      lines: [],
      variables: [],
      paper: PAPER,
      templateId: 'test',
      templateVersion: '1.0.0',
    });

    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders vertical lines with border-left', () => {
    const line = createLine({
      id: 'line-v',
      start: { x: 50, y: 0 },
      end: { x: 50, y: 100 },
      style: 'medium',
      color: 'FF0000',
    });

    const html = exportAsHtml({
      boxes: [],
      lines: [line],
      variables: [],
      paper: PAPER,
      templateId: 'test',
      templateVersion: '1.0.0',
    });

    expect(html).toContain('border-left:');
  });
});
