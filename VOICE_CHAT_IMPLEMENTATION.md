
# HealthBot Voice Chat Implementation

## Overview
This document describes the implementation of the HealthBot Voice Chat system that allows users to interact with an AI health assistant using voice input and receive voice responses.

## Features Implemented

### ✅ Backend Components

1. **Symptom Classification System** (`server/utils/symptomClassifier.js`)
   - Classifies symptoms as "basic" or "complex"
   - Maps complex symptoms to appropriate doctor specializations
   - Provides intelligent doctor recommendations

2. **Chat API Controller** (`server/controllers/Chat.controller.js`)
   - Processes chat messages with NLP classification
   - Integrates with Gemini AI for professional medical advice
   - Returns structured responses with doctor recommendations

3. **Enhanced Models**
   - **Symptom Model** (`server/models/symptom.js`): Stores symptom data with complexity classification
   - **Doctor Model** (existing): Enhanced with specialization matching

4. **API Routes** (`server/routes/chatRoutes.js`)
   - `POST /api/chat` - Process chat messages
   - `GET /api/chat/history/:userId` - Get chat history

### ✅ Frontend Components

1. **Enhanced Chat API** (`client/src/api/chat.jsx`)
   - Speech-to-Text using Web Speech API
   - Text-to-Speech using Web Speech Synthesis API
   - Chat message sending with authentication

2. **Updated Chat Component** (`client/src/pages/Chat.jsx`)
   - Real voice input with speech recognition
   - Voice output with text-to-speech
   - Doctor recommendations display
   - Enhanced error handling

## How It Works

### Voice Input Flow
1. User clicks microphone button
2. Browser requests microphone permission
3. Web Speech API converts speech to text
4. Text is sent to `/api/chat` endpoint
5. Backend processes with NLP classification
6. Response includes medical advice and doctor recommendations

### Voice Output Flow
1. Bot response is displayed in chat
2. User clicks speaker button on bot message
3. Web Speech Synthesis API converts text to speech
4. Audio is played through browser speakers

### Symptom Classification Logic
- **Basic Symptoms**: fever, headache, cold, cough, etc.
  - Returns self-care advice
  - No doctor recommendation
  
- **Complex Symptoms**: cancer, heart attack, stroke, diabetes, etc.
  - Returns professional medical advice
  - Recommends appropriate specialist doctors
  - Shows doctor contact information

## API Endpoints

### POST /api/chat
**Request:**
```json
{
  "message": "I have fever",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assessment: Fever may indicate infection...",
  "complexity": "basic",
  "shouldSeeDoctor": false,
  "doctors": [],
  "specialization": null,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Complex Symptom Response
```json
{
  "success": true,
  "message": "Assessment: Blood cancer requires immediate medical attention...",
  "complexity": "complex",
  "shouldSeeDoctor": true,
  "doctors": [
    {
      "name": "Dr. Sarah Johnson",
      "specialization": "Oncologist",
      "hospital": "City General Hospital",
      "phone": "+1-555-0101",
      "location": "New York, NY"
    }
  ],
  "specialization": "Oncologist",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Testing

### Test Scenarios

1. **Basic Symptom Test**
   - Input: "I have fever"
   - Expected: Basic self-care advice, no doctor recommendation

2. **Complex Symptom Test**
   - Input: "I have blood cancer"
   - Expected: Professional advice + oncologist recommendation

3. **Voice Input Test**
   - Click microphone, speak symptom
   - Verify speech-to-text conversion
   - Verify response generation

4. **Voice Output Test**
   - Click speaker button on bot response
   - Verify text-to-speech playback

### Running Tests

```bash
# Seed database with sample data
cd server
node scripts/seedData.js

# Test chat functionality
node test-chat.js
```

## Browser Compatibility

### Speech Recognition (Voice Input)
- ✅ Chrome/Chromium
- ✅ Edge
- ❌ Firefox (limited support)
- ❌ Safari (limited support)

### Speech Synthesis (Voice Output)
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## Security & Privacy

- All voice processing happens client-side
- No audio data is stored or transmitted
- Only transcribed text is sent to backend
- JWT authentication required for chat API
- Medical advice disclaimers displayed

## Future Enhancements

1. **Offline Voice Processing**: Implement offline speech recognition
2. **Multi-language Support**: Add support for multiple languages
3. **Voice Commands**: Add voice commands for navigation
4. **Audio Recording**: Store voice interactions for analysis
5. **Advanced NLP**: Integrate more sophisticated medical NLP models

## Troubleshooting

### Common Issues

1. **Microphone Permission Denied**
   - Solution: Check browser permissions
   - Ensure HTTPS connection for production

2. **Speech Recognition Not Working**
   - Solution: Use Chrome/Edge browser
   - Check microphone hardware

3. **No Voice Output**
   - Solution: Check browser audio settings
   - Verify speech synthesis support

4. **API Errors**
   - Solution: Check authentication token
   - Verify backend server is running

## Environment Variables

```env
# Required for Gemini AI integration
GEMINI_API_KEY=your_gemini_api_key

# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/healthcare-app

# JWT secret
JWT_SECRET=your_jwt_secret
```

## Deployment Notes

- Ensure HTTPS for production (required for microphone access)
- Configure CORS for voice API endpoints
- Set up proper error monitoring for voice features
- Test voice functionality across different devices
