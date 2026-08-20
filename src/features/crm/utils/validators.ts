// Brazilian CPF & CNPJ (Modulo 11) and License Plate (Mercosul / Traditional) Validators & Masks

const NON_DIGITS = /\D/g;
const CNPJ_WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function normalizeDocument(doc?: string | null): string {
  if (!doc) return '';
  return doc.replace(NON_DIGITS, '').trim();
}

export function isValidCpf(cpf: string): boolean {
  const clean = normalizeDocument(cpf);
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(clean[i], 10) * (10 - i);
  }
  const remainder1 = (sum1 * 10) % 11;
  const digit1 = remainder1 === 10 ? 0 : remainder1;
  if (digit1 !== parseInt(clean[9], 10)) return false;

  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(clean[i], 10) * (11 - i);
  }
  const remainder2 = (sum2 * 10) % 11;
  const digit2 = remainder2 === 10 ? 0 : remainder2;
  return digit2 === parseInt(clean[10], 10);
}

export function isValidCnpj(cnpj: string): boolean {
  const clean = normalizeDocument(cnpj);
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;

  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(clean[i], 10) * CNPJ_WEIGHTS_1[i];
  }
  const rem1 = sum1 % 11;
  const digit1 = rem1 < 2 ? 0 : 11 - rem1;
  if (digit1 !== parseInt(clean[12], 10)) return false;

  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(clean[i], 10) * CNPJ_WEIGHTS_2[i];
  }
  const rem2 = sum2 % 11;
  const digit2 = rem2 < 2 ? 0 : 11 - rem2;
  return digit2 === parseInt(clean[13], 10);
}

export function isValidDocument(doc?: string | null): boolean {
  const clean = normalizeDocument(doc);
  if (!clean) return true; // Optional field in some schemas
  if (clean.length === 11) return isValidCpf(clean);
  if (clean.length === 14) return isValidCnpj(clean);
  return false;
}

export function formatDocument(doc?: string | null): string {
  const clean = normalizeDocument(doc);
  if (!clean) return '';
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return clean;
}

export function maskDocument(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return clean
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

// License Plate Validation & Masking
const TRADITIONAL_PATTERN = /^[A-Z]{3}[0-9]{4}$/;
const MERCOSUL_CAR_PATTERN = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
const MERCOSUL_MOTO_PATTERN = /^[A-Z]{3}[0-9]{2}[A-Z][0-9]$/;

export function normalizeLicensePlate(plate?: string | null): string {
  if (!plate) return '';
  return plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
}

export function isValidLicensePlate(plate?: string | null): boolean {
  const clean = normalizeLicensePlate(plate);
  if (!clean || clean.length !== 7) return false;
  return (
    TRADITIONAL_PATTERN.test(clean) ||
    MERCOSUL_CAR_PATTERN.test(clean) ||
    MERCOSUL_MOTO_PATTERN.test(clean)
  );
}

export function formatLicensePlate(plate?: string | null): string {
  const clean = normalizeLicensePlate(plate);
  if (!clean) return '';
  if (TRADITIONAL_PATTERN.test(clean)) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return clean;
}

export function maskLicensePlate(value: string): string {
  const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7);
  if (clean.length > 3 && /^[A-Z]{3}[0-9]/.test(clean)) {
    // If traditional 4th character is digit and 5th is digit
    if (clean.length >= 5 && /^[A-Z]{3}[0-9]{2}/.test(clean)) {
      return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
  }
  return clean;
}

export function maskPhone(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 10) {
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return clean
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

export function maskCep(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 8);
  return clean.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

export function formatCep(value?: string | null): string {
  if (!value) return '';
  const clean = value.replace(/\D/g, '').slice(0, 8);
  if (clean.length === 8) {
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  }
  return value;
}

