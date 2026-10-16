import { describe, expect, it } from 'vitest';
import { getTpSlTrigger } from '@/lib/position-tp-sl';

describe('getTpSlTrigger', () => {
  describe('BUY positions', () => {
    const position = { type: 'BUY' as const, takeProfit: 110, stopLoss: 90 };

    it('closes at the take profit level when price overshoots it', () => {
      expect(getTpSlTrigger(position, 112.5)).toEqual({
        kind: 'TAKE_PROFIT',
        closePrice: 110,
        reason: 'Take profit reached'
      });
    });

    it('closes at the stop loss level when price gaps below it', () => {
      expect(getTpSlTrigger(position, 85)).toEqual({
        kind: 'STOP_LOSS',
        closePrice: 90,
        reason: 'Stop loss triggered'
      });
    });

    it('does not trigger between the levels', () => {
      expect(getTpSlTrigger(position, 100)).toBeNull();
    });
  });

  describe('SELL positions', () => {
    const position = { type: 'SELL' as const, takeProfit: 90, stopLoss: 110 };

    it('closes at the take profit level when price drops past it', () => {
      expect(getTpSlTrigger(position, 87)).toMatchObject({
        kind: 'TAKE_PROFIT',
        closePrice: 90
      });
    });

    it('closes at the stop loss level when price rises past it', () => {
      expect(getTpSlTrigger(position, 115)).toMatchObject({
        kind: 'STOP_LOSS',
        closePrice: 110
      });
    });

    it('does not trigger between the levels', () => {
      expect(getTpSlTrigger(position, 100)).toBeNull();
    });
  });

  it('ignores missing TP/SL levels', () => {
    expect(
      getTpSlTrigger({ type: 'BUY', takeProfit: null, stopLoss: null }, 1000)
    ).toBeNull();
  });
});
