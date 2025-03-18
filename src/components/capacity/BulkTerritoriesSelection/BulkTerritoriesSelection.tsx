import React, { useState, useEffect } from "react";
import { Drawer, IconButton, Typography, Box, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TreeViewForResponse from "../TreeViewWithCheckboxes/TreeViewForResponse";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import '../../../index.css';
import TreeViewWithCheckboxes from "../TreeViewWithCheckboxes/TreeViewWithCheckboxes";
import { State, Market, ServiceTerritory } from "../DefaultCapacityFilter/DefaultCapacityFilter.types";
import extractTerritoryIds from "../../../utility/extractTerritoryIds";
import { DefaultCapacityViewResponse } from "../DefaultCapacityTable/DefaultCapacityTable.types";

interface BulkTerritoriesSelectionProps {
    open: boolean;
    onClose: () => void;
    locationsData: State[];
    defaultCapacityFilterState: {
        selectedState: string;
        selectedMarket: string;
        selectedTerritory: string;
        selectedTerritoryId: number | null;
    };
    handleSubmitClick: (bulkTerritoriesId: number[]) => void;
    isResponseView?: boolean;
    responseData?: DefaultCapacityViewResponse[];
}

export const isNodeIndeterminate = (node: State | Market | ServiceTerritory, selected: Set<string | number>): boolean => {
    if ('markets' in node) {
        const totalMarkets = node.markets.length;
        const selectedMarkets = node.markets.filter((market) => selected.has(market.market)).length;
        const partiallySelectedMarkets = node.markets.some((market) => isNodeIndeterminate(market, selected));
        return (selectedMarkets > 0 && selectedMarkets < totalMarkets) || partiallySelectedMarkets;
    } else if ('serviceTerritories' in node) {
        const totalTerritories = node.serviceTerritories.length;
        const selectedTerritories = node.serviceTerritories.filter((territory) => selected.has(territory.id)).length;
        return selectedTerritories > 0 && selectedTerritories < totalTerritories;
    }
    return false;
};

const BulkTerritoriesSelection: React.FC<BulkTerritoriesSelectionProps> = ({
    open,
    onClose,
    locationsData,
    defaultCapacityFilterState,
    handleSubmitClick,
    isResponseView = false,
    responseData = [],
}) => {
    const [selected, setSelected] = useState<Set<string | number>>(new Set());

    useEffect(() => {
        const defaultSelected = new Set<string | number>();
        locationsData.forEach((state) => {
            if (state.state === defaultCapacityFilterState.selectedState) {
                defaultSelected.add(state.state);
                state.markets.forEach((market) => {
                    if (market.market === defaultCapacityFilterState.selectedMarket) {
                        defaultSelected.add(market.market);
                        market.serviceTerritories.forEach((territory) => {
                            if (territory.territory === defaultCapacityFilterState.selectedTerritory) {
                                defaultSelected.add(territory.id);
                            }
                        });
                    }
                });
            }
        });
        setSelected(defaultSelected);
    }, [locationsData, defaultCapacityFilterState]);

    const handleSelect = (id: string | number, checked: boolean) => {
        if (!isResponseView) {
            const newSelected = new Set(selected);

            const updateSelections = (node: State | Market | ServiceTerritory, targetId: string | number, isChecked: boolean) => {
                const nodeId = 'state' in node ? node.state : 'market' in node ? node.market : node.id;

                if (nodeId === targetId) {
                    if (isChecked) {
                        newSelected.add(nodeId);
                        if ('markets' in node) {
                            node.markets.forEach((market) => updateSelections(market, market.market, true));
                        } else if ('serviceTerritories' in node) {
                            node.serviceTerritories.forEach((territory) => updateSelections(territory, territory.id, true));
                        }
                    } else {
                        newSelected.delete(nodeId);
                        if ('markets' in node) {
                            node.markets.forEach((market) => updateSelections(market, market.market, false));
                        } else if ('serviceTerritories' in node) {
                            node.serviceTerritories.forEach((territory) => updateSelections(territory, territory.id, false));
                        }
                    }
                } else {
                    if ('markets' in node) {
                        node.markets.forEach((market) => updateSelections(market, targetId, isChecked));
                        const allMarketsSelected = node.markets.every((market) => newSelected.has(market.market));
                        const someMarketsSelected = node.markets.some((market) => newSelected.has(market.market) || isNodeIndeterminate(market, newSelected));
                        if (allMarketsSelected) newSelected.add(node.state);
                        else if (!someMarketsSelected) newSelected.delete(node.state);
                        else newSelected.delete(node.state);
                    } else if ('serviceTerritories' in node) {
                        node.serviceTerritories.forEach((territory) => updateSelections(territory, targetId, isChecked));
                        const allTerritoriesSelected = node.serviceTerritories.every((territory) => newSelected.has(territory.id));
                        const someTerritoriesSelected = node.serviceTerritories.some((territory) => newSelected.has(territory.id));
                        if (allTerritoriesSelected) newSelected.add(node.market);
                        else if (!someTerritoriesSelected) newSelected.delete(node.market);
                    }
                }
            };

            locationsData.forEach((state) => updateSelections(state, id, checked));
            setSelected(newSelected);
        }
    };

    const isNodeDisabled = (node: State | Market | ServiceTerritory): boolean => {
        if (isResponseView) {
            return true; // Disable all interactions in response view
        }
        if ('state' in node && node.state === defaultCapacityFilterState.selectedState) {
            return true;
        }
        if ('market' in node && node.market === defaultCapacityFilterState.selectedMarket) {
            return true;
        }
        if ('territory' in node && node.territory === defaultCapacityFilterState.selectedTerritory) {
            return true;
        }
        return false;
    };

    const getSelectedLocations = (): State[] => {
        const selectedLocations = locationsData
            .filter((state) => selected.has(state.state) || state.markets.some((market) => selected.has(market.market)))
            .map((state) => ({
                ...state,
                markets: state.markets
                    .filter((market) => selected.has(market.market) || market.serviceTerritories.some((territory) => selected.has(territory.id)))
                    .map((market) => ({
                        ...market,
                        serviceTerritories: market.serviceTerritories.filter((territory) => selected.has(territory.id)),
                    })),
            }));

        return selectedLocations;
    };

    const handleUpdateSubmission = () => {
        const selectedLocations = getSelectedLocations();
        const bulkTerritoriesId = extractTerritoryIds(selectedLocations, defaultCapacityFilterState.selectedTerritoryId);
        handleSubmitClick(bulkTerritoriesId);
    };

    const handleDownloadXLSX = async () => {
        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Failed Territories');

        // Define the header row
        worksheet.columns = [
            { header: 'State', key: 'State', width: 15 },
            { header: 'Market', key: 'Market', width: 20 },
            { header: 'Territory', key: 'Territory', width: 20 },
            { header: 'DateRange', key: 'DateRange', width: 25 },
        ];

        // Extract failed territories data
        locationsData.forEach((state) => {
            state.markets.forEach((market) => {
                market.serviceTerritories.forEach((territory) => {
                    const failedEntries = responseData.filter(
                        (r) => r.serviceTerritory === territory.territory && r.message.startsWith("Failure")
                    );
                    if (failedEntries.length > 0) {
                        failedEntries.forEach((entry) => {
                            entry.dateRanges.forEach((dateRange) => {
                                worksheet.addRow({
                                    State: state.state,
                                    Market: market.market,
                                    Territory: territory.territory,
                                    DateRange: dateRange,
                                });
                            });
                        });
                    }
                });
            });
        });

        // Generate the buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Generate the filename using selected State, Market, Territory, and timestamp
        const { selectedState, selectedMarket, selectedTerritory } = defaultCapacityFilterState;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Format timestamp (e.g., 2025-03-18T00-02-00-000Z)
        const filename = `${selectedState}_${selectedMarket}_${selectedTerritory}_${timestamp}.xlsx`;

        // Trigger the download using file-saver
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, filename);
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 450, padding: 2, backgroundColor: '#FFFFFF' }}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                        borderBottom: isResponseView
                            ? '4px solid #D32F2F'
                            : '1px solid #CCCCCC',
                        paddingBottom: '8px',
                    }}
                >
                    <Typography variant="h6" color="#333333" fontWeight="bold">
                        {isResponseView ? 'Update is failed' : 'Apply to multiple territories'}
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon sx={{ color: '#333333' }} />
                    </IconButton>
                </Box>
                {isResponseView ? (
                    <>
                        <Typography variant="body1" sx={{ mt: 2, color: '#333333' }}>
                            Upload has been failed in following territory due to schedule overlapping.
                        </Typography>
                        <Box className='location-container' sx={{ mt: 2, maxHeight: '450px', overflowY: 'auto' }}>
                            <Box sx={{ backgroundColor: '#F5F5F5', padding: '8px', borderRadius: '4px' }}>
                                <TreeViewForResponse
                                    locationsData={locationsData}
                                    responseData={responseData}
                                />
                            </Box>
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                onClick={handleDownloadXLSX}
                                sx={{
                                    backgroundColor: '#FFC107',
                                    color: '#000000',
                                    textTransform: 'none',
                                    padding: '6px 16px',
                                    '&:hover': {
                                        backgroundColor: '#FFB300',
                                    },
                                }}
                            >
                                Download CSV
                            </Button>
                        </Box>
                    </>
                ) : (
                    <>
                        <Typography variant="body1" sx={{ mt: 2, color: '#666666' }}>
                            Select the territories you want to apply changes to.
                        </Typography>
                        <Box className='location-container' sx={{ mt: 2, maxHeight: '450px', overflowY: 'auto' }}>
                            <Box sx={{ backgroundColor: '#F5F5F5', padding: '8px', borderRadius: '4px' }}>
                                <TreeViewWithCheckboxes
                                    locationsData={locationsData}
                                    selected={selected}
                                    onSelect={handleSelect}
                                    isNodeDisabled={isNodeDisabled}
                                />
                            </Box>
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={handleUpdateSubmission}
                                variant="contained"
                                sx={{
                                    backgroundColor: '#FFC107',
                                    color: '#000000',
                                    textTransform: 'none',
                                    padding: '6px 16px',
                                    '&:hover': {
                                        backgroundColor: '#FFB300',
                                    },
                                }}
                            >
                                Update
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </Drawer>
    );
};

export default BulkTerritoriesSelection;