import OpenAI from "openai";
const openai = new OpenAI();

const asstID = "asst_CBJDCm6zhzRFb761JsKx2LcX";

async function runAssistant(userInput) {
  const thread = await openai.beta.threads.create();
  const message = await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: userInput,
  });

  const message2 = await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: "ma cheama MosMartrin",
  });
  const run = openai.beta.threads.runs
    .stream(thread.id, {
      assistant_id: asstID,
    })
    .on("textCreated", (text) => process.stdout.write("\nassistant > "))
    .on("textDelta", (textDelta, snapshot) =>
      process.stdout.write(textDelta.value)
    )
    .on("toolCallCreated", (toolCall) =>
      process.stdout.write(`\nassistant > ${toolCall.type}\n\n`)
    )
    .on("toolCallDelta", (toolCallDelta, snapshot) => {
      if (toolCallDelta.type === "file_search") {
        if (toolCallDelta.code_interpreter.input) {
          process.stdout.write(toolCallDelta.code_interpreter.input);
        }
        if (toolCallDelta.code_interpreter.outputs) {
          process.stdout.write("\noutput >\n");
          toolCallDelta.code_interpreter.outputs.forEach((output) => {
            if (output.type === "logs") {
              process.stdout.write(`\n${output.logs}\n`);
            }
          });
        }
      }
    });
}

console.log(await runAssistant("cum te cheama?"));
