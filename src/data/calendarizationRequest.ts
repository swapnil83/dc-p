export const request = {
    serviceTerritoryId: 14,
    custDateId: 144,
    calendarization: 'updateCalendarization',
    startDate: '03/11/2025',
    endDate: '03/16/2025',
    username: 'john.dorry@brightspeed.com',
    bulkTerritories: [2, 3],
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
                MONDAY: 60,
                TUESDAY: 40,
                SUNDAY: 0,
            }
        }
    ],
    appointmentSlots: [
        {
            startTime: '08:00',
            endTime: '12:00',
            capacityStreamId: 1,
            days: {
                WEDNESDAY: false
            }
        },
        {
            startTime: '08:00',
            endTime: '12:00',
            capacityStreamId: 2,
            days: {
                THURSDAY: false
            }
        }
    ]
};