import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, Modal, Typography } from "@mui/material";
import BulkSubmissionIcon from '@mui/icons-material/Publish';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ReplayIcon from '@mui/icons-material/Replay';

import { DefaultCapacityTableState } from './DefaultCapacityTable.types';
import { DefaultCapacityFilterState, LocationsState } from '../DefaultCapacityFilter/DefaultCapacityFilter.types';
// import BulkTerritoriesSelection from '../BulkTerritoriesSelection/BulkTerritoriesSelection';
import Spinner from '../../common/Spinner/Spinner';
import '../../../index.css';
import CapacityStream from '../CapacityStreamTable/CapacityStreamTable';
import AppointmentSlotsTable from '../AppointmentSlotsTable/AppointmentSlotsTable';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { transformBaseCapacityHours } from '../../../utility/transformBaseCapacityHours';
import { transformAppointmentSlots } from '../../../utility/transformAppointmentSlots';
import { recalculateTerritoryLevel } from '../../../utility/recalculateTerritoryLevel ';

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
    // locationsState,
    defaultCapacityFilterState,
    initialData,
    setInitialData
}) => {
    console.log('DefaultCapacityTable');
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [openResetModal, setOpenResetModal] = useState<boolean>(false);
    const [openSubmitModal, setOpenSubmitModal] = useState<boolean>(false);
    // const [sidebarOpen, setSidebarOpen] = useState(false);

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

    const { data: capacityStream } = useSelector((state: RootState) => state.capacityStream);
    const { data: appointmentSlots } = useSelector((state: RootState) => state.appointmentSlots);

    const deleteIconDisabled = selectedCalendarization === "defaultView" || selectedCalendarization === "addCalendarization";

    // monitor changes to table data to enable/disable Reset button
    useEffect(() => {
        const hasDataChanged =
            JSON.stringify(defaultCapacityTableState.tableData) !== JSON.stringify(initialData);
        setIsTableDataEdited(hasDataChanged);
    }, [defaultCapacityTableState.tableData, initialData, setIsTableDataEdited]);

    const handleDeleteClick = () => {
        if (!deleteIconDisabled) {
            setOpenDeleteModal(true); // Show delete confirmation modal
        }
    };

    const handleConfirmDelete = () => {
        // Implement delete logic here (e.g., clear data or call an API)
        setShowDefaultCapacityTable(false);
        setOpenDeleteModal(false);
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
        setIsTableDataEdited(false);
        console.log('Data deleted');
    };

    const handleCancelDelete = () => {
        setOpenDeleteModal(false);
    };

    const handleResetClick = () => {
        if (isTableDataEdited) {
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
    };

    const handleCancelReset = () => {
        setOpenResetModal(false);
    };

    // const handleSidebarOpen = () => {
    //     setSidebarOpen(true);
    // };

    // const handleSidebarClose = () => {
    //     setSidebarOpen(false);
    // };

    const handleSubmitClick = () => {
        // Perform submit logic here
        console.log('checking submit data: ', tableDataChanges);
        setInitialData({
            baseCapacityHours: defaultCapacityTableState.tableData.baseCapacityHours,
            appointmentSlots: defaultCapacityTableState.tableData.appointmentSlots,
        });
        setTableDataChanges({ baseCapacityHours: [], appointmentSlots: [] });
        setIsTableDataEdited(false);
        setOpenSubmitModal(true);
    };

    return (
        <>
            {defaultCapacityTableState.isLoading && <Spinner />}
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
                                disabled={!isTableDataEdited}
                                sx={{
                                    '&:disabled svg': { color: '#d3d3d3' },
                                    '&:not(:disabled) svg': { color: '#ffcc00' },
                                }}
                            >
                                <ReplayIcon sx={{ color: '#ffcc00' }} />
                            </IconButton>
                            <IconButton
                                // onClick={handleSidebarOpen}
                                disabled={true}
                                sx={{
                                    '&:disabled svg': { color: '#d3d3d3' },
                                    '&:not(:disabled) svg': { color: '#ffcc00' },
                                }}
                            >
                                <BulkSubmissionIcon sx={{ color: '#ffcc00' }} />
                                {/* <BulkTerritoriesSelection
                                    open={sidebarOpen}
                                    onClose={handleSidebarClose}
                                    locationsData={locationsState.states}
                                /> */}
                            </IconButton>
                            <IconButton
                                disabled={!isTableDataEdited}
                                onClick={handleSubmitClick}
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
                                <CapacityStream
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
                <Modal open={openSubmitModal} onClose={() => setOpenSubmitModal(false)}>
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
                            Submission Successful
                        </Typography>
                        <Typography sx={{ mt: 2 }}>
                            Your changes have been successfully submitted.
                        </Typography>
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => setOpenSubmitModal(false)}
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