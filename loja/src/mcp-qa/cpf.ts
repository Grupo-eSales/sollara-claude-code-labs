import { randomInt } from 'node:crypto';

function digitoCpf(base: number[]): number {
    const pesoInicial = base.length + 1;
    const soma = base.reduce((total, digito, indice) => total + digito * (pesoInicial - indice), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
}

export function gerarCpf(): string {
    const base = Array.from({ length: 9 }, () => randomInt(0, 10));
    const primeiro = digitoCpf(base);
    const segundo = digitoCpf([...base, primeiro]);
    return [...base, primeiro, segundo].join('');
}

export function cpfValido(cpf: string): boolean {
    const digitos = cpf.replace(/\D/g, '').split('').map(Number);
    if (digitos.length !== 11 || new Set(digitos).size === 1) return false;
    return digitoCpf(digitos.slice(0, 9)) === digitos[9] && digitoCpf(digitos.slice(0, 10)) === digitos[10];
}
