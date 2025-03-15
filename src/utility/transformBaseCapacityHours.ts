import { CapacityStream } from "../components/capacity/CapacityStreamTable/CapacityStreamTable.types";
import { CapacityStreamRowData } from "../components/capacity/DefaultCapacityTable/DefaultCapacityTable.types";

export const transformBaseCapacityHours = (capacityStreams: CapacityStream[]): CapacityStreamRowData[] => {
    const territoryLevelAggregate: CapacityStreamRowData = {
        csId: 0,
        capacityStream: "Territory Level",
        days: { MONDAY: 0, TUESDAY: 0, WEDNESDAY: 0, THURSDAY: 0, FRIDAY: 0, SATURDAY: 0, SUNDAY: 0 },
        isDisabled: true,
    };

    const mappedCapacitySlots: CapacityStreamRowData[] = capacityStreams.map((stream) => ({
        csId: stream.csId,
        capacityStream: stream.capacityStream,
        days: { MONDAY: 0, TUESDAY: 0, WEDNESDAY: 0, THURSDAY: 0, FRIDAY: 0, SATURDAY: 0, SUNDAY: 0 },
        isDisabled: false,
    }));

    return [territoryLevelAggregate, ...mappedCapacitySlots];
};
