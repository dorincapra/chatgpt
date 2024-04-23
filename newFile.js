import { OpenAI } from "openai";
import { app, thread } from ".";

app.post("/assistant", async (req, res) => {
  // Send the user's message first
  const userInput = req.body.userInput;
  try {
    const openai = new OpenAI(
      "sk-proj-nyQNDIRn1vkdibiT52uUT3BlbkFJ5kq3H3QwhrMzoWfN7rWv"
    );
    const asstID = "asst_CBJDCm6zhzRFb761JsKx2LcX";

    // Creați un fir nou doar dacă nu există deja unul
    if (!thread) {
      thread = await openai.beta.threads.create();
    }

    // Adăugați mesajul utilizatorului la firul existent
    const message = await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: userInput,
    });
    const run = openai.beta.threads.runs
      .stream(thread.id, {
        assistant_id: asstID,
      })
      .on("textCreated", (text) => res.write("\nassistant > "))
      .on("textDelta", (textDelta, snapshot) => res.write(textDelta.value))
      .on("toolCallCreated", (toolCall) =>
        res.write(`\nassistant > ${toolCall.type}\n\n`)
      )
      .on("toolCallDelta", (toolCallDelta, snapshot) => {
        if (toolCallDelta.type === "file_search") {
          if (toolCallDelta.file_search.input) {
            // res.write(toolCallDelta.file_search.input);
            console.log("file_search");
          }
          if (toolCallDelta.file_search.outputs) {
            res.write("\noutput >\n");
            toolCallDelta.file_search.outputs.forEach((output) => {
              if (output.type === "logs") {
                res.write(`\n${output.logs}\n`);
              }
            });
          }
        }
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing the request.");
  }
});
