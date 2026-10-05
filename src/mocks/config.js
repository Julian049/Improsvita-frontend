export const MOCK_CONFIG = {
    lots: true,
    seeds: false,
    suppliers: false,
    locations: true,
    plantings: true,
    beds: true,

    delayMs: 300,
};

export const mockDelay = () =>
    new Promise((resolve) => setTimeout(resolve, MOCK_CONFIG.delayMs));