import React from "react";
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Typography, Box, Checkbox } from '@mui/material';
import { State, Market, ServiceTerritory } from '../DefaultCapacityFilter/DefaultCapacityFilter.types';
import { isNodeIndeterminate } from '../BulkTerritoriesSelection/BulkTerritoriesSelection';

interface TreeViewWithCheckboxesProps {
    selected: Set<string | number>;
    onSelect: (id: string | number, checked: boolean) => void;
    locationsData: State[];
    isNodeDisabled: (node: State | Market | ServiceTerritory) => boolean;
}

const TreeViewWithCheckboxes: React.FC<TreeViewWithCheckboxesProps> = ({ selected, onSelect, locationsData, isNodeDisabled }) => {
    const isNodeSelected = (id: string | number) => selected.has(id);

    const renderTree = (node: State | Market | ServiceTerritory) => {
        const nodeId = 'state' in node ? node.state : 'market' in node ? node.market : node.id;
        const isSelected = isNodeSelected(nodeId);
        const isIndeterminate = isNodeIndeterminate(node, selected);
        const disabled = isNodeDisabled(node);

        const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            if (!disabled) {
                onSelect(nodeId, event.target.checked);
            }
        };

        return (
            <TreeItem
                key={nodeId}
                itemId={nodeId.toString()}
                label={
                    <Box display="flex" alignItems="center">
                        <Checkbox
                            checked={isSelected}
                            indeterminate={isIndeterminate}
                            onChange={handleCheckboxChange}
                            disabled={disabled}
                        />
                        <Typography>{'state' in node ? node.state : 'market' in node ? node.market : node.territory}</Typography>
                    </Box>
                }
            >
                {'markets' in node && node.markets.map((market) => renderTree(market))}
                {'serviceTerritories' in node && node.serviceTerritories.map((territory) => renderTree(territory))}
            </TreeItem>
        );
    };

    return <SimpleTreeView>{locationsData.map((node) => renderTree(node))}</SimpleTreeView>;
};

export default TreeViewWithCheckboxes;