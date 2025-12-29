import imagekit from "@/lib/imagekit";

export async function DELETE(req) {
  try {
    const { fileId } = await req.json();

    if (!fileId) {
      return Response.json({ error: "fileId required" }, { status: 400 });
    }

    await imagekit.deleteFile(fileId);
    return Response.json({ success: true });
  } catch (error) {
    console.error("ImageKit delete error:", error);
    return Response.json({ error: "Deletion failed" }, { status: 500 });
  }
}
