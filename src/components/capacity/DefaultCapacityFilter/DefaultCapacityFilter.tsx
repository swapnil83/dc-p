import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    SelectChangeEvent,
    Typography,
    Modal,
    Tooltip,
    IconButton,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useSelector } from 'react-redux';

import { CalendarizationState, LocationsState, LocationsApiResponseData, CalendarizationApiResponseData, DefaultCapacityFilterState } from "./DefaultCapacityFilter.types";
import { getDateRange, formatDateToMMDDYYYY, formatDate } from "../../../utility/dateUtility";
import { getTerritoryId } from "../../../utility/getTerritoryId";
import axiosInstance from "../../../api/axiosInstance";
import Spinner from "../../common/Spinner/Spinner";
import { DefaultCapacityTableApiResponseData, DefaultCapacityTableState } from "../DefaultCapacityTable/DefaultCapacityTable.types";
import { RootState } from '../../../redux/store';
import { transformBaseCapacityHours } from "../../../utility/transformBaseCapacityHours";
import { transformAppointmentSlots } from "../../../utility/transformAppointmentSlots";
import { transformTableData } from "../../../utility/transformTableData";

type DefaultCapacityFilterProps = {
    defaultCapacityFilterState: DefaultCapacityFilterState;
    updateDefaultCapacityFilterState: (newState: Partial<DefaultCapacityFilterState>) => void;
    showDefaultCapacityTable: boolean;
    setShowDefaultCapacityTable: React.Dispatch<React.SetStateAction<boolean>>;
    calendarizationFieldVisibility: boolean;
    setCalendarizationFieldVisibility: React.Dispatch<React.SetStateAction<boolean>>;
    locationsState: LocationsState;
    updateLocations: (newState: Partial<LocationsState>) => void;
    isTableDataEdited?: boolean;
    updateDefaultCapacityTableState: (newState: Partial<DefaultCapacityTableState>) => void;
    setInitialData: React.Dispatch<React.SetStateAction<DefaultCapacityTableState["tableData"]>>;
    defaultCapacityTableState: DefaultCapacityTableState,
};

const DefaultCapacityFilter: React.FC<DefaultCapacityFilterProps> = ({
    defaultCapacityFilterState,
    updateDefaultCapacityFilterState,
    showDefaultCapacityTable,
    setShowDefaultCapacityTable,
    calendarizationFieldVisibility,
    setCalendarizationFieldVisibility,
    locationsState,
    updateLocations,
    isTableDataEdited = false,
    updateDefaultCapacityTableState,
    setInitialData,
    defaultCapacityTableState,
}) => {
    const { data: capacityStream } = useSelector((state: RootState) => state.capacityStream);
    const { data: appointmentSlots } = useSelector((state: RootState) => state.appointmentSlots);

    // state for Calendarization dropdown data
    const [calendarizationState, setCalendarizationState] = useState<CalendarizationState>({
        status: 'idle',
        calendarization: [],
        errorMessage: "",
        isLoading: false,
    });

    // state for fields error
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // state to check conflict data ranges and open modal if any
    const [openConflictModal, setOpenConflictModal] = useState<boolean>(false);
    const [conflictMessage, setConflictMessage] = useState<string>("");

    // state to show modal related to table data changes is not preserved
    const [openCalendarizationChangeModal, setOpenCalendarizationChangeModal] = useState<boolean>(false);
    const [pendingStateChange, setPendingStateChange] = useState<(() => void) | null>(null);
    const [pendingMarketChange, setPendingMarketChange] = useState<(() => void) | null>(null);
    const [pendingTerritoryChange, setPendingTerritoryChange] = useState<(() => void) | null>(null);
    const [pendingCalendarizationChange, setPendingCalendarizationChange] = useState<(() => void) | null>(null);

    // updater function for calendarization state
    const updateCalendarization = (newState: Partial<CalendarizationState>) => {
        setCalendarizationState((prevState) => ({
            ...prevState,
            ...newState
        }));
    };

    // on page mounting fetch locations for State, Market abd Service Territory fields
    useEffect(() => {
        const fetchLocations = async () => {
            updateLocations({
                isLoading: true
            });

            try {
                const data = await axiosInstance.get('http://localhost:3000/getServiceTerritoryHierarchy', {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const response: LocationsApiResponseData = data.data;

                if (response.baseResponse.responseStatus === 'Success') {
                    updateLocations({
                        status: response.baseResponse.responseStatus,
                        states: response.stateData,
                    });
                } else {
                    updateLocations({
                        status: response.baseResponse.responseStatus,
                        errorMessage: response.baseResponse.message || 'An Unknown error message',
                    });
                }
            } catch (error) {
                updateLocations({
                    status: 'failure',
                    errorMessage: 'Failed to fetch data. Please try again later.',
                });
            } finally {
                updateLocations({
                    isLoading: false
                });
            }
        };

        fetchLocations();
    }, []);

    // fetch calendarization data for selected State, Market and Service Territory
    const fetchCalendarizationData = async (territoryId: number | null) => {
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
                        startDate: formatDate(item.startDate),
                        endDate: formatDate(item.endDate),
                    }))
                });
                updateDefaultCapacityFilterState({
                    selectedCalendarization: "defaultView",
                });
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

    // check if the selected date range overlaps with existing ranges
    const checkDateConflict = (startDate: string | null, endDate: string | null) => {
        if (!startDate || !endDate) return false;

        const selectedStart = new Date(startDate);
        const selectedEnd = new Date(endDate);

        const existingRanges = calendarizationState.calendarization.filter(
            (cal) => cal.startDate && cal.endDate
        );

        for (const range of existingRanges) {
            const rangeStart = new Date(range.startDate!);
            const rangeEnd = new Date(range.endDate!);

            // Check for overlap
            if (selectedStart <= rangeEnd && selectedEnd >= rangeStart) {
                setConflictMessage(
                    `The selected date range conflicts with "${getDateRange(range.startDate, range.endDate)}".`
                );
                return true;
            }
        }
        return false;
    };

    const handleStateChange = (event: SelectChangeEvent) => {
        const changeFn = () => {
            updateDefaultCapacityFilterState({
                selectedState: event.target.value,
                selectedMarket: "",
                selectedTerritory: "",
                selectedTerritoryId: null,
            });

            if (calendarizationFieldVisibility) {
                setCalendarizationFieldVisibility(false);
            }

            if (showDefaultCapacityTable) {
                const initialBaseCapacityHours = transformBaseCapacityHours(capacityStream.capacityStraem);
                const initialAppointmentSlots = transformAppointmentSlots(appointmentSlots.serviceTerritories, capacityStream.capacityStraem, defaultCapacityFilterState.selectedTerritoryId);

                updateDefaultCapacityTableState({
                    tableData: {
                        baseCapacityHours: initialBaseCapacityHours,
                        appointmentSlots: initialAppointmentSlots,
                    }
                });

                setInitialData({
                    baseCapacityHours: initialBaseCapacityHours,
                    appointmentSlots: initialAppointmentSlots,
                });

                setShowDefaultCapacityTable(false);
            }

            setErrors({ ...errors, state: '' });
        };

        if (isTableDataEdited && showDefaultCapacityTable) {
            setPendingStateChange(() => changeFn);
            setOpenCalendarizationChangeModal(true);
        } else {
            changeFn();
        }
    };

    const handleMarketChange = (event: SelectChangeEvent) => {
        const changeFn = () => {
            updateDefaultCapacityFilterState({
                selectedMarket: event.target.value,
                selectedTerritory: "",
                selectedTerritoryId: null,
            });

            if (calendarizationFieldVisibility) {
                setCalendarizationFieldVisibility(false);
            }

            if (showDefaultCapacityTable) {
                const initialBaseCapacityHours = transformBaseCapacityHours(capacityStream.capacityStraem);
                const initialAppointmentSlots = transformAppointmentSlots(appointmentSlots.serviceTerritories, capacityStream.capacityStraem, defaultCapacityFilterState.selectedTerritoryId);

                updateDefaultCapacityTableState({
                    tableData: {
                        baseCapacityHours: initialBaseCapacityHours,
                        appointmentSlots: initialAppointmentSlots,
                    }
                });

                setInitialData({
                    baseCapacityHours: initialBaseCapacityHours,
                    appointmentSlots: initialAppointmentSlots,
                });

                setShowDefaultCapacityTable(false);
            }

            setErrors({ ...errors, market: '' });
        };

        if (isTableDataEdited && showDefaultCapacityTable) {
            setPendingMarketChange(() => changeFn);
            setOpenCalendarizationChangeModal(true);
        } else {
            changeFn();
        }
    };

    const handleTerritoryChange = (event: SelectChangeEvent) => {
        const territoryName = event.target.value;
        const territoryId = getTerritoryId(locationsState.states, defaultCapacityFilterState.selectedState, defaultCapacityFilterState.selectedMarket, territoryName);

        const changeFn = () => {
            updateDefaultCapacityFilterState({
                selectedTerritory: event.target.value,
                selectedTerritoryId: territoryId,
            });
            setErrors({ ...errors, territory: '' });

            if (calendarizationFieldVisibility) {
                setCalendarizationFieldVisibility(false);
            }

            if (showDefaultCapacityTable) {
                const initialBaseCapacityHours = transformBaseCapacityHours(capacityStream.capacityStraem);
                const initialAppointmentSlots = transformAppointmentSlots(appointmentSlots.serviceTerritories, capacityStream.capacityStraem, defaultCapacityFilterState.selectedTerritoryId);

                updateDefaultCapacityTableState({
                    tableData: {
                        baseCapacityHours: initialBaseCapacityHours,
                        appointmentSlots: initialAppointmentSlots,
                    }
                });

                setInitialData({
                    baseCapacityHours: initialBaseCapacityHours,
                    appointmentSlots: initialAppointmentSlots,
                });

                setShowDefaultCapacityTable(false);
            }

            // Fetch calendarization data for selected state, market, and territory
            fetchCalendarizationData(territoryId);
        };

        if (isTableDataEdited && showDefaultCapacityTable) {
            setPendingTerritoryChange(() => changeFn);
            setOpenCalendarizationChangeModal(true);
        } else {
            changeFn();
        }
    };

    const handleCalendarizationChange = (event: SelectChangeEvent) => {
        const value = event.target.value;
        const changeFn = () => {
            updateDefaultCapacityFilterState({
                selectedCalendarization: value,
            });
            setErrors({ ...errors, startDate: '', endDate: '' });

            if (showDefaultCapacityTable) {
                const initialBaseCapacityHours = transformBaseCapacityHours(capacityStream.capacityStraem);
                const initialAppointmentSlots = transformAppointmentSlots(appointmentSlots.serviceTerritories, capacityStream.capacityStraem, defaultCapacityFilterState.selectedTerritoryId);

                updateDefaultCapacityTableState({
                    tableData: {
                        baseCapacityHours: initialBaseCapacityHours,
                        appointmentSlots: initialAppointmentSlots,
                    }
                });

                setInitialData({
                    baseCapacityHours: initialBaseCapacityHours,
                    appointmentSlots: initialAppointmentSlots,
                });

                setShowDefaultCapacityTable(false);
            }

            if (value === "defaultView") {
                updateDefaultCapacityFilterState({
                    startDate: null,
                    endDate: null
                });
            } else if (value === "addCalendarization") {
                updateDefaultCapacityFilterState({
                    startDate: null,
                    endDate: null
                });
            } else {
                const selectedCal = calendarizationState.calendarization.find(
                    cal => cal.custDateId === Number(value)
                );
                if (selectedCal?.startDate && selectedCal?.endDate) {
                    updateDefaultCapacityFilterState({
                        startDate: selectedCal.startDate,
                        endDate: selectedCal.endDate,
                    });
                    setErrors({});
                }
            }
        };

        // Check if table data is edited and table is visible
        if (isTableDataEdited && showDefaultCapacityTable) {
            setPendingCalendarizationChange(() => changeFn); // Store the change
            setOpenCalendarizationChangeModal(true); // Show confirmation modal
        } else {
            changeFn(); // Apply change directly if no edits or table not visible
        }
    };

    const handleStartDateChange = (newValue: Date | null) => {
        const formattedDate = formatDateToMMDDYYYY(newValue);
        updateDefaultCapacityFilterState({
            startDate: formattedDate,
        });
        setErrors({ ...errors, startDate: '' });
    };

    const handleEndDateChange = (newValue: Date | null) => {
        const formattedDate = formatDateToMMDDYYYY(newValue);
        updateDefaultCapacityFilterState({ endDate: formattedDate });
        setErrors({ ...errors, endDate: "" });

        if (defaultCapacityFilterState.selectedCalendarization === "addCalendarization" && formattedDate) {
            const hasConflict = checkDateConflict(defaultCapacityFilterState.startDate, formattedDate);
            if (hasConflict) {
                setOpenConflictModal(true); // Show modal if conflict detected
            }
        }
    };

    const validateForm = () => {
        let newErrors: { [key: string]: string } = {};

        // always validate state as it's always enabled initially
        if (!defaultCapacityFilterState.selectedState) {
            newErrors.state = 'State is required';
        }

        // validate market only if state is selected (market field is enabled)
        if (defaultCapacityFilterState.selectedState && !defaultCapacityFilterState.selectedMarket) {
            newErrors.market = 'Market is required';
        }

        // validate territory only if market is selected (territory field is enabled)
        if (defaultCapacityFilterState.selectedMarket && !defaultCapacityFilterState.selectedTerritory) {
            newErrors.territory = 'Service Territory is required';
        }

        // calendarization validation
        if (defaultCapacityFilterState.selectedCalendarization === "addCalendarization") {
            if (!defaultCapacityFilterState.startDate) newErrors.startDate = 'Start Date is required';
            if (!defaultCapacityFilterState.endDate) newErrors.endDate = 'End Date is required';
            if (defaultCapacityFilterState.startDate && defaultCapacityFilterState.endDate) {
                const start = new Date(defaultCapacityFilterState.startDate);
                const end = new Date(defaultCapacityFilterState.endDate);
                if (start > end) {
                    newErrors.endDate = 'End Date must be after Start Date';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSearch = async () => {
        if (validateForm()) {
            updateDefaultCapacityTableState({
                isLoading: true,
            });

            try {
                const data = await axiosInstance.get(`http://localhost:3000/getCapacityTableData`, {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const response: DefaultCapacityTableApiResponseData = data.data;
                console.log('checking response: ', response);

                if (response.baseResponse.responseStatus === 'Success') {
                    const transformedData = transformTableData(response, defaultCapacityTableState.tableData);

                    console.log('checking Transformed Data:', transformedData);

                    // Update the table state with the transformed data
                    updateDefaultCapacityTableState({
                        status: response.baseResponse.responseStatus,
                        tableData: transformedData,
                    });

                    // Set the initial data for future comparisons
                    setInitialData(transformedData);

                    // Show the table
                    setShowDefaultCapacityTable(true);
                } else {
                    updateDefaultCapacityTableState({
                        status: response.baseResponse.responseStatus,
                        errorMessage: response.baseResponse.message || 'An Unknown error message',
                    });
                }
            } catch (error) {
                updateDefaultCapacityTableState({
                    status: 'failure',
                    errorMessage: 'Failed to fetch data. Please try again later.',
                });
            } finally {
                updateDefaultCapacityTableState({
                    isLoading: false
                });
            }
        }
    };

    const handleCloseConflictModal = () => {
        setOpenConflictModal(false);
        updateDefaultCapacityFilterState({ startDate: null, endDate: null });
    };

    const handleConfirmCalendarizationChange = () => {
        if (pendingCalendarizationChange) {
            pendingCalendarizationChange();
        } else if (pendingStateChange) {
            pendingStateChange();
        } else if (pendingMarketChange) {
            pendingMarketChange();
        } else if (pendingTerritoryChange) {
            pendingTerritoryChange();
        }

        setOpenCalendarizationChangeModal(false);
        setPendingCalendarizationChange(null);
        setPendingStateChange(null);
        setPendingMarketChange(null);
        setPendingTerritoryChange(null);
    };

    const handleCancelCalendarizationChange = () => {
        setOpenCalendarizationChangeModal(false);
        setPendingCalendarizationChange(null);
        setPendingStateChange(null);
        setPendingMarketChange(null);
        setPendingTerritoryChange(null);
    };

    const marketsForSelectedState = locationsState.states.find(
        (stateItem) => stateItem.state === defaultCapacityFilterState.selectedState
    )?.markets || [];

    const territoriesForSelectedMarket = marketsForSelectedState.find(
        (market) => market.market === defaultCapacityFilterState.selectedMarket
    )?.serviceTerritories || [];

    const renderError = (field: string) => {
        if (errors[field]) {
            return (
                <Box sx={{ mt: 1, color: 'red', fontSize: '1rem', textAlign: 'left' }}>
                    {errors[field]}
                </Box>
            );
        }
        return null;
    };

    const showDateFields = defaultCapacityFilterState.selectedCalendarization === "addCalendarization" ||
        defaultCapacityFilterState.selectedCalendarization !== "defaultView";

    // Determine the maxDate for Start Date picker based on selected calendarization's endDate
    const selectedCal = calendarizationState.calendarization.find(
        cal => String(cal.custDateId) === defaultCapacityFilterState.selectedCalendarization
    );
    const maxStartDate = selectedCal && selectedCal.endDate &&
        defaultCapacityFilterState.selectedCalendarization !== "defaultView" &&
        defaultCapacityFilterState.selectedCalendarization !== "addCalendarization"
        ? new Date(new Date(selectedCal.endDate).getTime() - 24 * 60 * 60 * 1000) // Subtract one day
        : undefined;

    return (
        <>
            {(locationsState.isLoading || calendarizationState.isLoading) && <Spinner />}
            <Box>
                {(locationsState.status === 'failure' || (locationsState.status === 'success' && locationsState.states.length === 0)) && (
                    <Box
                        sx={{
                            backgroundColor: '#ffebee',
                            color: '#d32f2f',
                            padding: 2,
                            borderRadius: 1,
                            marginBottom: 2,
                            fontWeight: 'bold',
                        }}
                    >
                        {locationsState.status === 'failure'
                            ? `API Error: ${locationsState.errorMessage}`
                            : 'No Data Available.'}
                    </Box>
                )}

                {/* First Row: State, Market, Territory */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, marginBottom: 5 }}>
                    <FormControl fullWidth sx={{ width: { xs: "100%", sm: "250px" } }} disabled={locationsState.states.length === 0}>
                        <InputLabel
                            sx={{
                                '&.Mui-focused': {
                                    color: 'black',
                                },
                            }}
                        >
                            State
                        </InputLabel>
                        <Select
                            value={defaultCapacityFilterState.selectedState}
                            onChange={handleStateChange}
                            label="State"
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        maxHeight: 200,
                                        '&::-webkit-scrollbar': {
                                            width: '10px',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            backgroundColor: '#b5b5ba',
                                            borderRadius: '16px',
                                        },
                                    },
                                },
                            }}
                        >
                            {locationsState.states.map((state) => (
                                <MenuItem key={state.state} value={state.state}>
                                    {state.state}
                                </MenuItem>
                            ))}
                        </Select>
                        {renderError('state')}
                    </FormControl>

                    <FormControl fullWidth sx={{ width: { xs: "100%", sm: "250px" } }} disabled={!defaultCapacityFilterState.selectedState}>
                        <InputLabel
                            sx={{
                                '&.Mui-focused': {
                                    color: 'black',
                                },
                            }}
                        >
                            Market
                        </InputLabel>
                        <Select
                            value={defaultCapacityFilterState.selectedMarket}
                            onChange={handleMarketChange}
                            label="Market"
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        maxHeight: 200,
                                        '&::-webkit-scrollbar': {
                                            width: '10px',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            backgroundColor: '#b5b5ba',
                                            borderRadius: '16px',
                                        },
                                    },
                                },
                            }}
                        >
                            {marketsForSelectedState.map((market) => (
                                <MenuItem key={market.market} value={market.market}>
                                    {market.market}
                                </MenuItem>
                            ))}
                        </Select>
                        {renderError('market')}
                    </FormControl>

                    <FormControl fullWidth sx={{ width: { xs: "100%", sm: "250px" } }} disabled={!defaultCapacityFilterState.selectedMarket}>
                        <InputLabel
                            sx={{
                                '&.Mui-focused': {
                                    color: 'black',
                                },
                            }}
                        >
                            Service Territory
                        </InputLabel>
                        <Select
                            value={defaultCapacityFilterState.selectedTerritory}
                            onChange={handleTerritoryChange}
                            label="Service Territory"
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        maxHeight: 200,
                                        '&::-webkit-scrollbar': {
                                            width: '10px',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            backgroundColor: '#b5b5ba',
                                            borderRadius: '16px',
                                        },
                                    },
                                },
                            }}
                        >
                            {territoriesForSelectedMarket.map((territory) => (
                                <MenuItem key={territory.territory} value={territory.territory}>
                                    {territory.territory}
                                </MenuItem>
                            ))}
                        </Select>
                        {renderError('territory')}
                    </FormControl>

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 'calc(100% - 16px)',
                        }}
                    >
                        <Tooltip title='Search'>
                            <IconButton
                                onClick={handleSearch}
                                sx={{
                                    color: '#FFB800',
                                    '&:hover': {
                                        backgroundColor: '#FFE480',
                                        borderRadius: '50%',
                                    },
                                    padding: '8px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <SearchIcon style={{ fontSize: '32px' }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Second Row: Calendarization, Start Date, End Date */}
                {calendarizationFieldVisibility && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, marginBottom: 5 }}>
                        <FormControl fullWidth sx={{ width: { xs: "100%", sm: "250px" } }} disabled={locationsState.states.length === 0}>
                            <InputLabel
                                sx={{
                                    '&.Mui-focused': {
                                        color: 'black',
                                    },
                                }}
                            >
                                Calendarization
                            </InputLabel>
                            <Select
                                value={defaultCapacityFilterState.selectedCalendarization}
                                onChange={handleCalendarizationChange}
                                label="Calendarization"
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            maxHeight: 200,
                                            '&::-webkit-scrollbar': {
                                                width: '10px',
                                            },
                                            '&::-webkit-scrollbar-thumb': {
                                                backgroundColor: '#b5b5ba',
                                                borderRadius: '16px',
                                            },
                                        },
                                    },
                                }}
                            >
                                <MenuItem value='defaultView'>
                                    Default View
                                </MenuItem>
                                <MenuItem value='addCalendarization'>
                                    Add Calendarization
                                </MenuItem>
                                {calendarizationState.calendarization.map((cal) => (
                                    <MenuItem
                                        key={cal.custDateId}
                                        value={String(cal.custDateId)}
                                    >
                                        {getDateRange(cal.startDate, cal.endDate)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {showDateFields && (
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <Box sx={{ display: "flex", flexDirection: "column" }}>
                                    <DatePicker
                                        label="Start Date"
                                        value={defaultCapacityFilterState.startDate ? new Date(defaultCapacityFilterState.startDate) : null}
                                        onChange={handleStartDateChange}
                                        minDate={new Date()}
                                        maxDate={maxStartDate}
                                        slotProps={{
                                            textField: {
                                                sx: {
                                                    width: { xs: "100%", sm: "250px" },
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: '#ccc', // Normal border color
                                                        },
                                                        '&:hover fieldset': {
                                                            borderColor: '#ccc', // Normal border color on hover
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: '#ccc', // Normal border color when focused
                                                        },
                                                        '&.Mui-error fieldset': {
                                                            borderColor: '#ccc', // Override error state border color
                                                        },
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        color: '#000', // Normal label color
                                                    },
                                                    '& .MuiInputLabel-root.Mui-focused': {
                                                        color: '#000', // Normal label color when focused
                                                    },
                                                    '& .MuiInputLabel-root.Mui-error': {
                                                        color: '#000', // Override error state label color
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                    {renderError('startDate')}
                                </Box>
                                <Box sx={{ display: "flex", flexDirection: "column" }}>
                                    <DatePicker
                                        label="End Date"
                                        value={defaultCapacityFilterState.endDate ? new Date(defaultCapacityFilterState.endDate) : null}
                                        onChange={handleEndDateChange}
                                        minDate={defaultCapacityFilterState.startDate ?
                                            new Date(new Date(defaultCapacityFilterState.startDate).getTime() + 24 * 60 * 60 * 1000) :
                                            new Date()
                                        }
                                        disabled={!defaultCapacityFilterState.startDate}
                                        slotProps={{ textField: { sx: { width: { xs: "100%", sm: "250px" } } } }}
                                    />
                                    {renderError('endDate')}
                                </Box>
                            </LocalizationProvider>
                        )}
                    </Box>
                )}

                {/* Conflict Modal */}
                <Modal open={openConflictModal} onClose={handleCloseConflictModal}>
                    <Box
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: 400,
                            bgcolor: "background.paper",
                            border: "2px solid #000",
                            boxShadow: 24,
                            borderRadius: '20px',
                            p: 4,
                        }}
                    >
                        <Typography variant="h6" component="h2">
                            Date Range Conflict
                        </Typography>
                        <Typography sx={{ mt: 2 }}>{conflictMessage}</Typography>
                        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                            <Button onClick={handleCloseConflictModal} variant="contained" sx={{ backgroundColor: '#ffcc00', color: '#000000', fontWeight: 'bold' }}>
                                OK
                            </Button>
                        </Box>
                    </Box>
                </Modal>

                {/* Calendarization Change Confirmation Modal */}
                <Modal open={openCalendarizationChangeModal} onClose={handleCancelCalendarizationChange}>
                    <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, bgcolor: "background.paper", border: "2px solid #000", boxShadow: 24, borderRadius: '20px', p: 4 }}>
                        <Typography variant="h6" component="h2">Confirm Changes</Typography>
                        <Typography sx={{ mt: 2 }}>You have unsaved changes in the table. Changing the selection will discard these changes. Are you sure you want to proceed?</Typography>
                        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                            <Button onClick={handleCancelCalendarizationChange} variant="outlined" sx={{ borderColor: '#ffcc00', color: '#ffcc00', fontWeight: 'bold' }}>Cancel</Button>
                            <Button onClick={handleConfirmCalendarizationChange} variant="contained" sx={{ backgroundColor: '#ffcc00', color: '#000000', fontWeight: 'bold' }}>Proceed</Button>
                        </Box>
                    </Box>
                </Modal>
            </Box >
        </>
    )

}

export default DefaultCapacityFilter;