export const getSeasonLabel = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 5 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};