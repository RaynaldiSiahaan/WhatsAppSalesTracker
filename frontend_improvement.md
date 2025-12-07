# Frontend Improvements & Feature Roadmap

This document tracks planned features and architectural improvements for the Frontend, specifically focusing on the AI Chat integration.

## 1. AI Chat Integration ("Diskusi Ide dengan AI")

### 1.1. API Service
*   **Objective:** Create a dedicated service to communicate with the backend AI endpoint.
*   **File:** `src/services/aiService.ts`
*   **Tasks:**
    *   Create `aiService` object.
    *   Implement `sendMessage(message: string, context?: any[])` method.
    *   Connect to `POST /api/ai/chat` endpoint.

### 1.2. UI Implementation
*   **Objective:** Build a functional chat interface for sellers.
*   **File:** `src/pages/seller/AIChat.tsx` (Currently a placeholder)
*   **Tasks:**
    *   **Chat Layout:** Implement a standard chat UI with a scrollable message history area and a fixed input area at the bottom.
    *   **Message Bubbles:** Differentiate between "User" (Seller) and "AI" (Assistant) messages visually (e.g., right-aligned blue bubbles for user, left-aligned gray bubbles for AI).
    *   **Input Area:** Textarea for typing messages with a "Send" button. Support "Enter to send".
    *   **Loading State:** Display a "Typing..." indicator or skeleton loader while waiting for the AI response.
    *   **Error Handling:** Show toast/alert messages if the API call fails (e.g., "Failed to get response").

### 1.3. State Management (Optional but Recommended)
*   **Objective:** Persist chat history during the session (or longer).
*   **Tasks:**
    *   Use `useState` for simple local state within `AIChat.tsx`.
    *   Alternatively, use a new Zustand store `useChatStore` if chat history needs to persist across navigation changes (e.g., switching to Dashboard and back).

### 1.4. Integration with Product Data (Future Enhancement)
*   **Idea:** Allow the user to "select" a product from their catalog to "Ask about this product" (e.g., generate caption).
*   **Implementation:**
    *   Pass product details as context to the AI service.
    *   Add a "Generate Caption" button on the Product Detail page that redirects to AI Chat with a pre-filled prompt.

## 2. General UX Improvements

*   **Mobile Responsiveness:** Ensure the chat interface works well on mobile devices (keyboard handling, screen height).
*   **Markdown Rendering:** If the AI returns formatted text (bullet points, bold), use a library like `react-markdown` to render it properly.
