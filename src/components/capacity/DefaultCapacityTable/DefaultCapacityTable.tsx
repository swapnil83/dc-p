import React, { useEffect, useState, Fragment } from 'react';
import { Box, Button, IconButton, Modal, Typography } from "@mui/material";
import BulkSubmissionIcon from '@mui/icons-material/Publish';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ReplayIcon from '@mui/icons-material/Replay';

import '../../../index.css';
import { DefaultCapacityTableState, DefaultCapacityViewResponse } from './DefaultCapacityTable.types';
import { DefaultCapacityFilterState, LocationsState } from '../DefaultCapacityFilter/DefaultCapacityFilter.types';
import BulkTerritoriesSelection from '../BulkTerritoriesSelection/BulkTerritoriesSelection';
import CapacityStreamTable from '../CapacityStreamTable/CapacityStreamTable';
import AppointmentSlotsTable from '../AppointmentSlotsTable/AppointmentSlotsTable';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { transformBaseCapacityHours } from '../../../utility/transformBaseCapacityHours';
import { transformAppointmentSlots } from '../../../utility/transformAppointmentSlots';
import { recalculateTerritoryLevel } from '../../../utility/recalculateTerritoryLevel ';
import axiosInstance from '../../../api/axiosInstance';

type DefaultCapacityTableProps = {
    startDate: string | null;
    endDate: string | null;
    selectedCalendarization: string;
    defaultCapacityTableState: DefaultCapacityTableState;
    updateDefaultCapacityTableState: (newState: Partial<DefaultCapacityTableState>) => void;
    setShowDefaultCapacityTable: React.Dispatch<React.SetStateAction<boolean>>;
    isTableDataEdited: boolean;
    setIsTableDataEdited: React.Dispatch<React.SetStateAction<boolean>>;
    locationsState: LocationsState;
    defaultCapacityFilterState: DefaultCapacityFilterState;
    initialData: DefaultCapacityTableState["tableData"];
    setInitialData: React.Dispatch<React.SetStateAction<DefaultCapacityTableState["tableData"]>>;
    onCalendarizationUpdate: (preserveSelectedCalendarization: boolean) => void;
};

const DefaultCapacityTable: React.FC<DefaultCapacityTableProps> = ({
    startDate,
    endDate,
    selectedCalendarization,
    defaultCapacityTableState,
    updateDefaultCapacityTableState,
    setShowDefaultCapacityTable,
    isTableDataEdited,
    setIsTableDataEdited,
    locationsState,
    defaultCapacityFilterState,
    initialData,
    setInitialData,
    onCalendarizationUpdate,
}) => {
    console.log('DefaultCapacityTable');
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [openResetModal, setOpenResetModal] = useState<boolean>(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [responseSidebarOpen, setResponseSidebarOpen] = useState(false);
    const [bulkUpdateResponses, setBulkUpdateResponses] = useState<DefaultCapacityViewResponse[]>([]);
    const [resetButtonEnabled, setResetButtonEnabled] = useState<boolean>(false);

    const [tableDataChanges, setTableDataChanges] = useState<{
        baseCapacityHours: Array<{
            capacityStreamId: number;
            days: Record<string, number>;
        }>;
        appointmentSlots: Array<{
            capacityStreamId: number;
            startTime: string;
            endTime: string;
            days: Record<string, boolean>;
        }>;
    }>({
        baseCapacityHours: [],
        appointmentSlots: [],
    });

    const [responseModal, setResponseModal] = useState<{
        open: boolean;
        message: string;
        territory?: string; // Territory from the response
    }>({
        open: false,
        message: '',
        territory: undefined,
    });

    const [deleteResponseModal, setDeleteResponseModal] = useState<{
        open: boolean;
        message: string;
        territory?: string;
    }>({
        open: false,
        message: '',
        territory: undefined,
    });

    const { data: capacityStream } = useSelector((state: RootState) => state.capacityStream);
    const { data: appointmentSlots } = useSelector((state: RootState) => state.appointmentSlots);

    const deleteIconDisabled = selectedCalendarization === "addCalendarization";
    const isDefaultOrAdd = selectedCalendarization === "defaultView" || selectedCalendarization === "addCalendarization";

    useEffect(() => {
        const hasDataChanged = JSON.stringify(defaultCapacityTableState.tableData) !== JSON.stringify(initialData);
        setResetButtonEnabled(hasDataChanged);
        setIsTableDataEdited(hasDataChanged);
    }, [defaultCapacityTableState.tableData, initialData]);

    const handleDeleteClick = () => {
        if (!deleteIconDisabled) {
            setOpenDeleteModal(true); // Show delete confirmation modal
        }
    };

    const handleCancelDelete = () => {
        setOpenDeleteModal(false);
    };

    const handleResetClick = () => {
        if (resetButtonEnabled) {
            setOpenResetModal(true);
        }
    };

    const handleConfirmReset = () => {
        const resetData = {
            baseCapacityHours: recalculateTerritoryLevel(initialData.baseCapacityHours),
            appointmentSlots: initialData.appointmentSlots,
        };

        updateDefaultCapacityTableState({ tableData: resetData });
        setTableDataChanges({ baseCapacityHours: [], appointmentSlots: [] });
        setOpenResetModal(false);
        setIsTableDataEdited(false);
        setResetButtonEnabled(false);
    };

    const handleCancelReset = () => {
        setOpenResetModal(false);
    };

    const handleSidebarOpen = () => {
        setSidebarOpen(true);
    };

    const handleSidebarClose = () => {
        setSidebarOpen(false);
    };

    const handleResponseSidebarClose = () => {
        setResponseSidebarOpen(false);
        setBulkUpdateResponses([]);
    };

    const handleSubmitClick = async (bulkTerritoriesId: number[] = []) => {
        let requestBody;

        if (isDefaultOrAdd) {
            const filteredBaseCapacityHours = defaultCapacityTableState.tableData.baseCapacityHours.filter(
                row => row.capacityStream !== "Territory Level"
            );

            requestBody = {
                serviceTerritory: defaultCapacityFilterState.selectedTerritoryId,
                customDateId: defaultCapacityFilterState.selectedCustDateId,
                calendarization: defaultCapacityFilterState.selectedCalendarization,
                startDate: defaultCapacityFilterState.startDate,
                endDate: defaultCapacityFilterState.endDate,
                username: 'swapnil@g.com',
                bulkTerritories: bulkTerritoriesId,
                baseCapacityHours: filteredBaseCapacityHours.map(row => ({
                    capacityStreamId: row.csId,
                    days: row.days,
                })),
                appointmentSlots: defaultCapacityTableState.tableData.appointmentSlots.map(row => ({
                    capacityStreamId: row.csId,
                    startTime: row.startTime,
                    endTime: row.endTime,
                    days: row.days,
                })),
            };
        } else {
            requestBody = {
                serviceTerritory: defaultCapacityFilterState.selectedTerritoryId,
                customDateId: defaultCapacityFilterState.selectedCustDateId,
                calendarization: defaultCapacityFilterState.selectedCalendarization,
                startDate: defaultCapacityFilterState.startDate,
                endDate: defaultCapacityFilterState.endDate,
                username: 'swapnil@g.com',
                bulkTerritories: bulkTerritoriesId,
                baseCapacityHours: tableDataChanges.baseCapacityHours,
                appointmentSlots: tableDataChanges.appointmentSlots,
            };
        }

        try {
            const data = await axiosInstance.post(
                'http://localhost:3000/updateServiceTerritoryCapacityHours',
                requestBody,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const response: any = data.data;

            if (response.baseResponse.responseStatus === 'Success' || response.baseResponse.responseStatus === 'Partial Success') {
                setInitialData({
                    baseCapacityHours: defaultCapacityTableState.tableData.baseCapacityHours,
                    appointmentSlots: defaultCapacityTableState.tableData.appointmentSlots,
                });
                setTableDataChanges({ baseCapacityHours: [], appointmentSlots: [] });
                setIsTableDataEdited(false);
                setResetButtonEnabled(false);

                if (bulkTerritoriesId.length > 0) {

                    // Check if defaultCapacaityViewResponses has objects and at least one has message: "Failure"
                    const hasFailures = Array.isArray(response.defaultCapacaityViewResponses) &&
                        response.defaultCapacaityViewResponses.length > 0 &&
                        response.defaultCapacaityViewResponses.some((item: DefaultCapacityViewResponse) => item.message.startsWith("Failure"));

                    if (hasFailures) {
                        // Show response view in the existing sidebar if there are failures
                        setBulkUpdateResponses(response.defaultCapacaityViewResponses || []);
                        setSidebarOpen(false);
                        setResponseSidebarOpen(true);
                    } else {
                        // Show success modal if there are no failures
                        setResponseModal({
                            open: true,
                            message: 'Bulk update completed successfully with no failures.',
                            territory: undefined,
                        });
                        setSidebarOpen(false);
                    }
                } else {
                    const serviceTerritoryName = response.defaultCapacaityViewResponses[0]?.serviceTerritory || 'Unknown Territory';

                    // Show success modal with territory
                    setResponseModal({
                        open: true,
                        message: 'Your changes have been successfully submitted.',
                        territory: serviceTerritoryName, // Assuming the response contains the territory
                    });
                }

                // Call the callback to re-fetch calendarization data
                if (onCalendarizationUpdate) {
                    onCalendarizationUpdate(true); // Pass `true` to preserve the selected calendarization
                }
            } else {
                // Show error modal
                setResponseModal({
                    open: true,
                    message: response.baseResponse.message || 'An unknown error occurred.',
                });
            }
        } catch (error) {
            // Show error modal
            setResponseModal({
                open: true,
                message: 'Failed to submit changes. Please try again later.',
            });
        }
    };

    const handleConfirmDelete = async () => {
        try {
            const data = await axiosInstance.delete(
                `http://localhost:3000/deleteCapacityData?custDateId=${defaultCapacityFilterState.selectedCustDateId}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            const response: any = data.data;

            if (response.baseResponse.responseStatus === 'Success') {
                const territoryName = defaultCapacityFilterState.selectedTerritory;
                setDeleteResponseModal({
                    open: true,
                    message: response.baseResponse.message || 'Data has been successfully deleted.',
                    territory: territoryName,
                });

                const initialBaseCapacityHours = transformBaseCapacityHours(capacityStream.capacityStream);
                const initialAppointmentSlots = transformAppointmentSlots(appointmentSlots.serviceTerritories, capacityStream.capacityStream, defaultCapacityFilterState.selectedTerritoryId);

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

                setIsTableDataEdited(false);
                setResetButtonEnabled(false);
                setOpenDeleteModal(false);

                if (onCalendarizationUpdate) {
                    onCalendarizationUpdate(false);
                }
            } else {
                setDeleteResponseModal({
                    open: true,
                    message: response.baseResponse.message || 'An unknown error occurred.',
                });
            }
        } catch (error) {
            setDeleteResponseModal({
                open: true,
                message: 'Failed to submit changes. Please try again later.',
            });
        }
    };

    return (
        <>
            <Box>
                {(defaultCapacityTableState.status === 'failure') && (
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
                        {`API Error: ${defaultCapacityTableState.errorMessage}`}
                    </Box>
                )}
                <div
                    style={{
                        margin: '40px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '50px',
                        padding: '20px',
                        border: '1px solid #000',
                        borderRadius: '4px'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 'bold',
                                color: '#000',
                            }}
                        >
                            {selectedCalendarization === "defaultView"
                                ? "Viewing Default Capacity Data"
                                : selectedCalendarization === "addCalendarization"
                                    ? "Adding New Calendarization"
                                    : `Viewing Calendarization Data for "${startDate} - ${endDate}"`
                            }
                        </Typography>
                        <div
                            style={{
                                display: 'flex',
                                gap: '10px'
                            }}
                        >
                            <IconButton
                                onClick={handleResetClick}
                                disabled={!resetButtonEnabled}
                                sx={{
                                    '&:disabled svg': { color: '#d3d3d3' },
                                    '&:not(:disabled) svg': { color: '#ffcc00' },
                                }}
                            >
                                <ReplayIcon sx={{ color: '#ffcc00' }} />
                            </IconButton>
                            <Fragment>
                                <IconButton
                                    onClick={handleSidebarOpen}
                                    sx={{
                                        '&:disabled svg': { color: '#d3d3d3' },
                                        '&:not(:disabled) svg': { color: '#ffcc00' },
                                    }}
                                >
                                    <BulkSubmissionIcon sx={{ color: '#ffcc00' }} />
                                </IconButton>
                                <BulkTerritoriesSelection
                                    open={sidebarOpen}
                                    onClose={handleSidebarClose}
                                    locationsData={locationsState.states}
                                    defaultCapacityFilterState={defaultCapacityFilterState}
                                    handleSubmitClick={handleSubmitClick}
                                />
                                <BulkTerritoriesSelection
                                    open={responseSidebarOpen}
                                    onClose={handleResponseSidebarClose}
                                    locationsData={locationsState.states}
                                    defaultCapacityFilterState={defaultCapacityFilterState}
                                    handleSubmitClick={handleSubmitClick}
                                    isResponseView={true}
                                    responseData={bulkUpdateResponses}
                                />
                            </Fragment>
                            <IconButton
                                disabled={!isDefaultOrAdd && !isTableDataEdited}
                                onClick={() => handleSubmitClick()}
                                sx={{
                                    '&:disabled svg': { color: '#d3d3d3' },
                                    '&:not(:disabled) svg': { color: '#ffcc00' },
                                }}
                            >
                                <SaveIcon sx={{ color: '#ffcc00' }} />
                            </IconButton>
                            <IconButton
                                disabled={deleteIconDisabled}
                                onClick={handleDeleteClick}
                                sx={{
                                    '&:disabled svg': {
                                        color: '#d3d3d3',
                                    },
                                    '&:not(:disabled) svg': {
                                        color: '#ffcc00',
                                    },
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </div>
                    </div>
                    <div
                        className='table-container'
                        style={{
                            display: 'flex',
                            overflow: 'auto',
                            gap: '50px',
                            paddingInline: '10px',
                        }}
                    >
                        <div style={{ flex: '0 0 auto', minWidth: '800px' }}>
                            {
                                defaultCapacityTableState.tableData.baseCapacityHours.length !== 0 &&
                                <CapacityStreamTable
                                    capacitySlotsData={defaultCapacityTableState.tableData?.baseCapacityHours}
                                    defaultCapacityTableState={defaultCapacityTableState}
                                    updateDefaultCapacityTableState={updateDefaultCapacityTableState}
                                    startDate={startDate}
                                    endDate={endDate}
                                    setTableDataChanges={setTableDataChanges}
                                />
                            }
                        </div>
                        <div style={{ flex: '0 0 auto', minWidth: '600px' }}>
                            {
                                defaultCapacityTableState.tableData.appointmentSlots.length !== 0 &&
                                <AppointmentSlotsTable
                                    appointmentFreezeData={defaultCapacityTableState.tableData?.appointmentSlots}
                                    defaultCapacityTableState={defaultCapacityTableState}
                                    updateDefaultCapacityTableState={updateDefaultCapacityTableState}
                                    startDate={startDate}
                                    endDate={endDate}
                                    setTableDataChanges={setTableDataChanges}
                                />
                            }
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <Modal open={openDeleteModal} onClose={handleCancelDelete}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 400,
                            bgcolor: 'background.paper',
                            border: '2px solid #000',
                            boxShadow: 24,
                            borderRadius: '20px',
                            p: 4,
                        }}
                    >
                        <Typography variant="h6" component="h2">
                            Confirm Deletion
                        </Typography>
                        <Typography sx={{ mt: 2 }}>
                            Are you sure you want to delete the data? This action cannot be undone.
                        </Typography>
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                onClick={handleCancelDelete}
                                variant="outlined"
                                sx={{ borderColor: '#ffcc00', color: '#ffcc00', fontWeight: 'bold' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmDelete}
                                variant="contained"
                                sx={{ backgroundColor: '#ffcc00', color: '#000000', fontWeight: 'bold' }}
                            >
                                Delete
                            </Button>
                        </Box>
                    </Box>
                </Modal>

                {/* Reset Confirmation Modal */}
                <Modal open={openResetModal} onClose={handleCancelReset}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 400,
                            bgcolor: 'background.paper',
                            border: '2px solid #000',
                            boxShadow: 24,
                            borderRadius: '20px',
                            p: 4,
                        }}
                    >
                        <Typography variant="h6" component="h2">
                            Confirm Reset
                        </Typography>
                        <Typography sx={{ mt: 2 }}>
                            Are you sure you want to reset the data to its initial state? All changes will be lost.
                        </Typography>
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                onClick={handleCancelReset}
                                variant="outlined"
                                sx={{ borderColor: '#ffcc00', color: '#ffcc00', fontWeight: 'bold' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmReset}
                                variant="contained"
                                sx={{ backgroundColor: '#ffcc00', color: '#000000', fontWeight: 'bold' }}
                            >
                                Reset
                            </Button>
                        </Box>
                    </Box>
                </Modal>

                {/* Submit Success Modal */}
                <Modal open={responseModal.open} onClose={() => setResponseModal({ open: false, message: '' })}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 400,
                            bgcolor: 'background.paper',
                            border: '2px solid #000',
                            boxShadow: 24,
                            borderRadius: '20px',
                            p: 4,
                        }}
                    >
                        <Typography variant="h6" component="h2">
                            {responseModal.message.includes('success') ? 'Success' : 'Error'}
                        </Typography>
                        <Typography sx={{ mt: 2 }}>
                            {responseModal.message}
                            {responseModal.territory && (
                                <>
                                    <br />
                                    <strong>Territory:</strong> {responseModal.territory}
                                </>
                            )}
                        </Typography>
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => setResponseModal({ open: false, message: '' })}
                                variant="contained"
                                sx={{ backgroundColor: '#ffcc00', color: '#000000', fontWeight: 'bold' }}
                            >
                                Close
                            </Button>
                        </Box>
                    </Box>
                </Modal>

                {/* Delete Success/Error Modal */}
                <Modal open={deleteResponseModal.open} onClose={() => setDeleteResponseModal({ open: false, message: '' })}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 400,
                            bgcolor: 'background.paper',
                            border: '2px solid #000',
                            boxShadow: 24,
                            borderRadius: '20px',
                            p: 4,
                        }}
                    >
                        <Typography variant="h6" component="h2">
                            {deleteResponseModal.message.includes('record deleted successfully') ? 'Success' : 'Error'}
                        </Typography>
                        <Typography sx={{ mt: 2 }}>
                            {deleteResponseModal.message}
                            {deleteResponseModal.territory && (
                                <>
                                    <br />
                                    <strong>Territory:</strong> {deleteResponseModal.territory}
                                </>
                            )}
                        </Typography>
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => {
                                    setDeleteResponseModal({ open: false, message: '' });
                                    setShowDefaultCapacityTable(false);
                                }}
                                variant="contained"
                                sx={{ backgroundColor: '#ffcc00', color: '#000000', fontWeight: 'bold' }}
                            >
                                Close
                            </Button>
                        </Box>
                    </Box>
                </Modal>
            </Box>
        </>
    );
}

export default DefaultCapacityTable;