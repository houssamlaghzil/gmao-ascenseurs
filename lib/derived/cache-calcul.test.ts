// lib/derived/cache-calcul.test.ts
import { describe, expect, it, vi } from 'vitest';
import { memoiserSurVersion, memoiserSurVersionEtMinute } from './cache-calcul';

describe('memoiserSurVersion', () => {
  it('ne recalcule pas tant que la version ne change pas', () => {
    let version = 1;
    const calcul = vi.fn(() => Math.random());
    const memoise = memoiserSurVersion(() => version, calcul);

    const premier = memoise();
    const second = memoise();

    expect(second).toBe(premier);
    expect(calcul).toHaveBeenCalledTimes(1);
  });

  it('recalcule quand la version change', () => {
    let version = 1;
    const calcul = vi.fn((n: number) => n * version);
    const memoise = memoiserSurVersion(() => version, calcul, (n) => String(n));

    const premier = memoise(2);
    version = 2;
    const second = memoise(2);

    expect(premier).toBe(2);
    expect(second).toBe(4);
    expect(calcul).toHaveBeenCalledTimes(2);
  });

  it('distingue deux jeux d\'arguments via cleArgs, sans se marcher dessus', () => {
    let version = 1;
    const calcul = vi.fn((limit: number) => `resultat-${limit}`);
    const memoise = memoiserSurVersion(() => version, calcul, (limit) => String(limit));

    expect(memoise(5)).toBe('resultat-5');
    expect(memoise(8)).toBe('resultat-8');
    expect(memoise(5)).toBe('resultat-5');
    expect(calcul).toHaveBeenCalledTimes(2);
  });

  it('sans cleArgs, tous les appels partagent la même entrée de cache', () => {
    let version = 1;
    const calcul = vi.fn(() => 'valeur');
    const memoise = memoiserSurVersion(() => version, calcul);

    memoise();
    memoise();

    expect(calcul).toHaveBeenCalledTimes(1);
  });
});

describe('memoiserSurVersionEtMinute', () => {
  it('ne recalcule pas dans la même minute et la même version', () => {
    const version = 1;
    const calcul = vi.fn(() => 'valeur');
    const memoise = memoiserSurVersionEtMinute(() => version, calcul);

    memoise();
    memoise();

    expect(calcul).toHaveBeenCalledTimes(1);
  });

  it('recalcule quand la version change, même dans la même minute', () => {
    let version = 1;
    const calcul = vi.fn(() => version);
    const memoise = memoiserSurVersionEtMinute(() => version, calcul);

    const premier = memoise();
    version = 2;
    const second = memoise();

    expect(premier).toBe(1);
    expect(second).toBe(2);
    expect(calcul).toHaveBeenCalledTimes(2);
  });

  it('recalcule quand la minute change, même à version inchangée', () => {
    const version = 1;
    let maintenant = 0;
    const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => maintenant);
    const calcul = vi.fn(() => 'valeur');
    const memoise = memoiserSurVersionEtMinute(() => version, calcul);

    memoise();
    maintenant = 61_000; // +61s : minute suivante
    memoise();

    expect(calcul).toHaveBeenCalledTimes(2);
    dateSpy.mockRestore();
  });
});
