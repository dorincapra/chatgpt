import express from "express";
import { OpenAI } from "openai";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Allow CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Main page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Chat route
app.post("/chat", async (req, res) => {
  const userInput = req.body.userInput;
  try {
    const openai = new OpenAI(
      "sk-proj-nyQNDIRn1vkdibiT52uUT3BlbkFJ5kq3H3QwhrMzoWfN7rWv"
    );
    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: userInput }],
      stream: true,
    });

    for await (const chunk of stream) {
      res.write(chunk.choices[0]?.delta?.content || "");
    }
    res.end();
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while processing the request.");
  }
});
let thread = null;

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
      // .on("toolCallCreated", (toolCall) =>
      //   res.write(`\nassistant > ${toolCall.type}\n\n`)
      // )
      .on("toolCallDelta", (toolCallDelta, snapshot) => {
        if (toolCallDelta.type === "file_search") {
          if (toolCallDelta.file_search.input) {
            // res.write(toolCallDelta.file_search.input);
          }
          if (toolCallDelta.file_search.outputs) {
            res.write("\noutput >\n");
            toolCallDelta.file_search.outputs.forEach((output) => {
              if (output.type === "logs") {
                // res.write(`\n${output.logs}\n`);
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

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
