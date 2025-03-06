import { State } from "../components/capacity/DefaultCapacityFilter/DefaultCapacityFilter.types";


export const getTerritoryId = (locationsData: State[], stateName: string, marketName: string, territoryName: string): number | null => {
    const state = locationsData.find(state => state.state === stateName);
    if (!state) return null;

    const market = state.markets.find(market => market.market === marketName);
    if (!market) return null;

    const territory = market.serviceTerritories.find(territory => territory.territory === territoryName);
    return territory ? territory.id : null;
}