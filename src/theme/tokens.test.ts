import { describe, it, expect } from 'vitest';
import { tokens, threeColors, statusColors } from './tokens';

describe('tokens', () => {
  it('should export all required color tokens', () => {
    expect(tokens.colors.bgPrimary).toBe('#0a0a0f');
    expect(tokens.colors.accentCyan).toBe('#00f5ff');
    expect(tokens.colors.accentMagenta).toBe('#ff006e');
    expect(tokens.colors.accentViolet).toBe('#8b5cf6');
    expect(tokens.colors.accentEmerald).toBe('#10b981');
  });

  it('should export Three.js hex colors', () => {
    expect(threeColors.accentCyan).toBe(0x00f5ff);
    expect(threeColors.bgPrimary).toBe(0x0a0a0f);
    expect(typeof threeColors.accentCyan).toBe('number');
  });

  it('should map all agent statuses to colors', () => {
    expect(statusColors.idle).toBeDefined();
    expect(statusColors.processing).toBeDefined();
    expect(statusColors.active).toBeDefined();
    expect(statusColors.error).toBeDefined();
  });

  it('should export font definitions', () => {
    expect(tokens.fonts.display).toContain('Orbitron');
    expect(tokens.fonts.body).toContain('Inter');
    expect(tokens.fonts.mono).toContain('JetBrains');
  });
});
