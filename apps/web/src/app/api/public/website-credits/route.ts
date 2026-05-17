import { NextResponse } from "next/server";
import { getSiteConfigValue } from "@/lib/site-config-cache";
import { withCache } from "@/lib/with-cache";

const CACHE_KEY = "website-credits-config";
const CACHE_TTL = 3600; // 1 hour

export async function GET() {
  try {
    const config = await withCache(CACHE_KEY, CACHE_TTL, async () => {
      const [
        base,
        page2,
        page3,
        page4,
        testimonials,
        pricing,
        faq,
        team,
        whatsapp,
        maps,
        social,
        animation,
        darkMode,
        publish,
        update,
      ] = await Promise.all([
        getSiteConfigValue("website_base_credits", 50),
        getSiteConfigValue("website_page_2_credits", 15),
        getSiteConfigValue("website_page_3_credits", 15),
        getSiteConfigValue("website_page_4_credits", 15),
        getSiteConfigValue("website_testimonials_credits", 3),
        getSiteConfigValue("website_pricing_credits", 3),
        getSiteConfigValue("website_faq_credits", 3),
        getSiteConfigValue("website_team_credits", 3),
        getSiteConfigValue("website_whatsapp_credits", 2),
        getSiteConfigValue("website_maps_credits", 2),
        getSiteConfigValue("website_social_credits", 1),
        getSiteConfigValue("website_animation_credits", 5),
        getSiteConfigValue("website_darkmode_credits", 5),
        getSiteConfigValue("website_publish_credits", 10),
        getSiteConfigValue("website_update_credits", 5),
      ]);

      return {
        base: Number(base),
        page2: Number(page2),
        page3: Number(page3),
        page4: Number(page4),
        testimonials: Number(testimonials),
        pricing: Number(pricing),
        faq: Number(faq),
        team: Number(team),
        whatsapp: Number(whatsapp),
        maps: Number(maps),
        social: Number(social),
        animation: Number(animation),
        darkMode: Number(darkMode),
        publish: Number(publish),
        update: Number(update),
      };
    });

    return NextResponse.json(config, {
      headers: {
        "Cache-Control": "public, s-maxage=3600",
      },
    });
  } catch {
    return NextResponse.json(
      {
        base: 50,
        page2: 15,
        page3: 15,
        page4: 15,
        testimonials: 3,
        pricing: 3,
        faq: 3,
        team: 3,
        whatsapp: 2,
        maps: 2,
        social: 1,
        animation: 5,
        darkMode: 5,
        publish: 10,
        update: 5,
      },
      {
        headers: { "Cache-Control": "public, s-maxage=3600" },
      }
    );
  }
}
