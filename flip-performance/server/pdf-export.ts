import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ENV } from "./_core/env";

export interface ProducaoExportData {
  atendenteNome: string;
  turno: string;
  mes: number;
  ano: number;
  chatTotal: number;
  ligacaoTotal: number;
  pontosChat: number;
  pontosLigacao: number;
  pontosTotais: number;
  maxPontosChat: number;
  maxPontosLigacao: number;
  maxPontosTotais: number;
  performance: number;
  elegivel: boolean;
  bonificacao: number;
  motivoNaoElegivel: string | null;
}

export function generateProductionPDFBuffer(
  producoes: ProducaoExportData[],
  mes: number,
  ano: number,
  turno?: string
): Buffer {
  const mesNomes = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  // Use landscape to fit more columns and set A4 format
  const doc = new jsPDF({ format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryColor: [number, number, number] = [37, 99, 235];
  const darkColor: [number, number, number] = [15, 23, 41];
  const lightGray: [number, number, number] = [122, 132, 144];

  // Header subtitle (rendered by didDrawPage on page 1)
  const subtitle = `${mesNomes[mes - 1]} de ${ano}${turno ? ` - Turno ${turno}` : ""}`;

  // Load logo from path in ENV.LOGO_PATH if set, else fallback to default
  let logoDataUrl: string | null = null;
  try {
    let logoPath = ENV.logoPath && ENV.logoPath.trim().length > 0 ? ENV.logoPath : null;
    if (!logoPath) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      logoPath = path.resolve(__dirname, "..", "public", "flip-pdf.png");
    }
    console.log("[PDF] Procurando logo em:", logoPath);
    if (fs.existsSync(logoPath)) {
      const buf = fs.readFileSync(logoPath);
      console.log("[PDF] Logo encontrada, bytes:", buf.length);
      logoDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
      if (logoDataUrl.length < 100) {
        console.warn("[PDF] Atenção: logoDataUrl muito curta:", logoDataUrl);
      }
    } else {
      console.error("[PDF] ERRO FATAL: Logo NÃO encontrada no caminho informado! O PDF NÃO terá logo.");
      throw new Error("[PDF] Logo flip-pdf.png não encontrada em " + logoPath);
    }
  } catch (err) {
    console.error("[PDF] Erro ao tentar carregar logo:", err);
    logoDataUrl = null;
  }

  // Summary Section
  const totalElegivel = producoes.filter((p) => p.elegivel).length;
  const totalNaoElegivel = producoes.filter((p) => !p.elegivel).length;
  const totalBonificacao = producoes.reduce((sum, p) => sum + p.bonificacao, 0);

  let yPosition = 44;
  const cardWidth = 40;
  const cardHeight = 20;
  const cardSpacing = 5;

  // Summary Cards
  const summaryData = [
    { label: "Total", value: producoes.length.toString() },
    { label: "Elegíveis", value: totalElegivel.toString() },
    { label: "Não Elegíveis", value: totalNaoElegivel.toString() },
    { label: "Total Bônus", value: `R$ ${totalBonificacao.toFixed(2)}` },
  ];

  summaryData.forEach((item, index) => {
    const xPos = 20 + index * (cardWidth + cardSpacing);
    doc.setFillColor(243, 244, 246);
    doc.rect(xPos, yPosition, cardWidth, cardHeight, "F");
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(xPos, yPosition, xPos, yPosition + cardHeight);

    doc.setFontSize(9);
    doc.setTextColor(...lightGray);
    doc.text(item.label, xPos + 2, yPosition + 6);

    doc.setFontSize(11);
    doc.setTextColor(...darkColor);
    doc.setFont("Helvetica", "bold");
    doc.text(item.value, xPos + 2, yPosition + 14);
    doc.setFont("Helvetica", "normal");
  });

  yPosition = 90;

  // Table Header
  // Calculate média do turno (média de atendimentos por atendente no mesmo turno)
  const turnoGroups: Record<string, { totalAtendimentos: number; count: number }> = {};
  producoes.forEach((p) => {
    const t = p.turno || "N/A";
    const total = (p.chatTotal || 0) + (p.ligacaoTotal || 0);
    if (!turnoGroups[t]) turnoGroups[t] = { totalAtendimentos: 0, count: 0 };
    turnoGroups[t].totalAtendimentos += total;
    turnoGroups[t].count += 1;
  });

  const mediaPorTurno: Record<string, number> = {};
  Object.keys(turnoGroups).forEach((t) => {
    const g = turnoGroups[t];
    mediaPorTurno[t] = g.count > 0 ? g.totalAtendimentos / g.count : 0;
  });

  const tableData = producoes.map((p) => {
    const totalAtendimentos = (p.chatTotal || 0) + (p.ligacaoTotal || 0);
    const mediaTurno = mediaPorTurno[p.turno || "N/A"] || 0;
    return [
      p.atendenteNome,
      p.turno || "-",
      (p.chatTotal || 0).toString(),
      (p.ligacaoTotal || 0).toString(),
      totalAtendimentos.toString(),
      mediaTurno.toFixed(2),
      `${p.performance.toFixed(1)}%`,
      `${p.pontosTotais}/${p.maxPontosTotais}`,
      p.elegivel ? "Elegível" : "Não Elegível",
      p.motivoNaoElegivel || "-",
    ];
  });

  const docAny = doc as any;
  const autoTableResult = (autoTable as any)(docAny, {
    head: [[
      "Atendente",
      "Turno",
      "Chats",
      "Ligações",
      "Total Atend.",
      "Média Turno",
      "Performance",
      "Pontos",
      "Status",
      "Motivo",
    ]],
    body: tableData,
    startY: yPosition,
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: darkColor,
      cellPadding: 3,
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: 10, right: 10, top: 10 },
    columnStyles: {
      0: { cellWidth: 40 }, // Atendente
      1: { cellWidth: 20, halign: "center" }, // Turno
      2: { cellWidth: 18, halign: "right" }, // Chats
      3: { cellWidth: 18, halign: "right" }, // Ligações
      4: { cellWidth: 22, halign: "right" }, // Total Atend.
      5: { cellWidth: 22, halign: "right" }, // Média Turno
      6: { cellWidth: 22, halign: "right" }, // Performance
      7: { cellWidth: 28, halign: "right" }, // Pontos
      8: { cellWidth: 30, halign: "center" }, // Status
      9: { cellWidth: 40 }, // Motivo
    },
    pageBreak: 'auto',
    didDrawPage: (data: any) => {
      const d = data.doc as any;
      const pageNumber = data.pageNumber || (d.internal ? d.internal.getNumberOfPages() : 1);

      // Draw header only on the first page
      if (pageNumber === 1) {
        // Defina logoY fora do bloco try para garantir escopo
        const logoWidth = 40;
        const logoHeight = 40;
        const logoY = 8;
        let logoDrawn = false;
        if (logoDataUrl) {
          try {
            const logoX = (pageWidth - logoWidth) / 2;
            d.addImage(logoDataUrl, "PNG", logoX, logoY, logoWidth, logoHeight);
            logoDrawn = true;
            console.log("[PDF] Logo desenhada na página 1");
          } catch (e) {
            console.error("[PDF] Erro ao desenhar logo no PDF:", e);
          }
        } else {
          console.warn("[PDF] Nenhuma logoDataUrl disponível, não desenhou imagem");
        }

        // Se a logo foi desenhada, posicione o título abaixo dela, senão use topo padrão
        const titleY = (logoDrawn ? logoY + logoHeight + 6 : 24);
        d.setFontSize(24);
        d.setTextColor(...darkColor);
        d.text("Relatório de Produção - Suporte Técnico", pageWidth / 2, titleY, { align: "center" });

        d.setFontSize(12);
        d.setTextColor(...lightGray);
        d.text(subtitle, pageWidth / 2, titleY + 8, { align: "center" });
        d.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, titleY + 16, { align: "center" });
      }

      // Footer on every page
      d.setFontSize(9);
      d.setTextColor(...lightGray);
      d.text(
        "Flip Performance - Sistema de Gestão de Bonificação",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    },
  });

  // Footer
  const finalY = autoTableResult?.finalY || docAny.lastAutoTable?.finalY || 200;
  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.text(
    "Flip Performance - Sistema de Gestão de Bonificação",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  return Buffer.from(doc.output("arraybuffer"));
}
