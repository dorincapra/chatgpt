document
  .getElementById("chat-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const userInput = document.getElementById("user-input").value.trim();
    if (userInput === "") return;

    try {
      const chatArea = document.getElementById("chat-area");

      // Append user's message to chat area
      const userMessageParagraph = document.createElement("p");
      userMessageParagraph.textContent = `Tu: ${userInput}`;
      chatArea.appendChild(userMessageParagraph);

      // Clear input field
      document.getElementById("user-input").value = "";

      // Fetch response from server
      const response = await fetch("/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ userInput: userInput }),
      });

      // Check if response is successful
      if (!response.ok) {
        throw new Error(
          `Server responded with status ${response.status}`
        );
      }

      // Process response bit by bit
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partialResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk of data and add it to the partial response
        const chunk = decoder.decode(value, { stream: true });
        partialResponse += chunk;

        // Split partial response into paragraphs
        const paragraphs = partialResponse.split("\n");

        // Concatenate all response fragments into one paragraph
        let aiResponseText = "";
        paragraphs.forEach((paragraph) => {
          // Remove "assistant > " from the beginning of each paragraph
          const responseText = paragraph.replace(
            /^assistant > /,
            "Kidzy: "
          );
          aiResponseText += responseText;
        });

        // Create a single paragraph for the concatenated response
        const aiResponseParagraph = document.createElement("p");
        aiResponseParagraph.textContent = aiResponseText;

        // Clear the chat area before appending the new response
        if (chatArea.lastElementChild.textContent.startsWith("Kidzy:")) {
          chatArea.removeChild(chatArea.lastElementChild);
        }

        // Append the concatenated paragraph to chat area
        chatArea.appendChild(aiResponseParagraph);

        // Update partial response with remaining text
        partialResponse = paragraphs.pop() || "";
      }
    } catch (error) {
      console.error("A apărut o eroare:", error);
      // Display error message in chat area
      const errorParagraph = document.createElement("p");
      errorParagraph.textContent = `A apărut o eroare: ${error.message}`;
      document.getElementById("chat-area").appendChild(errorParagraph);
    }
  });
