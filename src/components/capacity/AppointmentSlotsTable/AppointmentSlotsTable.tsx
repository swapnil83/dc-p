import React from 'react';
import { MaterialReactTable, MRT_Cell, MRT_ColumnDef } from 'material-react-table';
import CancelIcon from '@mui/icons-material/Cancel';
import { AppointmentSlotsRowData, DefaultCapacityTableState } from '../DefaultCapacityTable/DefaultCapacityTable.types';
import { Typography } from '@mui/material';

type AppointmentSlotsTableProps = {
    appointmentFreezeData: AppointmentSlotsRowData[];
    defaultCapacityTableState: DefaultCapacityTableState;
    updateDefaultCapacityTableState: (newState: Partial<DefaultCapacityTableState>) => void;
    startDate: string | null;
    endDate: string | null;
    setTableDataChanges: React.Dispatch<
        React.SetStateAction<{
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
        }>
    >;
};

const AppointmentSlotsTable: React.FC<AppointmentSlotsTableProps> = ({ appointmentFreezeData, defaultCapacityTableState, updateDefaultCapacityTableState, startDate, endDate, setTableDataChanges }) => {
    console.log('AppointmentSlotsTable');
    // Updated to uppercase day names
    const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    const getDayToKeyMap: { [key: number]: string } = {
        0: 'SUNDAY',
        1: 'MONDAY',
        2: 'TUESDAY',
        3: 'WEDNESDAY',
        4: 'THURSDAY',
        5: 'FRIDAY',
        6: 'SATURDAY',
    };

    const getDaysInRange = (start: Date, end: Date): string[] => {
        const days: string[] = [];
        const currentDate = new Date(start);
        while (currentDate <= end) {
            const dayOfWeek = getDayToKeyMap[currentDate.getDay()];
            if (!days.includes(dayOfWeek)) {
                days.push(dayOfWeek);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return days;
    };

    const enabledDays: string[] = startDate && endDate
        ? getDaysInRange(new Date(startDate), new Date(endDate))
        : daysOfWeek;

    // const handleCellValueChange = (rowIndex: number, columnId: string, value: boolean) => {
    //     const newData = [...appointmentFreezeData];
    //     const currentRow = newData[rowIndex];

    //     // Safely access `days` and provide a fallback if it's undefined
    //     const currentDays = currentRow.days || {};

    //     newData[rowIndex] = {
    //         ...currentRow,
    //         days: {
    //             ...Object.fromEntries(
    //                 daysOfWeek.map(day => [day, currentDays[day as keyof typeof currentDays] ?? false])
    //             ) as Record<string, boolean>,
    //             [columnId]: value,
    //         },
    //     };

    //     updateDefaultCapacityTableState({
    //         tableData: {
    //             baseCapacityHours: defaultCapacityTableState.tableData.baseCapacityHours,
    //             appointmentSlots: newData
    //         }
    //     });
    // };

    const handleCellValueChange = (rowIndex: number, columnId: string, value: boolean) => {
        const newData = [...appointmentFreezeData];
        const currentRow = newData[rowIndex];

        // Safely access `days` and provide a fallback if it's undefined
        const currentDays = currentRow.days || {};

        newData[rowIndex] = {
            ...currentRow,
            days: {
                ...Object.fromEntries(
                    daysOfWeek.map((day) => [day, currentDays[day as keyof typeof currentDays] ?? false])
                ) as Record<string, boolean>,
                [columnId]: value,
            },
        };

        // Update the changes state
        setTableDataChanges((prevChanges) => {
            const capacityStreamId = currentRow.csId;
            const startTime = currentRow.startTime;
            const endTime = currentRow.endTime;

            if (capacityStreamId === undefined || startTime === undefined || endTime === undefined) {
                throw new Error("Required properties (capacityStreamId, startTime, or endTime) are undefined");
            }

            const existingChangeIndex = prevChanges.appointmentSlots.findIndex(
                (change) =>
                    change.capacityStreamId === capacityStreamId &&
                    change.startTime === startTime &&
                    change.endTime === endTime
            );

            const updatedAppointmentSlots =
                existingChangeIndex !== -1
                    ? prevChanges.appointmentSlots.map((change, index) =>
                        index === existingChangeIndex
                            ? {
                                ...change,
                                days: {
                                    ...change.days,
                                    [columnId]: value,
                                },
                            }
                            : change
                    )
                    : [
                        ...prevChanges.appointmentSlots,
                        {
                            capacityStreamId,
                            startTime,
                            endTime,
                            days: { [columnId]: value },
                        },
                    ];

            return {
                ...prevChanges, // Preserve the existing baseCapacityHours
                appointmentSlots: updatedAppointmentSlots,
            };
        });

        updateDefaultCapacityTableState({
            tableData: {
                baseCapacityHours: defaultCapacityTableState.tableData.baseCapacityHours,
                appointmentSlots: newData,
            },
        });
    };

    const columns: MRT_ColumnDef<AppointmentSlotsRowData>[] = [
        {
            accessorKey: 'capacityStream', // Changed from 'product'
            header: 'Capacity Stream', // Updated header name
            enableEditing: false,
            size: 80,
            Cell: ({ cell }: { cell: MRT_Cell<AppointmentSlotsRowData> }) => {
                const value = cell.getValue<string>();
                return (
                    <div style={{
                        padding: '8px 16px',
                    }}>
                        {value}
                    </div>
                );
            },
        },
        {
            accessorKey: 'startTime',
            header: 'Start Time',
            enableEditing: false,
            size: 50,
            Cell: ({ cell }: { cell: MRT_Cell<AppointmentSlotsRowData> }) => {
                const value = cell.getValue<string>();
                return (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        width: '100%',
                        color: 'gray',
                        backgroundColor: 'lightgray',
                        padding: 0,
                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                    }}>
                        {value}
                    </div>
                );
            },
        },
        {
            accessorKey: 'endTime',
            header: 'End Time',
            enableEditing: false,
            size: 50,
            Cell: ({ cell }: { cell: MRT_Cell<AppointmentSlotsRowData> }) => {
                const value = cell.getValue<string>();
                return (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        width: '100%',
                        color: 'gray',
                        backgroundColor: 'lightgray',
                        padding: 0,
                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                    }}>
                        {value}
                    </div>
                );
            },
        },
        ...daysOfWeek.map((day) => ({
            accessorKey: `day.${day}`,
            header: day.slice(0, 1).toUpperCase() + day.slice(1, 3).toLowerCase(),
            enableEditing: (row: { original: AppointmentSlotsRowData }) => !row.original.isDisabled && enabledDays.includes(day),
            size: 50,
            Cell: ({ cell }: { cell: MRT_Cell<AppointmentSlotsRowData> }) => {
                const value = cell.row.original.days[day as keyof typeof cell.row.original.days];
                const isDisabled = cell.row.original.isDisabled || !enabledDays.includes(day);

                return (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            width: '100%',
                            backgroundColor: isDisabled ? 'lightgray' : value ? '#ffffff' : 'transparent',
                            padding: 0,
                            borderRight: '1px solid rgba(224, 224, 224, 1)',
                        }}
                        onClick={() => {
                            if (!isDisabled) {
                                handleCellValueChange(cell.row.index, day, !value);
                            }
                        }}
                    >
                        {!value ? null : <CancelIcon style={{ color: 'red' }} />}
                    </div>
                );
            },
        })),
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Typography variant='h6' sx={{ color: '#000000', fontWeight: 'normal' }}>
                Appointment Freeze Window
            </Typography>
            <MaterialReactTable
                columns={columns}
                data={appointmentFreezeData}
                enableRowActions={false}
                enableEditing
                enableColumnActions={false}
                enableColumnFilters={false}
                enablePagination={false}
                enableSorting={false}
                enableBottomToolbar={false}
                enableTopToolbar={false}
                editDisplayMode="cell"
                muiTableBodyCellProps={{
                    sx: {
                        padding: 0,
                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                        '&:last-child': {
                            borderRight: 'none',
                        },
                        height: '48px',
                    }
                }}
                muiTableHeadCellProps={{
                    sx: {
                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                        '&:last-child': {
                            borderRight: 'none'
                        },
                        backgroundColor: '#ffcc00',
                        padding: '8px 16px',
                    }
                }}
                muiTableBodyRowProps={{
                    sx: {
                        '&:last-child td': {
                            borderBottom: 'none',
                        }
                    }
                }}
            />
        </div>
    );
};

export default AppointmentSlotsTable;