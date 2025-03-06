import React from 'react';
import { MaterialReactTable, MRT_Cell, MRT_ColumnDef } from 'material-react-table';
import { DefaultCapacityTableState, CapacityStreamRowData } from '../DefaultCapacityTable/DefaultCapacityTable.types';
import { Typography } from '@mui/material';

type CapacityStreamTableProps = {
    capacitySlotsData: CapacityStreamRowData[];
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

const CapacityStreamTable: React.FC<CapacityStreamTableProps> = ({ capacitySlotsData, defaultCapacityTableState, updateDefaultCapacityTableState, startDate, endDate, setTableDataChanges }) => {
    console.log('CapacityStreamTable');
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

    const enabledDays: string[] = startDate && endDate ? getDaysInRange(new Date(startDate), new Date(endDate)) : daysOfWeek;

    // const handleCellValueChange = (rowIndex: number, columnId: string, value: string) => {
    //     const newData = [...capacitySlotsData];
    //     const numericValue = parseFloat(value);

    //     if (!isNaN(numericValue)) {
    //         const roundedValue = Math.round(numericValue * 100) / 100;
    //         newData[rowIndex] = {
    //             ...newData[rowIndex],
    //             days: { ...newData[rowIndex].days, [columnId]: roundedValue },
    //         };

    //         // Update the "Territory Level" row sum for the edited column
    //         if (columnId !== 'capacityStream') {
    //             const territoryRow = newData.find((row) => row.capacityStream === "Territory Level");
    //             if (territoryRow) {
    //                 const sum = newData
    //                     .filter((row) => !row.isDisabled)
    //                     .reduce((acc, row) => {
    //                         const value = row.days?.[columnId as keyof typeof row.days] || 0;
    //                         return acc + value;
    //                     }, 0);
    //                 const roundedValue = Math.round(sum * 100) / 100;
    //                 territoryRow.days[columnId as keyof typeof territoryRow.days] = roundedValue;
    //             }
    //         }

    //         updateDefaultCapacityTableState({
    //             tableData: {
    //                 baseCapacityHours: newData,
    //                 appointmentSlots: defaultCapacityTableState.tableData.appointmentSlots
    //             }
    //         });
    //     }
    // };

    const handleCellValueChange = (rowIndex: number, columnId: string, value: string) => {
        const newData = [...capacitySlotsData];
        const numericValue = parseFloat(value);

        if (!isNaN(numericValue)) {
            const roundedValue = Math.round(numericValue * 100) / 100;
            newData[rowIndex] = {
                ...newData[rowIndex],
                days: { ...newData[rowIndex].days, [columnId]: roundedValue },
            };

            // Update the "Territory Level" row sum for the edited column
            if (columnId !== 'capacityStream') {
                const territoryRow = newData.find((row) => row.capacityStream === "Territory Level");
                if (territoryRow) {
                    const sum = newData
                        .filter((row) => !row.isDisabled)
                        .reduce((acc, row) => {
                            const value = row.days?.[columnId as keyof typeof row.days] || 0;
                            return acc + value;
                        }, 0);
                    const roundedValue = Math.round(sum * 100) / 100;
                    territoryRow.days[columnId as keyof typeof territoryRow.days] = roundedValue;
                }
            }

            // Update the changes state
            setTableDataChanges((prevChanges) => {
                const capacityStreamId = newData[rowIndex].csId;
                if (capacityStreamId === undefined) {
                    throw new Error("capacityStreamId is undefined");
                }

                const existingChangeIndex = prevChanges.baseCapacityHours.findIndex(
                    (change) => change.capacityStreamId === capacityStreamId
                );

                const updatedBaseCapacityHours =
                    existingChangeIndex !== -1
                        ? prevChanges.baseCapacityHours.map((change, index) =>
                            index === existingChangeIndex
                                ? {
                                    ...change,
                                    days: {
                                        ...change.days,
                                        [columnId]: roundedValue,
                                    },
                                }
                                : change
                        )
                        : [
                            ...prevChanges.baseCapacityHours,
                            {
                                capacityStreamId, // Ensure this is a number
                                days: { [columnId]: roundedValue },
                            },
                        ];

                return {
                    ...prevChanges, // Preserve the existing appointmentSlots
                    baseCapacityHours: updatedBaseCapacityHours,
                };
            });

            updateDefaultCapacityTableState({
                tableData: {
                    baseCapacityHours: newData,
                    appointmentSlots: defaultCapacityTableState.tableData.appointmentSlots,
                },
            });
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>, cell: MRT_Cell<CapacityStreamRowData>, day: string) => {
        const inputElement = e.currentTarget as HTMLInputElement;

        if (isNaN(Number(inputElement.value)) || inputElement.value === '') {
            inputElement.value = String(cell.row.original.days[day as keyof typeof cell.row.original.days]);
        }

        handleCellValueChange(cell.row.index, day, inputElement.value);
    };

    const validateInput = (value: string): boolean => {
        return /^\d*\.?\d*$/.test(value);
    };

    const columns: MRT_ColumnDef<CapacityStreamRowData>[] = [
        {
            accessorKey: 'capacityStream', // Changed from 'category'
            header: 'Capacity Stream', // Updated header name
            enableEditing: false,
            size: 80,
            Cell: ({ cell }: { cell: MRT_Cell<CapacityStreamRowData> }) => {
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
        ...daysOfWeek.map((day) => ({
            accessorKey: `day.${day}`,
            header: day.slice(0, 1).toUpperCase() + day.slice(1, 3).toLowerCase(),
            enableEditing: (row: { original: CapacityStreamRowData }) => !row.original.isDisabled && enabledDays.includes(day),
            size: 50,
            Cell: ({ cell }: { cell: MRT_Cell<CapacityStreamRowData> }) => {
                const value = cell.row.original.days[day as keyof typeof cell.row.original.days];
                const isDisabled = cell.row.original.isDisabled || !enabledDays.includes(day);

                return (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        width: '100%',
                        backgroundColor: isDisabled ? 'lightgray' : 'transparent',
                        padding: 0,
                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                    }}>
                        {value}
                    </div>
                );
            },
            muiEditTextFieldProps: ({ cell }: { cell: MRT_Cell<CapacityStreamRowData> }) => ({
                type: 'text',
                inputProps: {
                    min: 0,
                    style: { padding: '8px 16px' },
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        const isValid = validateInput(e.target.value);
                        e.target.style.border = isValid ? '1px solid #ccc' : '2px solid red';
                        e.target.style.fontWeight = isValid ? 'normal' : 'bold';
                        e.target.style.color = isValid ? 'black' : 'red';
                    }
                },
                onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                    handleBlur(e, cell, day);
                },
                onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                        handleCellValueChange(cell.row.index, day, e.currentTarget.value);
                    }
                },
                sx: {
                    '& .MuiInputBase-root': {
                        padding: '0 !important',
                    }
                }
            }),
        })),
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Typography variant='h6' sx={{ color: '#000000', fontWeight: 'normal' }}>
                Default Capacity Hours
            </Typography>
            <MaterialReactTable
                columns={columns}
                data={capacitySlotsData}
                enableRowActions={false}
                enableEditing
                enableColumnActions={false}
                enableColumnFilters={false}
                enablePagination={false}
                enableSorting={false}
                enableBottomToolbar={false}
                enableTopToolbar={false}
                editDisplayMode="cell"
                muiTableBodyCellProps={
                    () => ({
                        onClick: (e) => {
                            e.stopPropagation();
                            const cellElement = e.currentTarget as HTMLElement;
                            cellElement.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
                        },
                        sx: {
                            padding: 0,
                            borderRight: '1px solid rgba(224, 224, 224, 1)',
                            '&:last-child': {
                                borderRight: 'none',
                            },
                            height: '48px',
                        }
                    })
                }
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
                muiTableBodyRowProps={({ row }) => ({
                    sx: {
                        backgroundColor: row.original.capacityStream === 'Territory Level' ? 'lightgray' : 'transparent',
                        '&:last-child td': {
                            borderBottom: 'none',
                        }
                    }
                })}
            />
        </div>
    );
};

export default CapacityStreamTable;