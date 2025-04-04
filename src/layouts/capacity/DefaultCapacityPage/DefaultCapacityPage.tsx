import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
``
import PageTitle from '../../../components/common/PageTitle/PageTitle';
import { CalendarizationApiResponseData, CalendarizationState, DefaultCapacityFilterState, LocationsState } from '../../../components/capacity/DefaultCapacityFilter/DefaultCapacityFilter.types';
import DefaultCapacityFilter from '../../../components/capacity/DefaultCapacityFilter/DefaultCapacityFilter';
import { AppDispatch, RootState } from '../../../redux/store';
import { fetchCapacityStream } from '../../../redux/slices/capacityStreamSlice';
import { fetchAppointmentSlots } from '../../../redux/slices/appointmentSlotsSlice';
import DefaultCapacityTable from '../../../components/capacity/DefaultCapacityTable/DefaultCapacityTable';
import { DefaultCapacityTableState } from '../../../components/capacity/DefaultCapacityTable/DefaultCapacityTable.types';
import { transformBaseCapacityHours } from '../../../utility/transformBaseCapacityHours';
import { transformAppointmentSlots } from '../../../utility/transformAppointmentSlots';
import Spinner from '../../../components/common/Spinner/Spinner';
import axiosInstance from '../../../api/axiosInstance';
import { formatDate } from '../../../utility/dateUtility';
import { deepCopy } from '../../../utility/deepCopy';

type DefaultCapacityPageProps = {};

const DefaultCapacityPage: React.FC<DefaultCapacityPageProps> = () => {

    const dispatch: AppDispatch = useDispatch();
    const { data: capacityStream, status: capacityStreamStatus } = useSelector((state: RootState) => state.capacityStream);
    const { data: appointmentSlots, status: appointmentSlotsStatus } = useSelector((state: RootState) => state.appointmentSlots);

    // lifting up state for DefaultCapacityFilter component
    const [defaultCapacityFilterState, setDefaultCapacityFilterState] = useState<DefaultCapacityFilterState>({
        selectedState: "",
        selectedMarket: "",
        selectedTerritory: "",
        selectedTerritoryId: null,
        selectedCalendarization: "",
        startDate: null,
        endDate: null,
        selectedCustDateId: null,
    });

    // lifting up state for DefaultCapacityTable component
    const [defaultCapacityTableState, setDefaultCapacityTableState] = useState<DefaultCapacityTableState>({
        status: 'idle',
        tableData: {
            baseCapacityHours: [],
            appointmentSlots: []
        },
        errorMessage: "",
        isLoading: false
    });

    // state for locations
    const [locationsState, setLocationsState] = useState<LocationsState>({
        status: 'idle',
        states: [],
        errorMessage: "",
        isLoading: false
    });

    // state for Calendarization dropdown data
    const [calendarizationState, setCalendarizationState] = useState<CalendarizationState>({
        status: 'idle',
        calendarization: [],
        errorMessage: "",
        isLoading: false,
    });

    // state to show DefaultCapacityTable component
    const [showDefaultCapacityTable, setShowDefaultCapacityTable] = useState<boolean>(false);

    // state for calendarization field visibility
    const [calendarizationFieldVisibility, setCalendarizationFieldVisibility] = useState<boolean>(false);

    // state to check whether table data is edited or not
    const [isTableDataEdited, setIsTableDataEdited] = useState<boolean>(false);

    // lifting up initial table data state for DefaultCapacityTable component
    const [initialData, setInitialData] = useState<DefaultCapacityTableState["tableData"]>({
        baseCapacityHours: [],
        appointmentSlots: [],
    });

    // on page mounting fetch capacityStream and appointmentSlots master data
    useEffect(() => {
        console.log('USEFFECT: INITIALLY RENDERED FOR DEFAULT CAPACITY PAGE');
        if (capacityStreamStatus === 'idle') {
            dispatch(fetchCapacityStream());
        }

        if (appointmentSlotsStatus === 'idle') {
            dispatch(fetchAppointmentSlots());
        }

        if (capacityStream.baseResponse.responseStatus === 'Success') {
            const initialBaseCapacityHours = transformBaseCapacityHours(capacityStream.capacityStream);
            const deepCopiedBaseCapacityHours = deepCopy(initialBaseCapacityHours);

            updateDefaultCapacityTableState({
                tableData: {
                    appointmentSlots: [],
                    baseCapacityHours: deepCopiedBaseCapacityHours,
                }
            });
            setInitialData((prevState) => ({
                ...prevState,
                baseCapacityHours: deepCopiedBaseCapacityHours,
            }));
        }

    }, [dispatch, capacityStreamStatus, appointmentSlotsStatus]);

    // when territory changed then set initial data for appointmentSlots in table
    useEffect(() => {
        console.log('USEFFECT: RENDERED USEFFECT WHEN TERRITORY CHANGED FOR DEFAULT CAPACITY PAGE');
        if (appointmentSlots.baseResponse.responseStatus === 'Success' && defaultCapacityFilterState.selectedTerritoryId) {

            const initialAppointmentSlots = transformAppointmentSlots(appointmentSlots.serviceTerritories, capacityStream.capacityStream, defaultCapacityFilterState.selectedTerritoryId);
            const deepCopiedAppointmentSlots = deepCopy(initialAppointmentSlots);

            updateDefaultCapacityTableState({
                tableData: {
                    baseCapacityHours: deepCopy(defaultCapacityTableState.tableData.baseCapacityHours),
                    appointmentSlots: deepCopiedAppointmentSlots,
                }
            });

            setInitialData((prevState) => ({
                ...prevState,
                appointmentSlots: deepCopiedAppointmentSlots,
            }));
        }
    }, [defaultCapacityFilterState.selectedTerritoryId]);

    // updater function for DefaultCapacityFilter state
    const updateDefaultCapacityFilterState = (newState: Partial<DefaultCapacityFilterState>) => {
        setDefaultCapacityFilterState((prevState) => ({
            ...prevState,
            ...newState
        }));
    };

    // updater function for DefaultCapacityTable state
    const updateDefaultCapacityTableState = (newState: Partial<DefaultCapacityTableState>) => {
        setDefaultCapacityTableState((prevState) => ({
            ...prevState,
            ...newState
        }));
    };

    // updater function for locations state
    const updateLocations = (newState: Partial<LocationsState>) => {
        setLocationsState((prevState) => ({
            ...prevState,
            ...newState
        }));
    };

    // updater function for calendarization state
    const updateCalendarization = (newState: Partial<CalendarizationState>) => {
        setCalendarizationState((prevState) => ({
            ...prevState,
            ...newState
        }));
    };

    // fetch calendarization data for selected State, Market and Service Territory
    const fetchCalendarizationData = async (territoryId: number | null, preserveSelectedCalendarization = false) => {
        const selectedCalendarization = defaultCapacityFilterState.selectedCalendarization;

        updateCalendarization({
            isLoading: true,
        });

        try {
            const data = await axiosInstance.get(`http://localhost:3000/getCalendarizedDateRangeForTerritory?serviceTerritoryId=${territoryId}`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const response: CalendarizationApiResponseData = data.data;

            if (response.baseResponse.responseStatus === 'Success') {
                updateCalendarization({
                    status: response.baseResponse.responseStatus,
                    calendarization: response.dateRangeList.map((item: any) => ({
                        ...item,
                        startDate: item.startDate ? formatDate(item.startDate) : null,
                        endDate: item.endDate ? formatDate(item.endDate) : null,
                    }))
                });
                const findNullDateCustId = response.dateRangeList.find((i) => (i.startDate === null && i.endDate === null));

                // Restore the selected calendarization option if needed
                if (preserveSelectedCalendarization) {
                    updateDefaultCapacityFilterState({
                        selectedCalendarization: selectedCalendarization, // Restore the selected option
                        selectedCustDateId: findNullDateCustId?.custDateId,
                    });
                } else {
                    updateDefaultCapacityFilterState({
                        selectedCalendarization: "defaultView",
                        selectedCustDateId: findNullDateCustId?.custDateId,
                    });
                }

                setCalendarizationFieldVisibility(true);
            } else {
                updateCalendarization({
                    status: response.baseResponse.responseStatus,
                    errorMessage: response.baseResponse.message || 'An Unknown error message',
                });
            }
        } catch (error) {
            updateCalendarization({
                status: 'failure',
                errorMessage: 'Failed to fetch data. Please try again later.',
            });
        } finally {
            updateCalendarization({
                isLoading: false
            });
        }
    };

    return (
        <Box display={'flex'} flexDirection={'column'} gap={5}>
            <PageTitle title='Default Capacity' backgroundColor='#ffcc00' />
            <Box sx={{ padding: 3 }}>
                <DefaultCapacityFilter
                    defaultCapacityFilterState={defaultCapacityFilterState}
                    updateDefaultCapacityFilterState={updateDefaultCapacityFilterState}
                    showDefaultCapacityTable={showDefaultCapacityTable}
                    setShowDefaultCapacityTable={setShowDefaultCapacityTable}
                    calendarizationFieldVisibility={calendarizationFieldVisibility}
                    setCalendarizationFieldVisibility={setCalendarizationFieldVisibility}
                    locationsState={locationsState}
                    updateLocations={updateLocations}
                    isTableDataEdited={isTableDataEdited}
                    updateDefaultCapacityTableState={updateDefaultCapacityTableState}
                    setInitialData={setInitialData}
                    defaultCapacityTableState={defaultCapacityTableState}
                    calendarizationState={calendarizationState}
                    fetchCalendarizationData={fetchCalendarizationData}
                />
                <>
                    {defaultCapacityTableState.isLoading && <Spinner />}
                    {
                        showDefaultCapacityTable &&
                        <DefaultCapacityTable
                            startDate={defaultCapacityFilterState.startDate}
                            endDate={defaultCapacityFilterState.endDate}
                            selectedCalendarization={defaultCapacityFilterState.selectedCalendarization}
                            defaultCapacityTableState={defaultCapacityTableState}
                            updateDefaultCapacityTableState={updateDefaultCapacityTableState}
                            setShowDefaultCapacityTable={setShowDefaultCapacityTable}
                            isTableDataEdited={isTableDataEdited}
                            setIsTableDataEdited={setIsTableDataEdited}
                            locationsState={locationsState}
                            defaultCapacityFilterState={defaultCapacityFilterState}
                            initialData={initialData}
                            setInitialData={setInitialData}
                            onCalendarizationUpdate={(preserveSelectedCalendarization) =>
                                fetchCalendarizationData(defaultCapacityFilterState.selectedTerritoryId, preserveSelectedCalendarization)
                            }
                        />
                    }
                </>
            </Box>
        </Box>
    );
};

export default DefaultCapacityPage;