
export interface AppointmentSlot {
    aptSlotId: number;
    aptSlotStart: string;
    aptSlotEnd: string;
}

export interface CapacityStreamSlot {
    capacityStream: string;
    appointmentSlots: AppointmentSlot[];
};

export interface ServiceTerritoryData {
    serviceTerritoryId: number;
    serviceTerritory: string;
    capacityStreamSlots: CapacityStreamSlot[]
};

export interface BaseResponseInterface {
    message: string;
    responseStatus: string;
    reasonCode: string;
}

export interface AppointmentSlotsApiResponse {
    serviceTerritories: ServiceTerritoryData[];
    lastUpdatedDate: string;
    baseResponse: BaseResponseInterface;
};