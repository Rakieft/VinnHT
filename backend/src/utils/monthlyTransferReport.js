import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const COLORS = {
  navy: "0F172A",
  blue: "2563EB",
  gold: "F59E0B",
  slate: "64748B",
  paleBlue: "EFF6FF",
  paleGold: "FFFBEB",
  border: "DCE5F2",
  white: "FFFFFF",
};

const money = (value) =>
  `${Number(value || 0).toLocaleString("fr-HT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} HTG`;

const displayDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("fr-HT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 5, color: COLORS.border },
  bottom: { style: BorderStyle.SINGLE, size: 5, color: COLORS.border },
  left: { style: BorderStyle.SINGLE, size: 5, color: COLORS.border },
  right: { style: BorderStyle.SINGLE, size: 5, color: COLORS.border },
};

const reportCell = (text, width, options = {}) =>
  new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: cellBorders,
    shading: options.fill
      ? { fill: options.fill, type: ShadingType.CLEAR }
      : undefined,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    verticalAlign: "center",
    children: [
      new Paragraph({
        alignment: options.alignment || AlignmentType.LEFT,
        spacing: { before: 0, after: 0, line: 260 },
        children: [
          new TextRun({
            text: String(text ?? "-"),
            font: "Calibri",
            size: options.size || 18,
            bold: options.bold || false,
            color: options.color || COLORS.navy,
          }),
        ],
      }),
    ],
  });

const metricCell = (label, value, fill) =>
  new TableCell({
    width: { size: 3120, type: WidthType.DXA },
    borders: cellBorders,
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 180, bottom: 180, left: 180, right: 180 },
    children: [
      new Paragraph({
        spacing: { after: 70 },
        children: [
          new TextRun({
            text: label.toUpperCase(),
            font: "Calibri",
            size: 17,
            bold: true,
            color: COLORS.slate,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 0 },
        children: [
          new TextRun({
            text: value,
            font: "Calibri",
            size: 26,
            bold: true,
            color: COLORS.navy,
          }),
        ],
      }),
    ],
  });

export const buildMonthlyTransferDocx = async ({ period, transfers }) => {
  const total = transfers.reduce((sum, transfer) => sum + Number(transfer.amount || 0), 0);
  const shops = new Set(transfers.map((transfer) => transfer.seller_id)).size;
  const columnWidths = [900, 1550, 1280, 1180, 1150, 1700, 1600];

  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        ["Date", 900],
        ["Boutique", 1550],
        ["Titulaire", 1280],
        ["MonCash", 1180],
        ["Montant", 1150],
        ["Référence", 1700],
        ["Responsable", 1600],
      ].map(([label, width]) =>
        reportCell(label, width, {
          fill: COLORS.navy,
          color: COLORS.white,
          bold: true,
          alignment: AlignmentType.CENTER,
        }),
      ),
    }),
    ...transfers.map(
      (transfer, index) =>
        new TableRow({
          cantSplit: true,
          children: [
            reportCell(displayDate(transfer.paid_at), columnWidths[0], {
              alignment: AlignmentType.CENTER,
              fill: index % 2 ? COLORS.white : "F8FAFC",
            }),
            reportCell(transfer.seller_name, columnWidths[1], {
              bold: true,
              fill: index % 2 ? COLORS.white : "F8FAFC",
            }),
            reportCell(transfer.moncash_account_name, columnWidths[2], {
              fill: index % 2 ? COLORS.white : "F8FAFC",
            }),
            reportCell(transfer.moncash_number, columnWidths[3], {
              alignment: AlignmentType.CENTER,
              fill: index % 2 ? COLORS.white : "F8FAFC",
            }),
            reportCell(money(transfer.amount), columnWidths[4], {
              bold: true,
              alignment: AlignmentType.RIGHT,
              fill: index % 2 ? COLORS.white : "F8FAFC",
            }),
            reportCell(transfer.payment_reference || "-", columnWidths[5], {
              fill: index % 2 ? COLORS.white : "F8FAFC",
            }),
            reportCell(transfer.manager_name || "Finance VinnHT", columnWidths[6], {
              fill: index % 2 ? COLORS.white : "F8FAFC",
            }),
          ],
        }),
    ),
  ];

  if (!transfers.length) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 7,
            borders: cellBorders,
            margins: { top: 300, bottom: 300, left: 180, right: 180 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Aucun virement vendeur confirmé durant cette période.",
                    font: "Calibri",
                    size: 21,
                    color: COLORS.slate,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );
  }

  const document = new Document({
    creator: "VinnHT",
    title: `Rapport mensuel des virements - ${period.label}`,
    description: "Rapport financier mensuel des virements effectués aux boutiques VinnHT.",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22, color: COLORS.navy },
          paragraph: { spacing: { after: 120, line: 264 } },
        },
      },
      paragraphStyles: [
        {
          id: "ReportTitle",
          name: "Report Title",
          basedOn: "Normal",
          next: "Normal",
          run: { font: "Calibri", size: 42, bold: true, color: COLORS.navy },
          paragraph: { spacing: { before: 0, after: 100 } },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: "Calibri", size: 32, bold: true, color: COLORS.blue },
          paragraph: { spacing: { before: 300, after: 160 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "VinnHT · Rapport confidentiel · Page ", color: COLORS.slate, size: 17 }),
                  new TextRun({ children: [PageNumber.CURRENT], color: COLORS.slate, size: 17 }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "VINNHT FINANCE", font: "Calibri", size: 18, bold: true, color: COLORS.gold }),
            ],
          }),
          new Paragraph({
            style: "ReportTitle",
            children: [new TextRun("Rapport mensuel des virements")],
          }),
          new Paragraph({
            spacing: { after: 260 },
            children: [
              new TextRun({
                text: `Période du ${displayDate(period.start)} au ${displayDate(period.end)} · Généré le ${displayDate(new Date())}`,
                font: "Calibri",
                size: 21,
                color: COLORS.slate,
              }),
            ],
          }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [3120, 3120, 3120],
            rows: [
              new TableRow({
                children: [
                  metricCell("Virements confirmés", String(transfers.length), COLORS.paleBlue),
                  metricCell("Boutiques payées", String(shops), COLORS.paleGold),
                  metricCell("Montant total", money(total), COLORS.paleBlue),
                ],
              }),
            ],
          }),
          new Paragraph({
            text: "Détail des virements",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: "Seuls les virements marqués comme payés et disposant d’une confirmation enregistrée sont inclus.",
                font: "Calibri",
                size: 19,
                color: COLORS.slate,
              }),
            ],
          }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths,
            rows,
          }),
          new Paragraph({
            spacing: { before: 220, after: 0 },
            children: [
              new TextRun({
                text: "Document généré automatiquement à partir du registre financier VinnHT. Toute correction doit être tracée dans la plateforme.",
                font: "Calibri",
                size: 17,
                italics: true,
                color: COLORS.slate,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(document);
};
