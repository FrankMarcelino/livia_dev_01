/**
 * Validadores para dados brasileiros
 * Utiliza @brazilian-utils/brazilian-utils para validação
 */

import {
  isValidCPF,
  isValidCNPJ,
  isValidPhone,
} from '@brazilian-utils/brazilian-utils';

/**
 * Valida CPF brasileiro
 */
export function validateCPF(cpf: string): boolean {
  if (!cpf) return false;
  return isValidCPF(cpf);
}

/**
 * Valida CNPJ brasileiro
 */
export function validateCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  return isValidCNPJ(cnpj);
}

/**
 * Valida telefone brasileiro (celular ou fixo)
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  return isValidPhone(phone);
}

/**
 * Valida email básico
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formata CPF (000.000.000-00)
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ (00.000.000/0000-00)
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;

  return cleaned.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formata telefone brasileiro
 * Exemplos: (11) 98765-4321 ou (11) 3456-7890
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    // Celular: (XX) 9XXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return phone;
}

/**
 * Remove formatação de CPF/CNPJ/telefone
 */
export function removeFormatting(value: string): string {
  return value.replace(/\D/g, '');
}
