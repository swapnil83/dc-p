// TreeViewForResponse.tsx
import React from "react";
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Typography, Box } from '@mui/material';
import { State, Market, ServiceTerritory } from '../DefaultCapacityFilter/DefaultCapacityFilter.types';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { DefaultCapacityViewResponse } from "../DefaultCapacityTable/DefaultCapacityTable.types";

interface TreeViewForResponseProps {
    locationsData: State[];
    responseData: DefaultCapacityViewResponse[];
}

// Type predicate to narrow node type to State
const isState = (node: State | Market | ServiceTerritory): node is State => 'state' in node && 'markets' in node;

// Type predicate to narrow node type to Market
const isMarket = (node: State | Market | ServiceTerritory): node is Market => 'market' in node && 'serviceTerritories' in node;

// Type predicate to narrow node type to ServiceTerritory
const isServiceTerritory = (node: State | Market | ServiceTerritory): node is ServiceTerritory => 'territory' in node && 'id' in node;

// Function to count territories with overlap and aggregate date ranges for a node
const getOverlapInfo = (node: State | Market | ServiceTerritory, responseData: DefaultCapacityViewResponse[]): { count: number; dateRanges: string[] } => {
    let count = 0;
    let dateRanges: string[] = [];

    if (isState(node)) {
        const failedMarkets = node.markets.filter((market) => getOverlapInfo(market, responseData).count > 0);
        count = failedMarkets.reduce((acc, market) => acc + getOverlapInfo(market, responseData).count, 0); // Sum of territories in markets
        dateRanges = failedMarkets.flatMap((market) => getOverlapInfo(market, responseData).dateRanges);
    } else if (isMarket(node)) {
        const failedTerritories = node.serviceTerritories.filter(
            (territory) => getOverlapInfo(territory, responseData).count > 0
        );
        count = failedTerritories.length; // Count of territories with overlap
        dateRanges = failedTerritories.flatMap(
            (territory) => getOverlapInfo(territory, responseData).dateRanges
        );
    } else if (isServiceTerritory(node)) {
        const failedTerritories = responseData.filter(
            (r) => r.serviceTerritory === node.territory && r.message.startsWith("Failure")
        );
        count = failedTerritories.length;
        dateRanges = failedTerritories.flatMap((r) => r.dateRanges);
    }

    return { count, dateRanges };
};

const TreeViewForResponse: React.FC<TreeViewForResponseProps> = ({
    locationsData,
    responseData,
}) => {
    const renderTree = (node: State | Market | ServiceTerritory) => {
        const nodeId = 'state' in node ? node.state : 'market' in node ? node.market : node.id;
        const { count, dateRanges } = getOverlapInfo(node, responseData);

        // Skip rendering nodes with no failures
        if (count === 0) {
            return null;
        }

        const hasChildren = dateRanges.length > 0 && isServiceTerritory(node);

        // Determine the message based on the node type
        const isTerritory = isServiceTerritory(node);
        const message = isTerritory
            ? `${dateRanges.length} Date Range${dateRanges.length === 1 ? '' : 's'} with Overlap`
            : `${count} ${count === 1 ? 'Territory' : 'Territories'} with Overlap`;

        return (
            <TreeItem
                key={nodeId}
                itemId={nodeId.toString()}
                label={
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ padding: '4px 8px', marginBottom: 'state' in node ? '8px' : '2px' }}
                    >
                        <Typography sx={{ color: '#333333' }}>
                            {'state' in node ? node.state : 'market' in node ? node.market : node.territory}
                        </Typography>
                        {count > 0 && (
                            <Typography
                                component="span"
                                sx={{ color: '#D32F2F', ml: 1 }}
                            >
                                {message}
                            </Typography>
                        )}
                    </Box>
                }
                sx={{
                    '& .MuiTreeItem-content': {
                        borderBottom: 'state' in node ? '1px solid #999999' : '1px solid #E0E0E0',
                        padding: '4px 0',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    },
                    '& .MuiTreeItem-iconContainer': {
                        order: 2,
                        marginLeft: 'auto',
                        marginRight: '8px',
                    },
                    '& .MuiTreeItem-label': {
                        order: 1,
                        flexGrow: 1,
                    },
                }}
            >
                {hasChildren && dateRanges.map((dateRange, index) => (
                    <TreeItem
                        key={`${nodeId}-date-${index}`}
                        itemId={`${nodeId}-date-${index}`}
                        label={
                            <Box sx={{ padding: '4px 8px' }}>
                                <Typography sx={{ color: '#D32F2F', ml: 2 }}>
                                    {dateRange}
                                </Typography>
                            </Box>
                        }
                        sx={{
                            '& .MuiTreeItem-content': {
                                borderBottom: '1px solid #E0E0E0',
                                padding: '4px 0',
                            },
                            '& .MuiTreeItem-iconContainer': {
                                display: 'none',
                            },
                        }}
                    />
                ))}
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
                    color: '#333333',
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

export default TreeViewForResponse;