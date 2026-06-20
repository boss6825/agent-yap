import { answerQuestion } from "@/lib/ask";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const question =
    typeof body === "object" &&
    body !== null &&
    "question" in body &&
    typeof body.question === "string"
      ? body.question.trim()
      : "";

  if (!question) {
    return Response.json({ error: "Question is required." }, { status: 400 });
  }

  const answer = await answerQuestion(question);

  return Response.json(answer);
}
