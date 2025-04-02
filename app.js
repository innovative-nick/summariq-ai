// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

// Global variables
let currentQuiz = [];
let displayedQuestions = 0;

// Event listeners
document.getElementById('fileUpload').addEventListener('change', showFileName);
document.getElementById('uploadBtn').addEventListener('click', processFile);
document.getElementById('generateQuizBtn').addEventListener('click', showQuiz);

function showFileName() {
    const fileInput = document.getElementById('fileUpload');
    const fileNameDisplay = document.getElementById('fileName');
    if (fileInput.files.length) {
        fileNameDisplay.textContent = fileInput.files[0].name;
        fileNameDisplay.style.display = 'block';
    } else {
        fileNameDisplay.style.display = 'none';
    }
}

async function processFile() {
    const fileInput = document.getElementById('fileUpload');
    if (!fileInput.files.length) return alert('Please select a file');
    
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    uploadBtn.disabled = true;

    try {
        const file = fileInput.files[0];
        const text = await extractText(file);
        const summary = generateSummary(text);
        const quiz = generateQuiz(text);

        document.getElementById('summaryText').textContent = summary;
        document.querySelector('.summary-section').classList.remove('hidden');
        
        currentQuiz = quiz;
        displayedQuestions = 0;
        document.querySelector('.quiz-section').classList.add('hidden');
    } catch (error) {
        alert('Failed to process file: ' + error.message);
    } finally {
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload File';
        uploadBtn.disabled = false;
    }
}

async function extractText(file) {
    return new Promise((resolve, reject) => {
        if (file.type === "application/pdf") {
            const fileReader = new FileReader();
            fileReader.onload = async function() {
                try {
                    const pdf = await pdfjsLib.getDocument(this.result).promise;
                    let text = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map(item => item.str).join(" ") + "\n";
                    }
                    resolve(text);
                } catch (err) {
                    reject(err);
                }
            };
            fileReader.readAsArrayBuffer(file);
        } 
        else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            const fileReader = new FileReader();
            fileReader.onload = function() {
                mammoth.extractRawText({arrayBuffer: this.result})
                    .then(result => resolve(result.value))
                    .catch(err => reject(err));
            };
            fileReader.readAsArrayBuffer(file);
        }
        else {
            const fileReader = new FileReader();
            fileReader.onload = function() {
                resolve(this.result);
            };
            fileReader.readAsText(file);
        }
    });
}

function generateSummary(text) {
    // Clean and prepare text
    text = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length < 3) return "This document is too short for a detailed summary.";

    // Extract content for each section
    const mainTopic = truncate(sentences[0], 150);
    const keyFocus = sentences.length > 1 ? truncate(sentences[1], 100) : "key topics";
    const mainArgument = sentences.length > 2 ? truncate(sentences[2], 120) : "important concepts";
    const introIdea = sentences.length > 3 ? truncate(sentences[3], 100) : "fundamental principles";
    const keyThemes = [
        sentences.length > 4 ? truncate(sentences[4], 80) : "primary theme",
        sentences.length > 5 ? truncate(sentences[5], 80) : "secondary theme",
        sentences.length > 6 ? truncate(sentences[6], 80) : "additional theme"
    ];
    const majorInsight = sentences.length > 7 ? truncate(sentences[7], 120) : "core findings";
    const supportingArgument = sentences.length > 8 ? truncate(sentences[8], 120) : "supporting evidence";

    // Build summary in exact requested format
    return `This file is about ${mainTopic} and explores ${keyFocus}. It provides insights into ${mainArgument}, making it essential for students, researchers, and professionals.

To break it down, the document first discusses ${introIdea}, helping to set the stage for understanding the main concept. It then moves on to examine ${keyThemes[0]}, explaining how these ideas relate to the overall topic. Throughout the document, key themes such as ${keyThemes.join(", ")} are highlighted, providing a deeper understanding of their connections.

One of the most important takeaways is ${majorInsight}, which helps the reader grasp why this information matters. Additionally, it emphasizes ${supportingArgument}, reinforcing the value of these concepts.

By the end, readers will have a clear understanding of ${mainTopic}, with all key information presented in a concise format.`;

    function truncate(str, n) {
        return str.length > n ? str.substring(0, n) + "..." : str;
    }
}

function generateQuiz(text, numQuestions=5) {
    text = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const quiz = [];
    const usedSentences = new Set();

    for (let i = 0; i < Math.min(numQuestions, sentences.length); i++) {
        const sentence = sentences[i];
        if (usedSentences.has(sentence)) continue;
        usedSentences.add(sentence);

        const words = sentence.split(/\s+/)
            .filter(w => w.length > 3)
            .filter(w => !['this','that','these','those','which'].includes(w.toLowerCase()));

        if (words.length >= 2) {
            const blankWord = words[Math.floor(Math.random() * words.length)];
            const options = [blankWord];
            
            // Add distractors from other sentences
            for (let j = 0; j < sentences.length && options.length < 4; j++) {
                if (i !== j) {
                    const otherWords = sentences[j].split(/\s+/)
                        .filter(w => w.length > 3 && w !== blankWord);
                    if (otherWords.length) {
                        options.push(otherWords[Math.floor(Math.random() * otherWords.length)]);
                    }
                }
            }
            
            quiz.push({
                question: `Complete: ${sentence.replace(blankWord, "_____")}`,
                options: shuffleArray([...new Set(options)]).slice(0, 4),
                answer: blankWord
            });
        }
    }
    return quiz;

    function shuffleArray(array) {
        return array.sort(() => Math.random() - 0.5);
    }
}

function showQuiz() {
    const quizContainer = document.getElementById('quizQuestions');
    quizContainer.innerHTML = '';
    
    if (!currentQuiz || currentQuiz.length === 0) {
        quizContainer.innerHTML = '<p>No quiz questions could be generated.</p>';
    } else {
        currentQuiz.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question';
            questionDiv.innerHTML = `
                <div class="question-text">${q.question}</div>
                <div class="options">
                    ${q.options.map(opt => `
                        <div class="option" data-correct="${opt === q.answer}">${opt}</div>
                    `).join('')}
                </div>
                <div class="feedback hidden"></div>
            `;
            quizContainer.appendChild(questionDiv);
        });
    }
    
    document.querySelector('.quiz-section').classList.remove('hidden');
    document.getElementById('questionsCount').textContent = currentQuiz?.length || 0;
}

// Handle answer selection
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('option')) {
        const option = e.target;
        const questionDiv = option.closest('.question');
        const feedback = questionDiv.querySelector('.feedback');
        const isCorrect = option.dataset.correct === 'true';

        // Clear previous feedback
        questionDiv.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('correct', 'incorrect');
        });

        // Show feedback
        if (isCorrect) {
            option.classList.add('correct');
            feedback.textContent = 'Correct!';
            feedback.style.color = '#10b981';
        } else {
            option.classList.add('incorrect');
            questionDiv.querySelector('.option[data-correct="true"]').classList.add('correct');
            feedback.textContent = `Answer: ${option.dataset.answer}`;
            feedback.style.color = '#ef4444';
        }
        feedback.classList.remove('hidden');
    }
});