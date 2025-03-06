export const data = {
    capacityAppointmentSlotResponse: {
        baseCapacityHours: [
            {
                capacityStreamId: 1,
                days: {
                    MONDAY: 60,
                    TUESDAY: 40,
                    SATURDAY: 30,
                    SUNDAY: 0,
                }
            },
            {
                capacityStreamId: 2,
                days: {
                    TUESDAY: 40,
                    SATURDAY: 30,
                    SUNDAY: 0,
                }
            }
        ],
        appointmentSlots: [
            {
                apptSlotId: 6,
                capacityStreamId: 1,
                days: {
                    WEDNESDAY: true
                }
            },
            {
                apptSlotId: 6,
                capacityStreamId: 2,
                days: {
                    THURSDAY: true
                }
            }
        ]
    },
    lastUpdatedDate: "2025-03-05T06:40:40.809+00.00",
    baseResponse: {
        message: "Success",
        responseStatus: "Success",
        reasonCode: "0"
    }
};