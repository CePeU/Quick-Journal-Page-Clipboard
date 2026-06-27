
/**
 * Fetches an image from a URL and converts it to a Base64 Data URL.
 * @param {string} url - The source URL of the image.
 * @returns {Promise<string>} The Base64 encoded data URL.
 */
export async function imageToBase64(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // reader.result contains the data:image/...;base64,... string
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Finds images within a provided DOM element and replaces their URLs with Base64 data.
 * @param {HTMLElement} targetElement - The DOM element scope to search within.
 */
export async function convertPageImagesToBase64(targetElement) {
    // Safety check to ensure a valid DOM node was passed
    if (!targetElement || typeof targetElement.querySelectorAll !== 'function') {
        console.error("Invalid DOM element provided.");
        return;
    }

    // Query ONLY within the provided element
    const images = targetElement.querySelectorAll('img');
    
    for (const img of images) {
        if (!img.src || img.src.startsWith('data:')) continue;
        
        try {
            const base64Data = await imageToBase64(img.src);
            img.src = base64Data; // Mutates the original element by reference
        } catch (error) {
            console.error(`Could not convert image (${img.src}):`, error);
        }
    }
}
