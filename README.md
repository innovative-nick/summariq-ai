# SummariQ AI

![SummariQ AI Screenshot](SummariQ%20AI.png)

**Transform documents into summaries and quizzes instantly** - A browser-based tool that helps students, researchers, and professionals quickly digest PDFs, Word documents, and text files.

## Features

- ✍️ **AI-Powered Summaries** - Get clear, paragraph-form summaries in seconds
- ❓ **Interactive Quizzes** - Generate fill-in-the-blank questions to test your understanding
- 📂 **Multi-Format Support** - Works with PDF, DOCX, DOC, and TXT files
- 🔒 **100% Private** - All processing happens in your browser
- 📱 **Mobile-Friendly** - Works perfectly on all devices

## How to Use

1. Click "Choose File" to upload your document
2. Press "Upload File" to process it
3. Read your automatically generated summary
4. Click "Generate Quiz" to create interactive questions
5. Test your knowledge with immediate feedback

## Technical Details

### How It Works
```mermaid
graph LR
    A[Upload File] --> B{File Type?}
    B -->|PDF| C[Extract text with PDF.js]
    B -->|DOCX| D[Parse with Mammoth.js]
    B -->|TXT| E[Read directly]
    C & D & E --> F[Generate Summary]
    C & D & E --> G[Create Quiz]
    F --> H[Display Summary]
    G --> I[Show Quiz]# summariq-ai
