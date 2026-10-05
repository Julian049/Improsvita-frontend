export const MOCK_CONFIG = {
    lots: false,
    seeds: false,
    suppliers: false,
    locations: false,
    plantings: true,
    beds: true,

    delayMs: 300,
};

export const mockDelay = () =>
    new Promise((resolve) => setTimeout(resolve, MOCK_CONFIG.delayMs));