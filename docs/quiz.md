# Quiz Configuration

Quizzes live in `config/quizz/*.json` (alongside `config/game.json`, see [Configuration](configuration.md)).

Quizzes can be created in two ways:

- **Via the Quiz Editor**: use the built-in editor available in the manager dashboard (recommended)
- **Via JSON files**: manually create files in the `config/quizz/` directory

You can have multiple quiz files and select which one to use when starting a game.

Example quiz configuration (`config/quizz/example.json`):

```json
{
  "subject": "Example Quiz",
  "questions": [
    {
      "question": "What is the correct answer?",
      "answers": ["No", "Yes", "No", "No"],
      "solutions": [1],
      "cooldown": 5,
      "time": 15
    },
    {
      "question": "Which of these are primary colors?",
      "answers": ["Red", "Green", "Blue", "Yellow"],
      "solutions": [0, 2, 3],
      "cooldown": 5,
      "time": 20
    },
    {
      "question": "What is the correct answer with an image?",
      "answers": ["No", "Yes", "No", "No"],
      "media": {
        "type": "image",
        "url": "https://placehold.co/600x400.png"
      },
      "solutions": [1],
      "cooldown": 5,
      "time": 20
    }
  ]
}
```

Quiz Options:

- `subject`: Title/topic of the quiz
- `questions`: Array of question objects containing:
  - `question`: The question text
  - `answers`: Array of possible answers (2-4 options)
  - `media`: Optional media object displayed with the question:
    - `type`: `"image"`, `"video"`, or `"audio"`
    - `url`: URL of the media, or a local path served from `config/media/` (see below)
  - `solutions`: Array of correct answer indices (0-based). Use multiple indices for multi-answer questions
  - `cooldown`: Time in seconds before answers are revealed (3-15)
  - `time`: Time in seconds allowed to answer (5-120)
  - `maxPoints`: Maximum points awarded for a correct answer (default: `1000`, min: `0`)
  - `penalty`: Points deducted for a wrong answer (default: none, min: `0`). The player's total cannot go below 0. Unanswered questions are not penalised.

> **Note:** the app automatically adds and manages an `id` field inside each quiz file the first time it's loaded — you don't need to set it yourself, and editing it manually may cause conflicts if it collides with another quiz's id.

## Local media (`config/media/`)

Instead of linking to an externally hosted file, you can copy images, videos or audio files into the
`config/media/` folder (created automatically alongside `config/quizz/`, subfolders are supported).

In the Quiz Editor, open a question's media panel and click the folder icon next to the URL field to
browse and select a file from `config/media/`. The media type is detected automatically from the file
extension, and the question is saved with a `url` like `/media/round1/intro.mp4` — this path is served
directly by the app, so no external hosting is required.

Supported extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`, `.svg` (image), `.mp4`, `.webm`,
`.ogv`, `.mov` (video), `.mp3`, `.ogg`, `.wav`, `.m4a`, `.aac`, `.flac` (audio).

