export function getAlmatyDate(date: string): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Almaty',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(date));
}