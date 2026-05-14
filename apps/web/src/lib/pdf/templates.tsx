import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LitePDFProps {
  title: string;
  content: string;
  date: string;
  showWatermark?: boolean;
}

export interface ProPDFProps {
  title: string;
  content: string;
  date: string;
  logoUrl: string | null;
  signatureUrl: string | null;
  letterheadColor: string;
  signatoryName: string;
  signatoryDesignation: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
}

// ── LITE PDF Template ─────────────────────────────────────────────────────────

const liteStyles = StyleSheet.create({
  page: { fontFamily: "Helvetica", paddingTop: 40, paddingBottom: 40, paddingHorizontal: 40, fontSize: 11 },
  header: { backgroundColor: "#7c3aed", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, padding: 14, marginHorizontal: -40, marginTop: -40, paddingHorizontal: 40 },
  headerBrand: { color: "#ffffff", fontSize: 18, fontFamily: "Helvetica-Bold" },
  headerDate: { color: "#ffffff", fontSize: 10, opacity: 0.85 },
  titleSection: { marginBottom: 16 },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#111111", marginBottom: 8 },
  divider: { height: 2, backgroundColor: "#7c3aed", marginBottom: 16 },
  content: { fontSize: 11, lineHeight: 1.6, color: "#222222" },
  contentLine: { fontSize: 11, lineHeight: 1.6, color: "#222222", marginBottom: 4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8 },
  footerText: { fontSize: 9, color: "#9ca3af" },
});

export function LitePDFTemplate({ title, content, date, showWatermark = false }: LitePDFProps): React.ReactElement {
  const lines = content.split("\n");

  return (
    <Document>
      <Page size="A4" style={liteStyles.page}>
        {/* Header */}
        <View style={liteStyles.header}>
          <Text style={liteStyles.headerBrand}>SetuLix</Text>
          <Text style={liteStyles.headerDate}>{date}</Text>
        </View>

        {/* Title */}
        <View style={liteStyles.titleSection}>
          <Text style={liteStyles.title}>{title}</Text>
          <View style={liteStyles.divider} />
        </View>

        {/* Content */}
        <View>
          {lines.map((line, i) => (
            <Text key={i} style={liteStyles.contentLine}>{line || " "}</Text>
          ))}
        </View>

        {/* Footer */}
        <View style={liteStyles.footer} fixed>
          <Text style={liteStyles.footerText}>
            {showWatermark ? "Generated with SetuLix — setulix.com" : ""}
          </Text>
          <Text style={liteStyles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

// ── PRO PDF Template ──────────────────────────────────────────────────────────

function makeProStyles(color: string) {
  return StyleSheet.create({
    page: { fontFamily: "Helvetica", paddingTop: 0, paddingBottom: 40, paddingHorizontal: 40, fontSize: 11 },
    header: { backgroundColor: color, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, padding: 14, marginHorizontal: -40, paddingHorizontal: 40 },
    headerLeft: { flex: 1 },
    headerRight: { flex: 1, alignItems: "flex-end" },
    headerLogo: { height: 48, objectFit: "contain" },
    headerBrandName: { color: "#ffffff", fontSize: 16, fontFamily: "Helvetica-Bold" },
    headerSubName: { color: "#ffffff", fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 2 },
    headerMeta: { color: "#ffffff", fontSize: 9, opacity: 0.85, marginBottom: 1 },
    titleSection: { marginBottom: 16 },
    title: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#111111", marginBottom: 4 },
    titleDate: { fontSize: 10, color: "#6b7280", marginBottom: 8 },
    divider: { height: 2, backgroundColor: color, marginBottom: 16 },
    contentLine: { fontSize: 11, lineHeight: 1.6, color: "#222222", marginBottom: 4 },
    sigSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
    sigLabel: { fontSize: 10, color: "#6b7280", marginBottom: 6 },
    sigImage: { height: 48, width: 120, objectFit: "contain", marginBottom: 4 },
    sigSpace: { height: 48, marginBottom: 4 },
    sigName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111111" },
    sigDesig: { fontSize: 10, color: "#6b7280" },
    footer: { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: color, paddingTop: 6 },
    footerText: { fontSize: 8, color: "#9ca3af" },
  });
}

export function ProPDFTemplate({
  title,
  content,
  date,
  logoUrl,
  signatureUrl,
  letterheadColor,
  signatoryName,
  signatoryDesignation,
  businessName,
  businessAddress,
  businessPhone,
  businessEmail,
}: ProPDFProps): React.ReactElement {
  const s = makeProStyles(letterheadColor);
  const lines = content.split("\n");

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {logoUrl ? (
              <Image src={logoUrl} style={s.headerLogo} />
            ) : (
              <Text style={s.headerBrandName}>{businessName}</Text>
            )}
          </View>
          <View style={s.headerRight}>
            {logoUrl && <Text style={s.headerSubName}>{businessName}</Text>}
            {businessAddress ? <Text style={s.headerMeta}>{businessAddress}</Text> : null}
            {businessPhone ? <Text style={s.headerMeta}>{businessPhone}</Text> : null}
            {businessEmail ? <Text style={s.headerMeta}>{businessEmail}</Text> : null}
          </View>
        </View>

        {/* Title */}
        <View style={s.titleSection}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.titleDate}>{date}</Text>
          <View style={s.divider} />
        </View>

        {/* Content */}
        <View>
          {lines.map((line, i) => (
            <Text key={i} style={s.contentLine}>{line || " "}</Text>
          ))}
        </View>

        {/* Signature */}
        <View style={s.sigSection}>
          <Text style={s.sigLabel}>Authorized Signatory:</Text>
          {signatureUrl ? (
            <Image src={signatureUrl} style={s.sigImage} />
          ) : (
            <View style={s.sigSpace} />
          )}
          {signatoryName ? <Text style={s.sigName}>{signatoryName}</Text> : null}
          {signatoryDesignation ? <Text style={s.sigDesig}>{signatoryDesignation}</Text> : null}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{businessName}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
