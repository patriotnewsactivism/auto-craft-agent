# Quick Setup: Google Gemini Models

This app is now configured to use the latest Google Gemini 2.5 models.

## Quick Start

1. **Get Your API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create or sign in to your Google account
   - Generate a new API key

2. **Configure the App**
   - Click the Settings icon (⚙️) in the app
   - Paste your API key in "Google AI API Key"
   - Select your preferred model (Flash is recommended)
   - Click "Save Keys"

3. **You're Ready!**
   - Your settings persist automatically
   - Start building apps with AI

## Available Models

### Gemini 2.5 Flash ⭐ (Default)
- **Best for:** Most tasks
- **Speed:** Fast ⚡⚡⚡⚡
- **Quality:** Excellent ⭐⭐⭐⭐
- **Use case:** Standard app development

### Gemini 2.5 Pro
- **Best for:** Complex projects
- **Speed:** Moderate ⚡⚡
- **Quality:** Outstanding ⭐⭐⭐⭐⭐
- **Use case:** Enterprise applications, complex architectures

### Gemini 2.5 Flash Lite
- **Best for:** Simple tasks
- **Speed:** Ultra-fast ⚡⚡⚡⚡⚡
- **Quality:** Good ⭐⭐⭐
- **Use case:** Quick components, validation

### Gemini 2.5 Flash Audio
- **Best for:** Voice interactions
- **Speed:** Fast ⚡⚡⚡
- **Quality:** Excellent ⭐⭐⭐⭐
- **Use case:** 2-way audio, voice-controlled development

## Model Selection Tips

- **Just starting?** Use Flash (default)
- **Building something complex?** Switch to Pro
- **Need it fast?** Use Flash Lite
- **Want voice control?** Try Audio Preview

## Environment Variables (Optional)

For production deployments, you can set:

```bash
VITE_GOOGLE_API_KEY=your_api_key_here
```

The app will automatically use environment variables if available.

## Need Help?

See [GEMINI_MODELS_GUIDE.md](./GEMINI_MODELS_GUIDE.md) for detailed information about each model and when to use them.
