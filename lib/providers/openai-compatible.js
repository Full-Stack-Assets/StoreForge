const { parseModelJson } = require("../content-prompts");

async function chatCompletion({ baseUrl, apiKey, model, prompt, temperature, maxTokens, extraHeaders = {} }) {
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are an editorial JSON generator for niche blogs. Return only valid JSON."
        },
        { role: "user", content: prompt }
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `HTTP ${response.status}`;
    throw new Error(`${model} API error: ${message}`);
  }

  const text = payload?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Empty response from ${model}`);
  return parseModelJson(text);
}

module.exports = { chatCompletion };
