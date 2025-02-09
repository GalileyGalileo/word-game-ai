let words = [];
let translations = [];
let correctCount = parseInt(localStorage.getItem("correctCount")) || 0;
let incorrectCount = parseInt(localStorage.getItem("incorrectCount")) || 0;
let elapsedTime = parseInt(localStorage.getItem("elapsedTime")) || 0;
let timer;
let currentWordIndex = 0;
let previousWords = [];

// DeepSeek API endpoint and API key (replace with your actual API key)
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"; // Replace with the actual API endpoint
const DEEPSEEK_API_KEY = "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"; // Replace with your actual API key

document.addEventListener("DOMContentLoaded", function () {
    updateStats();
});

async function startLearning() {
    // Call the DeepSeek API to generate word pairs
    const wordPairs = await generateWordPairsFromAPI();

    if (wordPairs && wordPairs.length > 0) {
        words = wordPairs.map(pair => pair.word);
        translations = wordPairs.map(pair => pair.translation);

        document.getElementById("header").classList.add("hidden");
        const stopButton = document.createElement('button');
        stopButton.id = 'stopButton';
        stopButton.innerText = 'Stop';
        stopButton.onclick = stopLearning;
        document.body.appendChild(stopButton);

        document.getElementById("backButton").style.display = "block";

        correctCount = 0;
        incorrectCount = 0;
        elapsedTime = 0;
        updateStats();
        timer = setInterval(() => {
            elapsedTime++;
            updateStats();
        }, 1000);
        nextWord();
    } else {
        alert("Failed to generate word pairs. Please try again.");
    }
}

async function generateWordPairsFromAPI() {
    const prompt = "Generate a list of 50 random English words with their translations in Russian. The words should be common, everyday vocabulary suitable for language learners. Provide the output in the following format:\n\n```json\n[\n    { \"word\": \"apple\", \"translation\": \"яблоко\" },\n    { \"word\": \"car\", \"translation\": \"машина\" },\n    { \"word\": \"dog\", \"translation\": \"собака\" },\n    { \"word\": \"house\", \"translation\": \"дом\" },\n    { \"word\": \"book\", \"translation\": \"книга\" },\n    ...\n]\n```";

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat", // Replace with the correct model name
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 1000 // Adjust as needed
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0] && data.choices[0].message) {
            const generatedText = data.choices[0].message.content;

            // Extract the JSON array from the generated text
            const jsonStart = generatedText.indexOf("[");
            const jsonEnd = generatedText.lastIndexOf("]") + 1;
            const jsonString = generatedText.slice(jsonStart, jsonEnd);

            // Parse the JSON string into an array of word pairs
            const wordPairs = JSON.parse(jsonString);
            return wordPairs;
        } else {
            console.error("Failed to generate word pairs:", data);
            return null;
        }
    } catch (error) {
        console.error("Error calling DeepSeek API:", error);
        return null;
    }
}

function stopLearning() {
    clearInterval(timer);
    localStorage.setItem("correctCount", correctCount);
    localStorage.setItem("incorrectCount", incorrectCount);
    localStorage.setItem("elapsedTime", elapsedTime);
    document.getElementById("header").classList.remove("hidden");
    document.getElementById("stopButton").remove();
    document.getElementById("backButton").style.display = "none";
    document.getElementById("word-container").innerText = "";
    document.getElementById("options-container").innerHTML = "";
    document.getElementById("result").innerText = "";
}

function nextWord() {
    if (words.length < 4 || translations.length < 4) {
        alert("Not enough data to generate options");
        return;
    }
    currentWordIndex = Math.floor(Math.random() * words.length);
    previousWords.push(currentWordIndex);
    document.getElementById('word-container').innerText = words[currentWordIndex];
    generateOptions(currentWordIndex);
}

function generateOptions(correctIndex) {
    let correctAnswer = translations[correctIndex];
    let options = [correctAnswer];
    while (options.length < 4) {
        let randomIndex = Math.floor(Math.random() * translations.length);
        let randomTranslation = translations[randomIndex];
        if (!options.includes(randomTranslation)) {
            options.push(randomTranslation);
        }
    }
    options.sort(() => Math.random() - 0.5);

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        button.innerText = option;
        button.onclick = () => checkAnswer(option, correctAnswer, button);
        optionsContainer.appendChild(button);
    });
}

function checkAnswer(selectedWord, correctAnswer, selectedButton) {
    const resultContainer = document.getElementById('result');
    const buttons = document.querySelectorAll('#options-container button');

    buttons.forEach(button => {
        if (button.innerText === correctAnswer) {
            button.classList.add('correct');
        }
    });

    if (selectedWord === correctAnswer) {
        correctCount++;
        resultContainer.innerText = "Correct!";
        resultContainer.style.color = "green";
        selectedButton.classList.add('correct');
        setTimeout(() => {
            resultContainer.innerText = "";
            buttons.forEach(button => {
                button.classList.remove('correct', 'incorrect');
            });
            nextWord();
        }, 1000);
    } else {
        incorrectCount++;
        resultContainer.innerText = "Incorrect";
        resultContainer.style.color = "red";
        selectedButton.classList.add('incorrect');
        setTimeout(() => {
            resultContainer.innerText = "";
            buttons.forEach(button => {
                button.classList.remove('correct', 'incorrect');
            });
            nextWord();
        }, 2000);
    }
    updateStats();
}

function updateStats() {
    document.getElementById("stats").innerText = `Correct: ${correctCount} | Incorrect: ${incorrectCount} | Time: ${elapsedTime} sec`;
}

function goBack() {
    if (previousWords.length > 1) {
        previousWords.pop();
        const previousWordIndex = previousWords[previousWords.length - 1];
        document.getElementById('word-container').innerText = words[previousWordIndex];
        generateOptions(previousWordIndex);
    } else {
        alert("No previous words");
    }
}