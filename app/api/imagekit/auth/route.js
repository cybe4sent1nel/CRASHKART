import imagekit from "@/lib/imagekit";

export async function GET() {
  try {
    const result = imagekit.getAuthenticationParameters();
    return Response.json(result);
  } catch (error) {
    console.error("ImageKit auth error:", error);
    return Response.json({ error: "Authentication failed" }, { status: 500 });
  }
}
