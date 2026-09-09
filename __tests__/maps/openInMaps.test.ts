const mockCanOpenURL = jest.fn();
const mockOpenURL = jest.fn();

jest.mock("react-native", () => ({
  Linking: {
    canOpenURL: (url: string) => mockCanOpenURL(url),
    openURL: (url: string) => mockOpenURL(url),
  },
  Platform: { OS: "ios", select: (obj: Record<string, unknown>) => obj.ios ?? obj.default },
}));

import {
  getAvailableProviders,
  openInMaps,
} from "@/lib/maps/openInMaps";

const DEST = { latitude: 37.7749, longitude: -122.4194, label: "Twin Peaks" };

beforeEach(() => {
  mockCanOpenURL.mockReset();
  mockOpenURL.mockReset();
});

describe("openInMaps (iOS)", () => {
  it("prefers the native Apple Maps scheme for the apple provider", async () => {
    mockCanOpenURL.mockResolvedValue(true);

    await openInMaps("apple", DEST);

    expect(mockOpenURL).toHaveBeenCalledTimes(1);
    expect(mockOpenURL.mock.calls[0][0]).toMatch(/^maps:\/\/\?daddr=37\.7749,-122\.4194/);
  });

  it("prefers the native Google Maps scheme for the google provider", async () => {
    mockCanOpenURL.mockResolvedValue(true);

    await openInMaps("google", DEST);

    expect(mockOpenURL.mock.calls[0][0]).toMatch(/^comgooglemaps:\/\/\?daddr=37\.7749,-122\.4194/);
  });

  it("falls back to the https URL when the native app is absent", async () => {
    mockCanOpenURL.mockImplementation((url: string) =>
      Promise.resolve(url.startsWith("https://"))
    );

    await openInMaps("google", DEST);

    expect(mockOpenURL.mock.calls[0][0]).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=37.7749,-122.4194"
    );
  });

  it("routes by coordinates, never by the pin label, so the exact spot is used", async () => {
    mockCanOpenURL.mockResolvedValue(true);

    await openInMaps("apple", DEST);

    expect(mockOpenURL.mock.calls[0][0]).not.toContain("Twin");
  });

  it("reports failure when nothing can be opened", async () => {
    mockCanOpenURL.mockResolvedValue(false);

    await expect(openInMaps("apple", DEST)).resolves.toBe(false);
    expect(mockOpenURL).not.toHaveBeenCalled();
  });
});

describe("getAvailableProviders (iOS)", () => {
  it("offers both providers when both apps are installed", async () => {
    mockCanOpenURL.mockResolvedValue(true);
    await expect(getAvailableProviders()).resolves.toEqual(["apple", "google"]);
  });

  it("hides Google when its app is not installed", async () => {
    mockCanOpenURL.mockImplementation((url: string) =>
      Promise.resolve(url.startsWith("maps://"))
    );
    await expect(getAvailableProviders()).resolves.toEqual(["apple"]);
  });

  it("still offers Google when no native maps app is detected", async () => {
    mockCanOpenURL.mockResolvedValue(false);
    await expect(getAvailableProviders()).resolves.toEqual(["google"]);
  });
});
