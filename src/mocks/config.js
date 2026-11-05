export const MOCK_CONFIG = {
    lots: false,
    seeds: false,
    suppliers: false,
    locations: false,
    sowings: false,
    beds: false,
    reservations: false,
    sales: true,
    prediction: true,

    delayMs: 300,
};

export const mockDelay = () =>
    new Promise((resolve) => setTimeout(resolve, MOCK_CONFIG.delayMs));