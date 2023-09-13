import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";	
import { openai } from "../lib/openai";

export async function generationAiCompletionRoute(app: FastifyInstance) {
  app.post("/ai/complete", async (req, replay) => {
 
    const bodySchema = z.object({
      template: z.string(),
      vidioId: z.string().uuid(),
      temperature: z.number().min(0).max(1).default(0.5)
    });
    const { vidioId, template, temperature } = bodySchema.parse(req.body);

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: vidioId,
      }
    });

    if (!video.transcription) {
      return replay.status(400).send({
        error: "Video transcription was not generated yet."
      })
    }

    const promptMessage = template.replace('{transcription}', video.transcription);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "user",
          content: promptMessage,
        }
      ],
      temperature,
    });

    return response

  });
}