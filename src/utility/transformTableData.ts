import { recalculateTerritoryLevel } from "./recalculateTerritoryLevel ";

export const transformTableData = (response: any, existingData: any, serviceTerritories: any, selectedTerritory: string) => {
    const { baseCapacityHours: apiBaseCapacityHours, appointmentSlots: apiAppointmentSlots } = response.capacityAppointmentSlotResponse;
    console.log('checking apiAppointmentSlots: ', apiAppointmentSlots);
    // Merge baseCapacityHours
    const mergedBaseCapacityHours = existingData.baseCapacityHours.map((existingItem: any) => {
        // Find the corresponding item in the API response
        const apiItem = apiBaseCapacityHours.find(
            (item: any) => item.capacityStreamId === existingItem.csId
        );

        // If a matching item is found, merge the days object
        if (apiItem) {
            return {
                ...existingItem, // Keep all existing properties
                days: {
                    ...existingItem.days, // Keep existing days
                    ...apiItem.days, // Override with API days
                },
            };
        }
        return existingItem; // If no match, return the existing item as is
    });

    // Find the selected territory's data from serviceTerritories
    const selectedTerritoryData = serviceTerritories.find(
        (territory: any) => territory.serviceTerritory === selectedTerritory
    );

    // Merge appointmentSlots
    const mergedAppointmentSlots = existingData.appointmentSlots.map((existingItem: any) => {
        // Find the corresponding slot in the selected territory's data
        const territorySlot = selectedTerritoryData?.capacityStreamSlots
            .find((stream: any) => stream.capacityStream === existingItem.capacityStream)
            ?.appointmentSlots.find((slot: any) => slot.aptSlotStart === existingItem.startTime && slot.aptSlotEnd === existingItem.endTime);

        // Find the corresponding item in the API response
        const apiItem = apiAppointmentSlots.find(
            (item: any) => item.apptSlotId === territorySlot?.aptSlotId
        );

        console.log('checking apiItem: ', apiItem);
        // If a matching item is found, merge the days object and add apptSlotId
        if (apiItem && territorySlot) {
            return {
                ...existingItem, // Keep all existing properties
                apptSlotId: territorySlot.aptSlotId, // Use the aptSlotId from the territory data
                days: {
                    ...existingItem.days, // Keep existing days
                    ...apiItem.days, // Override with API days
                },
            };
        }
        return existingItem; // If no match, return the existing item as is
    });

    // Recalculate territory level data
    const transformedData = {
        baseCapacityHours: mergedBaseCapacityHours,
        appointmentSlots: mergedAppointmentSlots,
    };

    // Recalculate territory level data
    const recalculatedData = recalculateTerritoryLevel(transformedData.baseCapacityHours);

    return {
        baseCapacityHours: recalculatedData,
        appointmentSlots: transformedData.appointmentSlots,
    };
};