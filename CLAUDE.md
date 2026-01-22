# Claude Code Guidelines

## Response Formatting Rules

### Paragraph Formatting
- Write each paragraph as a single continuous line without hard line breaks in the middle of sentences
- Only use line breaks between paragraphs, not within them
- This ensures content can be copied to .md files with proper paragraph layout

### Inline Code and Filenames
- Do NOT use backticks for filenames in headings or important text that will be copied
- Write filenames as plain text: "Changes Made to generate-emails.ts" not "Changes Made to `generate-emails.ts`"
- Backticks can cause text to split across lines when copied to markdown files
- Only use backticks for actual code snippets in code blocks

### Example

**Correct:**
```
This is a complete paragraph written on a single line. It can be as long as needed but should not have line breaks in the middle of sentences.

This is the next paragraph, also on a single line.
```

**Incorrect:**
```
This is a paragraph that has
line breaks in the middle which
causes layout issues when copied.
```

## Code Style
- Follow existing project conventions
- Use TypeScript for all new code
- Prefer functional components with hooks for React

## Project-Specific Notes
- This is a B2B Email Marketing platform built with Next.js 14, Supabase, Clerk, and Inngest
- Email sending is handled via Resend API
- Use `onboarding@resend.dev` as default sender for testing (Resend limitation)
