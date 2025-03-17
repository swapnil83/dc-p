import { Market, State } from "../components/capacity/DefaultCapacityFilter/DefaultCapacityFilter.types";

function extractTerritoryIds(locationsData: State[], selectedTerritoryId: number | null): number[] {
    const territoryIds: number[] = [];

    const traverse = (node: State | Market) => {
        if ('serviceTerritories' in node) {
            node.serviceTerritories.forEach((territory) => {
                if (territory.id !== selectedTerritoryId) {
                    territoryIds.push(territory.id);
                }
            });
        } else if ('markets' in node) {
            node.markets.forEach((market) => traverse(market));
        }
    };

    locationsData.forEach((state) => traverse(state));

    return territoryIds;
}

export default extractTerritoryIds;