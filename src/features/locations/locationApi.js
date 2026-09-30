import axiosClient from '../../api/axiosClient';
import { toDateOnly } from '../../utils/dateUtils';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_LOCATIONS } from '../../mocks/locationMocks';

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
    if (MOCK_CONFIG.locations) {
        await mockDelay();
        return MOCK_LOCATIONS.map(fromLocationResponse);
    }

    const { data } = await axiosClient.get('/locations');
    return data.map(fromLocationResponse);
}