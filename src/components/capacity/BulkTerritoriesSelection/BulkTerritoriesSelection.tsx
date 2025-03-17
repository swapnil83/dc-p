import React, { useState, useEffect } from "react";
import { Drawer, IconButton, Typography, Box, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TreeViewWithCheckboxes from "../TreeViewWithCheckboxes/TreeViewWithCheckboxes";
import { State, Market, ServiceTerritory } from "../DefaultCapacityFilter/DefaultCapacityFilter.types";
import extractTerritoryIds from "../../../utility/extractTerritoryIds";

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

const BulkTerritoriesSelection: React.FC<BulkTerritoriesSelectionProps> = ({ open, onClose, locationsData, defaultCapacityFilterState, handleSubmitClick }) => {
    const [selected, setSelected] = useState<Set<string | number>>(new Set());

    useEffect(() => {
        const defaultSelected = new Set<string | number>();
        locationsData.forEach(state => {
            if (state.state === defaultCapacityFilterState.selectedState) {
                defaultSelected.add(state.state);
                state.markets.forEach(market => {
                    if (market.market === defaultCapacityFilterState.selectedMarket) {
                        defaultSelected.add(market.market);
                        market.serviceTerritories.forEach(territory => {
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
                    else if (!someMarketsSelected) newSelected.delete(node.state); // Remove state if no markets are selected
                    else newSelected.delete(node.state); // Ensure state is removed if indeterminate
                } else if ('serviceTerritories' in node) {
                    node.serviceTerritories.forEach((territory) => updateSelections(territory, targetId, isChecked));
                    const allTerritoriesSelected = node.serviceTerritories.every((territory) => newSelected.has(territory.id));
                    const someTerritoriesSelected = node.serviceTerritories.some((territory) => newSelected.has(territory.id));
                    if (allTerritoriesSelected) newSelected.add(node.market);
                    else if (!someTerritoriesSelected) newSelected.delete(node.market); // Remove market if no territories are selected
                }
            }
        };

        locationsData.forEach((state) => updateSelections(state, id, checked));
        setSelected(newSelected);
    };

    const isNodeDisabled = (node: State | Market | ServiceTerritory): boolean => {
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

    const logSelectedLocations = () => {
        const selectedLocations = getSelectedLocations();
        const bulkTerritoriesId = extractTerritoryIds(selectedLocations, defaultCapacityFilterState.selectedTerritoryId);
        handleSubmitClick(bulkTerritoriesId);
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 350, padding: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Apply to multiple territories</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Typography variant="body1" sx={{ mt: 2 }}>
                    Select the territories you want to apply changes to.
                </Typography>
                <Box sx={{ mt: 2 }}>
                    <TreeViewWithCheckboxes
                        locationsData={locationsData}
                        selected={selected}
                        onSelect={handleSelect}
                        isNodeDisabled={isNodeDisabled}
                    />
                </Box>
                <Box sx={{ mt: 2 }}>
                    <Button onClick={logSelectedLocations}>Log Selected Locations</Button>
                </Box>
            </Box>
        </Drawer>
    );
};

export default BulkTerritoriesSelection;