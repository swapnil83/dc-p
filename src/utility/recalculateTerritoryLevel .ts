import { CapacityStreamRowData } from "../components/capacity/DefaultCapacityTable/DefaultCapacityTable.types";

export const recalculateTerritoryLevel = (data: CapacityStreamRowData[]): CapacityStreamRowData[] => {
    const territoryRow = data.find((row) => row.capacityStream === "Territory Level");
    if (territoryRow) {
        const updatedData = data.map((row) => {
            if (row.capacityStream === "Territory Level") {
                const newDays = { ...row.days };
                Object.keys(newDays).forEach((day) => {
                    const sum = data
                        .filter((r) => !r.isDisabled && r.capacityStream !== "Territory Level")
                        .reduce((acc, r) => acc + (r.days[day as keyof typeof r.days] || 0), 0);
                    newDays[day as keyof typeof newDays] = Math.round(sum * 100) / 100;
                });
                return { ...row, days: newDays };
            }
            return row;
        });
        return updatedData;
    }
    return data;
};