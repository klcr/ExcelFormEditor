import { createBox } from '@domain/box';
import type { PaperDefinition } from '@domain/paper';
import { DEFAULT_MARGINS, INCHES_TO_MM } from '@domain/paper';
import type { VariableDefinition } from '@domain/variable';
import { describe, expect, it } from 'vitest';
import { generateManifest } from './ManifestGenerator';

const PAPER_A4_PORTRAIT: PaperDefinition = {
  size: 'A4',
  orientation: 'portrait',
  margins: DEFAULT_MARGINS,
  scaling: { mode: 'scale', percent: 100 },
  printableArea: { width: 171.45, height: 246.38 },
  centering: { horizontal: false, vertical: false },
};

describe('generateManifest', () => {
  it('generates manifest with correct paper info for portrait A4', () => {
    const manifest = generateManifest({
      boxes: [],
      variables: [],
      paper: PAPER_A4_PORTRAIT,
      templateId: 'test-template',
      templateVersion: '1.0.0',
    });

    expect(manifest.templateId).toBe('test-template');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.paper.size).toBe('A4');
    expect(manifest.paper.orientation).toBe('portrait');
    expect(manifest.paper.widthMm).toBe(210);
    expect(manifest.paper.heightMm).toBe(297);
  });

  it('swaps dimensions for landscape orientation', () => {
    const manifest = generateManifest({
      boxes: [],
      variables: [],
      paper: { ...PAPER_A4_PORTRAIT, orientation: 'landscape' },
      templateId: 'test',
      templateVersion: '1.0.0',
    });

    expect(manifest.paper.widthMm).toBe(297);
    expect(manifest.paper.heightMm).toBe(210);
  });

  it('converts margins from inches to mm', () => {
    const manifest = generateManifest({
      boxes: [],
      variables: [],
      paper: PAPER_A4_PORTRAIT,
      templateId: 'test',
      templateVersion: '1.0.0',
    });

    expect(manifest.paper.margins.top).toBeCloseTo(DEFAULT_MARGINS.top * INCHES_TO_MM, 1);
    expect(manifest.paper.margins.left).toBeCloseTo(DEFAULT_MARGINS.left * INCHES_TO_MM, 1);
  });

  it('creates field mappings with region and absoluteRegion', () => {
    const box = createBox({
      id: 'box-1',
      rect: { position: { x: 10, y: 20 }, size: { width: 50, height: 8 } },
    });
    const variable: VariableDefinition = {
      id: 'v1',
      name: 'customerName',
      type: 'string',
      boxId: 'box-1',
    };

    const manifest = generateManifest({
      boxes: [box],
      variables: [variable],
      paper: PAPER_A4_PORTRAIT,
      templateId: 'test',
      templateVersion: '1.0.0',
    });

    expect(manifest.fields).toHaveLength(1);
    const field = manifest.fields[0] ?? {
      variableName: '',
      variableType: 'string' as const,
      boxId: '',
      region: { x: 0, y: 0, width: 0, height: 0 },
      absoluteRegion: { x: 0, y: 0, width: 0, height: 0 },
    };
    expect(field.variableName).toBe('customerName');
    expect(field.variableType).toBe('string');
    expect(field.boxId).toBe('box-1');
    expect(field.region).toEqual({ x: 10, y: 20, width: 50, height: 8 });
    expect(field.absoluteRegion.x).toBeCloseTo(10 + DEFAULT_MARGINS.left * INCHES_TO_MM, 1);
    expect(field.absoluteRegion.y).toBeCloseTo(20 + DEFAULT_MARGINS.top * INCHES_TO_MM, 1);
    expect(field.absoluteRegion.width).toBe(50);
    expect(field.absoluteRegion.height).toBe(8);
  });

  it('generates TypeScript interface in manifest', () => {
    const variable: VariableDefinition = {
      id: 'v1',
      name: 'amount',
      type: 'number',
      boxId: 'box-1',
    };

    const manifest = generateManifest({
      boxes: [
        createBox({
          id: 'box-1',
          rect: { position: { x: 0, y: 0 }, size: { width: 10, height: 5 } },
        }),
      ],
      variables: [variable],
      paper: PAPER_A4_PORTRAIT,
      templateId: 'test',
      templateVersion: '1.0.0',
    });

    expect(manifest.interface).toContain('interface TemplateData');
    expect(manifest.interface).toContain('amount: number;');
  });

  it('handles variable with missing box gracefully', () => {
    const variable: VariableDefinition = {
      id: 'v1',
      name: 'orphan',
      type: 'string',
      boxId: 'nonexistent',
    };

    const manifest = generateManifest({
      boxes: [],
      variables: [variable],
      paper: PAPER_A4_PORTRAIT,
      templateId: 'test',
      templateVersion: '1.0.0',
    });

    expect(manifest.fields).toHaveLength(1);
    expect(manifest.fields[0]?.region).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});
