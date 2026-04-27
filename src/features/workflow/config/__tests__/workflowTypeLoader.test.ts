import {
  findWorkflowConfigByLabel,
  getFieldConfigsByLabel,
  getWorkflowTypeConfigs,
} from "../workflowTypeLoader";

describe("getWorkflowTypeConfigs", () => {
  it("配列を返す", () => {
    const configs = getWorkflowTypeConfigs();
    expect(Array.isArray(configs)).toBe(true);
    expect(configs.length).toBeGreaterThan(0);
  });

  it("各設定に id と label が含まれる", () => {
    const configs = getWorkflowTypeConfigs();
    configs.forEach((config) => {
      expect(typeof config.id).toBe("string");
      expect(typeof config.label).toBe("string");
    });
  });
});

describe("findWorkflowConfigByLabel", () => {
  it("存在するトップレベルラベルで設定を返す", () => {
    const configs = getWorkflowTypeConfigs();
    const firstLabel = configs[0].label;
    const result = findWorkflowConfigByLabel(firstLabel);
    expect(result).toBeDefined();
    expect(result?.label).toBe(firstLabel);
  });

  it("存在しないラベルで undefined を返す", () => {
    const result = findWorkflowConfigByLabel("__nonexistent_label__");
    expect(result).toBeUndefined();
  });

  it("サブタイプのラベルでも設定を返す", () => {
    const configs = getWorkflowTypeConfigs();
    const typeWithSubTypes = configs.find((c) => c.subTypes && c.subTypes.length > 0);
    if (typeWithSubTypes?.subTypes?.[0]) {
      const subLabel = typeWithSubTypes.subTypes[0].label;
      const result = findWorkflowConfigByLabel(subLabel);
      expect(result).toBeDefined();
      expect(result?.label).toBe(subLabel);
    }
  });
});

describe("getFieldConfigsByLabel", () => {
  it("存在するラベルでフィールドの配列を返す", () => {
    const configs = getWorkflowTypeConfigs();
    const labelWithFields = configs.find((c) => c.fields && c.fields.length > 0);
    if (labelWithFields) {
      const result = getFieldConfigsByLabel(labelWithFields.label);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it("存在しないラベルで空配列を返す", () => {
    const result = getFieldConfigsByLabel("__nonexistent__");
    expect(result).toEqual([]);
  });
});
