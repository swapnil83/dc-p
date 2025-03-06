export const transformTableData = (response: any, existingData: any) => {
    const { baseCapacityHours: apiBaseCapacityHours, appointmentSlots: apiAppointmentSlots } = response.capacityAppointmentSlotResponse;

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

    // Merge appointmentSlots
    const mergedAppointmentSlots = existingData.appointmentSlots.map((existingItem: any) => {
        // Find the corresponding item in the API response
        const apiItem = apiAppointmentSlots.find(
            (item: any) => item.capacityStreamId === existingItem.csId
        );

        // If a matching item is found, merge the days object and add apptSlotId
        if (apiItem) {
            return {
                ...existingItem, // Keep all existing properties
                apptSlotId: apiItem.apptSlotId, // Add apptSlotId from API
                days: {
                    ...existingItem.days, // Keep existing days
                    ...apiItem.days, // Override with API days
                },
            };
        }
        return existingItem; // If no match, return the existing item as is
    });

    return {
        baseCapacityHours: mergedBaseCapacityHours,
        appointmentSlots: mergedAppointmentSlots,
    };
};