import { Queue } from "bullmq";
import { redis } from "@/lib/redis";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { NextApiRequest, NextApiResponse } from "next";

const session = await auth.api.getSession({
  headers: await headers(),
});
const queue = new Queue("pdf-summarization", { connection: redis });

export default async function POST(req: NextApiRequest, res: NextApiResponse) {
  if (!session?.user?.id)
    return res.status(401).json({ error: "Unauthorized" });

  const { fileUrl } = req.body;
  if (!fileUrl) return res.status(400).json({ error: "Missing fileUrl" });

  await queue.add("summarize", {
    fileUrl,
    userId: session.user.id,
  });

  return res.status(200).json({ status: "queued" });
}
