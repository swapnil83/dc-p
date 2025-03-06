export interface CapacityStream {
    csId: number;
    capacityStream: string;
};

interface BaseResponseInterface {
    message: string;
    responseStatus: string;
    reasonCode: string;
}

export interface CapacityStreamApiResponse {
    capacityStraem: CapacityStream[];
    lastUpdatedDate: string;
    baseResponse: BaseResponseInterface;
};