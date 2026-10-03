const OLLAMA_URL =
  "http://localhost:11434/api/chat";

export const askLlama = async (messages) => {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => {
      controller.abort();
    }, 120000); // 120 seconds

  try {
    const response =
      await fetch(
        OLLAMA_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            model: "llama3.2",
            messages,
            stream: false
          }),

          signal:
            controller.signal
        }
      );

    if (!response.ok) {
      throw new Error(
        `Ollama error: ${response.status}`
      );
    }

    const data =
      await response.json();

    if (
      !data?.message?.content
    ) {
      throw new Error(
        "Ollama returned an empty response."
      );
    }

    return data.message.content;

  } catch (error) {

    if (
      error.name ===
      "AbortError"
    ) {
      throw new Error(
        "Ollama took more than 120 seconds to respond. Check whether the local Llama model is running slowly."
      );
    }

    if (
      error?.cause?.code ===
      "UND_ERR_HEADERS_TIMEOUT"
    ) {
      throw new Error(
        "Ollama did not respond in time. The local Llama model may be taking too long to start or generate a response."
      );
    }

    throw error;

  } finally {
    clearTimeout(timeout);
  }
};