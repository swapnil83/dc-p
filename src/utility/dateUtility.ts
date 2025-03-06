export function getDateRange(startDate: string | null | undefined, endDate: string | null | undefined): string {
    if (!startDate || !endDate) return "Custom Range";
    return `${startDate} - ${endDate}`;
}

export function formatDateToMMDDYYYY(date: Date | null): string | null {
    if (!date) return null;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

export function formatDate(dateString: string): string {
    const [year, month, day] = dateString.split("-");
    return `${month}/${day}/${year}`;
};