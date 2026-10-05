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

function toLocationRequest(payload) {
    return {
        locationName: payload.locationName.trim(),
        active: payload.active,
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

export async function getLocationById(id) {
    const { data } = await axiosClient.get(`/locations/${id}`);
    return fromLocationResponse(data);
}

// El backend crea siempre la ubicación activa e ignora `active` en el POST.
export async function createLocation(payload) {
    const { data } = await axiosClient.post('/locations', toLocationRequest(payload));
    return fromLocationResponse(data);
}

export async function updateLocation(id, payload) {
    const { data } = await axiosClient.put(`/locations/${id}`, toLocationRequest(payload));
    return fromLocationResponse(data);
}
