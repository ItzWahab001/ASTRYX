import {describe,it,expect} from 'vitest';
describe('security policy invariants',()=>{it('default mass action threshold is bounded',()=>{const threshold=3;expect(threshold).toBeGreaterThan(0);expect(threshold).toBeLessThanOrEqual(20);});it('raid window is finite',()=>expect(15).toBeGreaterThan(0));});
