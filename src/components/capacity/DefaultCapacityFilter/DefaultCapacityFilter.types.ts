export interface DefaultCapacityFilterState {
    selectedState: string;
    selectedMarket: string;
    selectedTerritory: string;
    selectedTerritoryId: number | null;
    selectedCalendarization: string;
    startDate: string | null;
    endDate: string | null;
};

export interface ServiceTerritory {
    id: number;
    territory: string;
};

export interface Market {
    market: string;
    serviceTerritories: ServiceTerritory[];
};

export interface State {
    state: string;
    markets: Market[];
};

interface BaseResponseInterface {
    message: string;
    responseStatus: string;
    reasonCode: string;
}

export interface LocationsApiResponseData {
    stateData: State[];
    lastUpdatedDate: string;
    baseResponse: BaseResponseInterface;
};

export interface DateCalendarization {
    custDateId: number;
    startDate?: string | null;
    endDate?: string | null;
};

export interface CalendarizationApiResponseData {
    dateRangeList: DateCalendarization[];
    lastUpdatedDate: string;
    baseResponse: BaseResponseInterface;
};

export interface LocationsState {
    status: 'idle' | 'success' | 'failure' | string;
    states: State[];
    errorMessage: string;
    isLoading: boolean;
};

export interface CalendarizationState {
    status: 'idle' | 'success' | 'failure' | string;
    calendarization: DateCalendarization[];
    errorMessage: string;
    isLoading: boolean;
};