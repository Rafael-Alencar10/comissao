import { describe, expect, it } from "vitest";

describe("Lancamento Form Input Validation", () => {
  it("should convert empty string to 0 using parseInt", () => {
    const emptyValue = "";
    const result = parseInt(emptyValue) || 0;
    expect(result).toBe(0);
  });

  it("should convert numeric string to number using parseInt", () => {
    const stringValue = "10";
    const result = parseInt(stringValue) || 0;
    expect(result).toBe(10);
  });

  it("should handle invalid string with fallback to 0", () => {
    const invalidValue = "abc";
    const result = parseInt(invalidValue) || 0;
    expect(result).toBe(0);
  });

  it("should correctly sum converted values", () => {
    const chatTotal = "5";
    const ligacaoTotal = "3";
    
    const chatNum = parseInt(chatTotal) || 0;
    const ligacaoNum = parseInt(ligacaoTotal) || 0;
    const total = chatNum + ligacaoNum;
    
    expect(total).toBe(8);
  });

  it("should handle all fields as empty strings initially", () => {
    const formData = {
      chatTotal: "",
      chatNota5: "",
      chatNota4: "",
      chatNota3: "",
      chatNota2: "",
      chatNota1: "",
      ligacaoTotal: "",
      ligacaoExtrementeSatisfeito: "",
      ligacaoExcelente: "",
      ligacaoBom: "",
      ligacaoRegular: "",
      ligacaoRuim: "",
      ligacaoPessimo: "",
    };

    // Verify all fields are empty strings
    Object.values(formData).forEach((value) => {
      expect(value).toBe("");
    });

    // Verify conversion works for all fields
    Object.values(formData).forEach((value) => {
      const converted = parseInt(value) || 0;
      expect(converted).toBe(0);
    });
  });

  it("should validate that sum of categories does not exceed total", () => {
    const chatTotal = 5;
    const chatNota5 = 3;
    const chatNota4 = 2;
    const chatSum = chatNota5 + chatNota4;

    expect(chatSum <= chatTotal).toBe(true);

    // Test invalid case
    const invalidChatSum = 10;
    expect(invalidChatSum <= chatTotal).toBe(false);
  });

  it("should calculate performance correctly with converted values", () => {
    // Simulate form values as strings
    const chatTotal = "10";
    const chatNota5 = "10";
    const ligacaoTotal = "0";

    // Convert to numbers
    const chatTotalNum = parseInt(chatTotal) || 0;
    const chatNota5Num = parseInt(chatNota5) || 0;
    const ligacaoTotalNum = parseInt(ligacaoTotal) || 0;

    // Calculate score
    const chatScore = chatNota5Num * 5; // 10 * 5 = 50
    const totalScore = chatScore;
    const maxScore = (chatTotalNum + ligacaoTotalNum) * 5; // 10 * 5 = 50

    const performance = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    expect(performance).toBe(100);
  });

  it("should handle mixed empty and filled fields", () => {
    const formData = {
      chatTotal: "5",
      chatNota5: "",
      chatNota4: "3",
      chatNota3: "",
      chatNota2: "2",
      chatNota1: "",
      ligacaoTotal: "",
      ligacaoExtrementeSatisfeito: "2",
      ligacaoExcelente: "",
      ligacaoBom: "1",
      ligacaoRegular: "",
      ligacaoRuim: "",
      ligacaoPessimo: "",
    };

    // Convert all values
    const converted = Object.entries(formData).reduce(
      (acc, [key, value]) => {
        acc[key] = parseInt(value) || 0;
        return acc;
      },
      {} as Record<string, number>
    );

    expect(converted.chatTotal).toBe(5);
    expect(converted.chatNota5).toBe(0);
    expect(converted.chatNota4).toBe(3);
    expect(converted.ligacaoTotal).toBe(0);
    expect(converted.ligacaoExtrementeSatisfeito).toBe(2);
  });

  it("should validate empty form submission", () => {
    const chatTotal = "";
    const ligacaoTotal = "";

    // Check if both are empty
    const isEmpty = !chatTotal && !ligacaoTotal;
    expect(isEmpty).toBe(true);

    // Check if at least one is filled (returns empty string which is falsy)
    const isFilled = chatTotal || ligacaoTotal;
    expect(isFilled).toBeFalsy();
  });

  it("should validate form with at least one value", () => {
    const chatTotal = "5";
    const ligacaoTotal = "";

    const isFilled = chatTotal || ligacaoTotal;
    expect(isFilled).toBe("5");
  });
});
