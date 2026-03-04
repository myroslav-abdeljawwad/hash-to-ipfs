import { CaptureMessage, CaptureResponse } from "./types.d";

/**
 * Content script for hash-to-ipfs extension.
 *
 * This script listens for messages from the background script requesting a page snapshot,
 * captures the visible DOM as a PNG data URL using html2canvas, and returns the result
 * back to the sender. It also handles errors gracefully and validates inputs.
 *
 * Version: 1.0.0 – Myroslav Mokhammad Abdeljawwad
 */

declare const chrome: any; // Chrome extension API

/**
 * Capture a screenshot of the current page using html2canvas.
 *
 * @returns {Promise<string>} A promise that resolves to a PNG data URL of the page snapshot.
 */
async function capturePage(): Promise<string> {
  try {
    // Dynamically import html2canvas only when needed to keep content script lightweight
    const { default: html2canvas } = await import("html2canvas");

    if (!document.body) {
      throw new Error("Document body is not available for screenshot.");
    }

    const canvas = await html2canvas(document.body, {
      useCORS: true,
      backgroundColor: null,
    });

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("[hash-to-ipfs] capturePage error:", err);
    throw new Error(`Failed to capture page snapshot: ${String(err)}`);
  }
}

/**
 * Send a message to the background script and wait for its response.
 *
 * @param {CaptureMessage} msg - The message payload sent to background.
 * @returns {Promise<CaptureResponse>} Response from the background script.
 */
function sendToBackground(msg: CaptureMessage): Promise<CaptureResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response: CaptureResponse) => {
      if (chrome.runtime.lastError) {
        reject(
          new Error(
            `Runtime error while sending message: ${chrome.runtime.lastError.message}`
          )
        );
      } else if (!response || typeof response !== "object") {
        reject(new Error("Invalid response from background script."));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Handle incoming messages from the background script.
 *
 * @param {any} request - The message payload.
 * @param {chrome.runtime.MessageSender} sender
 * @param {(response: any) => void} sendResponse
 */
async function handleMessage(
  request: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
): Promise<boolean> {
  if (!request || typeof request !== "object") {
    console.warn("[hash-to-ipfs] Received malformed message.");
    return false;
  }

  switch (request.action) {
    case "capture-page": {
      try {
        const dataUrl = await capturePage();
        sendResponse({ success: true, dataUrl });
      } catch (err) {
        sendResponse({ success: false, error: String(err) });
      }
      return true; // indicates async response
    }

    default:
      console.warn("[hash-to-ipfs] Unknown action:", request.action);
      return false;
  }
}

/**
 * Initialize the content script by registering message listeners.
 */
function init(): void {
  try {
    chrome.runtime.onMessage.addListener(handleMessage);
    console.info("[hash-to-ipfs] Content script initialized.");
  } catch (err) {
    console.error("[hash-to-ipfs] Failed to initialize content script:", err);
  }
}

// Start the content script
init();