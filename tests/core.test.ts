import {describe,it,expect} from 'vitest';import {levelForXP} from '../apps/bot/src/services/leveling.js';
describe('level progression',()=>{it('starts at level 1',()=>expect(levelForXP(0)).toBe(1));it('increases monotonically',()=>expect(levelForXP(1000)).toBeGreaterThan(levelForXP(100)));});
