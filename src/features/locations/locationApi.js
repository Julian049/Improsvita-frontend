import axiosClient from '../../api/axiosClient';
import { toDateOnly } from '../../utils/dateUtils';

function fromLocationResponse(location) {
    return {
        locationId: location.locationId,
        locationName: location.locationName,
        active: location.active,
        createdAt: toDateOnly(location.createdAt),
        lastUpdated: toDateOnly(location.lastUpdated),
    };
}

export async function getLocations() {
    const { data } = await axiosClient.get('/locations');
    return data.map(fromLocationResponse);
}