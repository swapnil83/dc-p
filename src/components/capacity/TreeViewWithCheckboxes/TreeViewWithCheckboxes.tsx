import React from "react";
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Typography, Box, Checkbox } from '@mui/material';
import { State, Market, ServiceTerritory } from '../DefaultCapacityFilter/DefaultCapacityFilter.types';
import { isNodeIndeterminate } from '../BulkTerritoriesSelection/BulkTerritoriesSelection';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Down arrow for collapsed state
import ExpandLessIcon from '@mui/icons-material/ExpandLess'; // Up arrow for expanded state

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
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between" // Ensure label and icon are spaced apart
                        sx={{ padding: '4px 8px', marginBottom: 'state' in node ? '8px' : '2px' }}
                    >
                        <Box display="flex" alignItems="center">
                            <Checkbox
                                checked={isSelected}
                                indeterminate={isIndeterminate}
                                onChange={handleCheckboxChange}
                                disabled={disabled}
                                sx={{ padding: '0 8px 0 0' }}
                            />
                            <Typography sx={{ color: '#333333' }}>
                                {'state' in node ? node.state : 'market' in node ? node.market : node.territory}
                            </Typography>
                        </Box>
                    </Box>
                }
                sx={{
                    '& .MuiTreeItem-content': {
                        borderBottom: 'state' in node ? '1px solid #999999' : '1px solid #E0E0E0',
                        padding: '4px 0',
                        display: 'flex', // Ensure the content is a flex container
                        flexDirection: 'row', // Align items in a row
                        alignItems: 'center',
                    },
                    '& .MuiTreeItem-iconContainer': {
                        order: 2, // Move the icon container to the end (right side)
                        marginLeft: 'auto', // Push the icon to the right
                        marginRight: '8px',
                    },
                    '& .MuiTreeItem-label': {
                        order: 1, // Ensure the label comes before the icon
                        flexGrow: 1, // Allow the label to take up remaining space
                    },
                }}
            >
                {'markets' in node && node.markets.map((market) => renderTree(market))}
                {'serviceTerritories' in node && node.serviceTerritories.map((territory) => renderTree(territory))}
            </TreeItem>
        );
    };

    return (
        <SimpleTreeView
            sx={{
                padding: '0',
                '& .MuiTreeItem-iconContainer svg': {
                    color: '#333333', // Style the icon directly
                },
            }}
            slots={{
                expandIcon: ExpandMoreIcon,
                collapseIcon: ExpandLessIcon,
            }}
        >
            {locationsData.map((node) => renderTree(node))}
        </SimpleTreeView>
    );
};

export default TreeViewWithCheckboxes;