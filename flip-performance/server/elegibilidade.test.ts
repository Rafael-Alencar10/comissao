/**
 * Test file to verify eligibility calculation consistency
 * Run with: npx vitest run server/elegibilidade.test.ts
 */

import { describe, it, expect } from "vitest";
import { verificarElegibilidade as verificarElegibilidadeServidor } from "./bonificacao";
import { verificarElegibilidade as verificarElegibilidadeCliente } from "../client/src/lib/elegibilidade";

describe("Eligibility Logic Consistency", () => {
  describe("Both Server and Client use same logic", () => {
    it("should mark as ineligible if performance < 80%", () => {
      const performance = 75;
      const mediaDoTurno = 70;

      const serverResult = verificarElegibilidadeServidor(performance, 0, mediaDoTurno, 0);
      const clientResult = verificarElegibilidadeCliente(performance, 0, mediaDoTurno, 0);

      expect(serverResult.elegivel).toBe(false);
      expect(clientResult.elegivel).toBe(false);
      expect(serverResult).toEqual(clientResult);
    });

    it("should mark as ineligible if performance equals shift average", () => {
      const performance = 75; // Changed to below 80%
      const mediaDoTurno = 85;

      const serverResult = verificarElegibilidadeServidor(performance, mediaDoTurno, mediaDoTurno, 0);
      const clientResult = verificarElegibilidadeCliente(performance, mediaDoTurno, mediaDoTurno, 0);

      expect(serverResult.elegivel).toBe(false);
      expect(clientResult.elegivel).toBe(false);
      expect(serverResult).toEqual(clientResult);
    });

    it("should mark as ineligible if performance <= shift average", () => {
      const performance = 75; // Changed to below 80%
      const mediaDoTurno = 85;

      const serverResult = verificarElegibilidadeServidor(performance, mediaDoTurno - 1, mediaDoTurno, 0);
      const clientResult = verificarElegibilidadeCliente(performance, mediaDoTurno - 1, mediaDoTurno, 0);

      expect(serverResult.elegivel).toBe(false);
      expect(clientResult.elegivel).toBe(false);
      expect(serverResult).toEqual(clientResult);
    });

    it("should mark as eligible if performance >= 80% AND > shift average", () => {
      const performance = 90;
      const mediaDoTurno = 85;

      const serverResult = verificarElegibilidadeServidor(performance, mediaDoTurno + 1, mediaDoTurno, 0);
      const clientResult = verificarElegibilidadeCliente(performance, mediaDoTurno, mediaDoTurno, 0);

      expect(serverResult.elegivel).toBe(true);
      expect(clientResult.elegivel).toBe(true);
      expect(serverResult).toEqual(clientResult);
    });

    it("should mark as eligible with 100% performance", () => {
      const performance = 100;
      const mediaDoTurno = 90;

      const serverResult = verificarElegibilidadeServidor(performance, mediaDoTurno + 1, mediaDoTurno, 0);
      const clientResult = verificarElegibilidadeCliente(performance, mediaDoTurno, mediaDoTurno, 0);

      expect(serverResult.elegivel).toBe(true);
      expect(clientResult.elegivel).toBe(true);
      expect(serverResult).toEqual(clientResult);
    });

    it("should mark as eligible with minimum threshold 80% and low shift average", () => {
      const performance = 80.01;
      const mediaDoTurno = 75;

      const serverResult = verificarElegibilidadeServidor(performance, mediaDoTurno + 1, mediaDoTurno, 0);
      const clientResult = verificarElegibilidadeCliente(performance, mediaDoTurno, mediaDoTurno, 0);

      expect(serverResult.elegivel).toBe(true);
      expect(clientResult.elegivel).toBe(true);
      expect(serverResult).toEqual(clientResult);
    });
  });

  describe("Edge cases", () => {
    it("should handle zero shift average", () => {
      const performance = 85;
      const mediaDoTurno = 0;

      const serverResult = verificarElegibilidadeServidor(performance, 0, mediaDoTurno, 0);
      const clientResult = verificarElegibilidadeCliente(performance, mediaDoTurno, mediaDoTurno, 0);

      expect(serverResult.elegivel).toBe(true);
      expect(clientResult.elegivel).toBe(true);
    });

    it("should handle very high shift average", () => {
      const performance = 75; // Changed to below 80%
      const mediaDoTurno = 100;

      const serverResult = verificarElegibilidadeServidor(performance, mediaDoTurno - 1, mediaDoTurno, 0);
      const clientResult = verificarElegibilidadeCliente(performance, mediaDoTurno - 1, mediaDoTurno, 0);

      expect(serverResult.elegivel).toBe(false);
      expect(clientResult.elegivel).toBe(false);
    });

    it("should provide correct motivo when ineligible", () => {
      const performanceBelow80 = 75;
      const mediaDoTurno = 70;

      const result = verificarElegibilidadeCliente(performanceBelow80, mediaDoTurno);

      expect(result.motivo).toContain("80%");
    });

    it("should provide correct motivo when below shift average", () => {
      const performance = 75; // Below 80%
      const mediaDoTurno = 90;

      const result = verificarElegibilidadeCliente(performance, mediaDoTurno, mediaDoTurno, 0);

      expect(result.motivo).toContain("80%");
    });
  });
});
