const MOBILE_PREFIXES = [
    '700', '701', '702', '705', '706', '707', '708',
    '747', '771', '775', '776', '777', '778',
];

export function normalizeKzPhone(phone: string): string | null {
    const value = phone.trim();
    if (!/^\+?[\d\s()-]+$/.test(value)) return null;
    if (value.startsWith('+') && !value.startsWith('+7')) return null;

    const digits = value.replace(/\D/g, '');
    const normalized = value.startsWith('+')
        ? digits
        : digits.startsWith('8')
            ? `7${digits.slice(1)}`
            : digits;

    if (
        normalized.length !== 11 ||
        !normalized.startsWith('7') ||
        !MOBILE_PREFIXES.some((prefix) => normalized.slice(1, 4) === prefix)
    ) return null;
    return `+${normalized}`;
}