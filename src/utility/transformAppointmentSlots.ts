import { ServiceTerritoryData } from "../components/capacity/AppointmentSlotsTable/AppointmentSlotsTable.types";
import { CapacityStream } from "../components/capacity/CapacityStreamTable/CapacityStreamTable.types";
import { AppointmentSlotsRowData } from "../components/capacity/DefaultCapacityTable/DefaultCapacityTable.types";

export const transformAppointmentSlots = (appointmentSlots: ServiceTerritoryData[], capacitySlots: CapacityStream[], territoryId: number | null): AppointmentSlotsRowData[] => {
    const filteredAppointmentSlots = territoryId
        ? (appointmentSlots ?? []).filter(
            territory => territory.serviceTerritoryId === territoryId
        ) : appointmentSlots ?? [];
    return filteredAppointmentSlots.flatMap((territory) =>
        (territory.capacityStreamSlots ?? []).flatMap((stream) => {
            // Find matching capacity slot to get csId
            const matchingCapacitySlot = capacitySlots.find(slot => slot.capacityStream === stream.capacityStream);

            return (stream.appointmentSlots ?? []).map((slot) => ({
                csId: matchingCapacitySlot?.csId ?? 0,
                capacityStream: stream.capacityStream,
                startTime: slot.aptSlotStart,
                endTime: slot.aptSlotEnd,
                days: {
                    MONDAY: false,
                    TUESDAY: false,
                    WEDNESDAY: false,
                    THURSDAY: false,
                    FRIDAY: false,
                    SATURDAY: false,
                    SUNDAY: false
                },
                isDisabled: false,
            }));
        })
    );
};
