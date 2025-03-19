import React, { useState } from 'react';
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

    const truncateToTwoDecimals = (value: number): number => {
        return Math.floor(value * 100) / 100; // Truncate to 2 decimal places
    };

    const handleCellValueChange = (rowIndex: number, columnId: string, value: string, previousValue: number = 0) => {
        const newData = capacitySlotsData.map(row => ({
            ...row,
            days: { ...row.days },
        }));

        const numericValue = parseFloat(value);

        if (isNaN(numericValue) || value === '') {
            return; // Handled by onBlur
        }

        // Apply restrictions
        let finalValue = numericValue;
        if (numericValue < 0 || numericValue > 999) {
            finalValue = previousValue; // Revert to previous value for negative or > 999
        }

        const truncatedValue = truncateToTwoDecimals(finalValue); // Truncate to 2 decimal places
        newData[rowIndex] = {
            ...newData[rowIndex],
            days: { ...newData[rowIndex].days, [columnId]: truncatedValue },
        };

        // Update "Territory Level" row sum
        if (columnId !== 'capacityStream') {
            const territoryRow = newData.find((row) => row.capacityStream === "Territory Level");
            if (territoryRow) {
                const sum = newData
                    .filter((row) => !row.isDisabled)
                    .reduce((acc, row) => {
                        const value = row.days?.[columnId as keyof typeof row.days] || 0;
                        return acc + value;
                    }, 0);
                const truncatedSum = truncateToTwoDecimals(sum); // Truncate sum to 2 decimal places
                territoryRow.days[columnId as keyof typeof territoryRow.days] = truncatedSum;
            }
        }

        // Update table data changes
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
                                    [columnId]: truncatedValue,
                                },
                            }
                            : change
                    )
                    : [
                        ...prevChanges.baseCapacityHours,
                        {
                            capacityStreamId,
                            days: { [columnId]: truncatedValue },
                        },
                    ];

            return {
                ...prevChanges,
                baseCapacityHours: updatedBaseCapacityHours,
            };
        });

        // Update table state
        updateDefaultCapacityTableState({
            tableData: {
                baseCapacityHours: newData,
                appointmentSlots: [...defaultCapacityTableState.tableData.appointmentSlots],
            },
        });
    };

    const handleBlur = (
        e: React.FocusEvent<HTMLInputElement>,
        cell: MRT_Cell<CapacityStreamRowData>,
        day: string,
        previousValue: number = 0
    ) => {
        const inputElement = e.currentTarget as HTMLInputElement;
        const inputValue = inputElement.value;

        if (isNaN(Number(inputValue)) || inputValue === '') {
            inputElement.value = String(previousValue); // Revert to previous value
        } else {
            const numericValue = parseFloat(inputValue);
            if (numericValue < 0 || numericValue > 999) {
                inputElement.value = String(previousValue); // Revert for negative or > 999
            } else {
                inputElement.value = String(truncateToTwoDecimals(numericValue)); // Truncate to 2 decimals
            }
        }

        handleCellValueChange(cell.row.index, day, inputElement.value, previousValue);
    };

    const validateInput = (value: string): boolean => {
        const numericValue = parseFloat(value);
        // Valid if it's a number and within range [0, 999]
        return /^\d*\.?\d*$/.test(value) && !isNaN(numericValue) && numericValue >= 0 && numericValue <= 999;
    };

    const columns: MRT_ColumnDef<CapacityStreamRowData>[] = [
        {
            accessorKey: 'capacityStream',
            header: 'Capacity Stream',
            enableEditing: false,
            size: 80,
            Cell: ({ cell }: { cell: MRT_Cell<CapacityStreamRowData> }) => {
                const value = cell.getValue<string>();
                return (
                    <div style={{ padding: '8px 16px' }}>
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
                const value = cell.row.original.days[day as keyof typeof cell.row.original.days] ?? 0; // Default to 0 if undefined
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
            muiEditTextFieldProps: ({ cell }: { cell: MRT_Cell<CapacityStreamRowData> }) => {
                const previousValue = cell.row.original.days[day as keyof typeof cell.row.original.days] ?? 0; // Default to 0 if undefined
                const [value, setValue] = useState<string>(String(previousValue));

                return {
                    type: 'text',
                    value: value,
                    inputProps: {
                        min: 0,
                        style: { padding: '8px 16px' },
                    },
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        const newValue = e.target.value;
                        setValue(newValue);
                        const isValid = validateInput(newValue);
                        e.target.style.border = isValid ? '1px solid #ccc' : '2px solid red';
                        e.target.style.fontWeight = isValid ? 'normal' : 'bold';
                        e.target.style.color = isValid ? 'black' : 'red';
                    },
                    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                        handleBlur(e, cell, day, previousValue);
                    },
                    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                            handleCellValueChange(cell.row.index, day, e.currentTarget.value, previousValue);
                        }
                    },
                    sx: {
                        '& .MuiInputBase-root': {
                            padding: '0 !important',
                        }
                    }
                };
            },
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