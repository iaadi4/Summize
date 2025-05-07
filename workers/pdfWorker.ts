import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { redis } from "../lib/redis";

const prisma = new PrismaClient();

const worker = new Worker(
  "pdf-summarization",
  async (job) => {
    const { fileUrl, userId } = job.data;

    if (!fileUrl) throw new Error("Missing fileUrl");

    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error("Failed to download PDF from S3");
    const buffer = await res.arrayBuffer();

    const tempFilename = path.join("/tmp", `${uuidv4()}.pdf`);
    await fs.writeFile(tempFilename, Buffer.from(buffer));

    try {
      const loader = new PDFLoader(tempFilename);
      const docs: Document[] = await loader.load();
      const text = docs.map((doc) => doc.pageContent).join("\n");

      const model = new ChatGoogleGenerativeAI({
        model: "gemini-1.5-flash",
        temperature: 0.7,
        apiKey: process.env.GOOGLE_API_KEY!,
      });

      console.log(text.slice(0, 12000));

      const response = await model.invoke([
        {
          role: "user",
          content: `Summarize the following document:\n\n${text.slice(
            0,
            12000
          )}`,
        },
      ]);

      console.log(response);

      const summary = (response?.content as string) ?? "Summary failed";

      await prisma.pdfSummary.create({
        data: {
          fileUrl,
          summary,
          userId,
        },
      });

      console.log(`✅ Job ${job.id} processed successfully`);
    } finally {
      await fs.unlink(tempFilename);
    }
  },
  { connection: redis }
);

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});
