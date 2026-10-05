import axiosClient from '../../api/axiosClient';
import { MOCK_CONFIG, mockDelay } from '../../mocks/config';
import { MOCK_LOCATIONS } from '../../mocks/locationMocks';

function fromLocationResponse(location) {
    return {
        locationId: location.id,
        locationName: location.locationName,
        active: location.active,
    };
}

export async function getLocations() {
    if (MOCK_CONFIG.locations) {
        await mockDelay();
        return MOCK_LOCATIONS;
    }

    const { data } = await axiosClient.get('/locations');
    return data.map(fromLocationResponse);
}