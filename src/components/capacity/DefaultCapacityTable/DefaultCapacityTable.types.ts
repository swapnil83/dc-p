export type CapacityStreamRowData = {
    csId?: number;
    capacityStreamId?: number;
    capacityStream: string;
    days: {
        MONDAY?: number;
        TUESDAY?: number;
        WEDNESDAY?: number;
        THURSDAY?: number;
        FRIDAY?: number;
        SATURDAY?: number;
        SUNDAY?: number
    };
    isDisabled?: boolean;
};

type DaysType = {
    [key: string]: boolean;
};

export interface AppointmentSlotsRowData {
    csId?: number;
    capacityStreamId?: number;
    capacityStream: string;
    startTime?: string;
    endTime?: string;
    apptSlotId?: number;
    days: DaysType;
    isDisabled?: boolean;
};

export interface DefaultCapacityTableData {
    baseCapacityHours: CapacityStreamRowData[];
    appointmentSlots: AppointmentSlotsRowData[];
};

interface BaseResponseInterface {
    message: string;
    responseStatus: string;
    reasonCode: string;
}

export interface DefaultCapacityTableApiResponseData {
    capacityAppointmentSlotResponse: DefaultCapacityTableData;
    lastUpdatedDate: string;
    baseResponse: BaseResponseInterface;
};

export interface DefaultCapacityTableState {
    status: 'idle' | 'success' | 'failure' | string;
    tableData: DefaultCapacityTableData;
    errorMessage: string;
    isLoading: boolean;
};