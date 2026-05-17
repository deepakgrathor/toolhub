import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { ApiResponse } from "@/lib/api-response";
// TODO: migrate remaining NextResponse.json calls to ApiResponse helpers
import { connectDB, BusinessProfile, User } from "@toolhub/db";
import { getPdfType } from "@/lib/plan-limits";
import { renderToBuffer } from "@react-pdf/renderer";
import { LitePDFTemplate, ProPDFTemplate } from "@/lib/pdf/templates";
import React from "react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.response;
    const { userId } = authResult;

    // STEP 1 — Auth + plan limits check
    const pdfType = await getPdfType(userId);

    if (pdfType === "none") {
      return NextResponse.json(
        { error: "PDF download requires LITE plan or above." },
        { status: 403 }
      );
    }

    const body = await req.json() as {
      toolSlug: string;
      toolName: string;
      content: string;
    };

    const { toolSlug, toolName, content } = body;

    const MAX_PDF_CONTENT = 50000;
    if (!content || typeof content !== "string" || content.length > MAX_PDF_CONTENT) {
      return ApiResponse.badRequest("Content too large for PDF generation");
    }

    // STEP 2 — Fetch brand assets (whitelabel only)
    const isWhitelabel = pdfType === "whitelabel";
    let brandAssets: {
      logoUrl: string | null;
      signatureUrl: string | null;
      letterheadColor: string;
      signatoryName: string;
      signatoryDesignation: string;
      businessName: string;
      businessAddress?: string;
      businessPhone?: string;
      businessEmail?: string;
    } | null = null;

    if (isWhitelabel) {
      await connectDB();
      const profile = await BusinessProfile.findOne({ userId }).lean();
      if (profile) {
        const user = await User.findById(userId).select("email").lean();
        brandAssets = {
          logoUrl: profile.logoUrl ?? null,
          signatureUrl: profile.signatureUrl ?? null,
          letterheadColor: profile.letterheadColor ?? "#7c3aed",
          signatoryName: profile.signatoryName ?? "",
          signatoryDesignation: profile.signatoryDesignation ?? "",
          businessName: profile.businessName ?? "My Business",
          businessAddress: profile.businessAddress ?? undefined,
          businessPhone: profile.phone ?? undefined,
          businessEmail: user?.email ?? undefined,
        };
      }
    }

    // STEP 3 — Generate PDF
    const date = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pdfElement: React.ReactElement<any>;

    if (isWhitelabel && brandAssets) {
      // Business/Enterprise → white-label PDF with user's own branding
      pdfElement = (
        <ProPDFTemplate
          title={toolName}
          content={content}
          date={date}
          logoUrl={brandAssets.logoUrl}
          signatureUrl={brandAssets.signatureUrl}
          letterheadColor={brandAssets.letterheadColor}
          signatoryName={brandAssets.signatoryName}
          signatoryDesignation={brandAssets.signatoryDesignation}
          businessName={brandAssets.businessName}
          businessAddress={brandAssets.businessAddress}
          businessPhone={brandAssets.businessPhone}
          businessEmail={brandAssets.businessEmail}
        />
      );
    } else {
      // Lite/Pro (branded) or whitelabel without brand assets → SetuLix-branded PDF
      pdfElement = (
        <LitePDFTemplate
          title={toolName}
          content={content}
          date={date}
          showWatermark={false}
        />
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(pdfElement as any);

    // STEP 4 — Return PDF
    const filename = `${toolSlug}-${Date.now()}.pdf`;
    const uint8 = new Uint8Array(pdfBuffer);

    return new Response(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": uint8.length.toString(),
      },
    });
  } catch (err) {
    console.error("[download-pdf]", err);
    return ApiResponse.error("PDF generation failed");
  }
}
