/**
 * Normaliza e ordena períodos no formato MM/AAAA
 * @param periods - Array de períodos como strings
 * @returns Array de períodos normalizados e ordenados em ordem decrescente
 */
export function normalizeAndSortPeriods(periods: string[]): string[] {
  return periods
    .map(p => {
      // Extrair mês e ano usando expressão regular
      const match = p.match(/^(\d{1,2})\/(\d{4})$/);
      if (!match) return null;
      
      const [, month, year] = match;
      const mm = month.padStart(2, '0');
      return `${mm}/${year}`;
    })
    .filter((p): p is string => p !== null && /^\d{2}\/\d{4}$/.test(p))
    .sort((a, b) => {
      const [ma, ya] = a.split('/').map(Number);
      const [mb, yb] = b.split('/').map(Number);
      return yb - ya || mb - ma; // ordem decrescente
    });
}

/**
 * Converte um período no formato MM/AAAA ou MM-AAAA para um objeto Date
 * @param period - Período no formato MM/AAAA ou MM-AAAA
 * @returns Objeto Date correspondente ao primeiro dia do mês/ano
 */
export function periodToDate(period: string): Date | null {
  if (!period) return null;
  
  // Aceita ambos os formatos: MM/AAAA ou MM-AAAA
  const match = period.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (!match) return null;
  
  const [, month, year] = match;
  const mm = parseInt(month, 10) - 1; // JavaScript months are 0-based
  const yyyy = parseInt(year, 10);
  
  return new Date(yyyy, mm, 1);
}