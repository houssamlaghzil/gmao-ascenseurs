import { describe, expect, it } from 'vitest';
import { getDateDemo } from './store';

describe('getDateDemo', () => {
  it("renvoie une date proche de l'heure réelle courante", () => {
    const avant = Date.now();
    const date = getDateDemo();
    const apres = Date.now();

    expect(date.getTime()).toBeGreaterThanOrEqual(avant);
    expect(date.getTime()).toBeLessThanOrEqual(apres);
  });
});
