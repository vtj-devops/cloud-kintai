import { alphaColor } from "../color";

describe("alphaColor", () => {
  describe("rgb input", () => {
    it("converts rgb to rgba with given alpha", () => {
      expect(alphaColor("rgb(255, 128, 0)", 0.5)).toBe("rgba(255, 128, 0, 0.5)");
    });
  });

  describe("rgba input", () => {
    it("replaces existing alpha with new value", () => {
      expect(alphaColor("rgba(255, 128, 0, 0.8)", 0.2)).toBe("rgba(255, 128, 0, 0.2)");
    });

    it("replaces alpha with decimal value", () => {
      expect(alphaColor("rgba(100, 200, 50, 1)", 0)).toBe("rgba(100, 200, 50, 0)");
    });
  });

  describe("hex input", () => {
    it("converts 6-digit hex to rgba", () => {
      expect(alphaColor("#ff8000", 0.5)).toBe("rgba(255, 128, 0, 0.5)");
    });

    it("handles hex without # prefix", () => {
      expect(alphaColor("ff8000", 0.3)).toBe("rgba(255, 128, 0, 0.3)");
    });

    it("expands 3-digit hex to 6-digit", () => {
      expect(alphaColor("#fff", 1)).toBe("rgba(255, 255, 255, 1)");
    });

    it("expands 3-digit hex without #", () => {
      expect(alphaColor("f0f", 0.5)).toBe("rgba(255, 0, 255, 0.5)");
    });

    it("handles hex with mixed case", () => {
      expect(alphaColor("#FF8000", 0.5)).toBe("rgba(255, 128, 0, 0.5)");
    });

    it("handles black hex", () => {
      expect(alphaColor("#000000", 0.1)).toBe("rgba(0, 0, 0, 0.1)");
    });

    it("handles white hex", () => {
      expect(alphaColor("#ffffff", 1)).toBe("rgba(255, 255, 255, 1)");
    });
  });

  describe("invalid input", () => {
    it("returns original string for invalid hex", () => {
      expect(alphaColor("not-a-color", 0.5)).toBe("not-a-color");
    });

    it("returns original for incomplete hex", () => {
      expect(alphaColor("#abc1", 0.5)).toBe("#abc1");
    });
  });
});
