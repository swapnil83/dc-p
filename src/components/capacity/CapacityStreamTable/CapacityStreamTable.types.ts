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
    capacityStream: CapacityStream[];
    lastUpdatedDate: string;
    baseResponse: BaseResponseInterface;
};