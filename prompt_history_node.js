import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

// CSS styles for the modal (popup)
const modalCSS = `
.history-modal-item {
    background: #4a4a4a;
    color: #ddd;
    padding: 12px;
    border-radius: 5px;
    margin-bottom: 10px;
    border: 1px solid #555;
    display: flex;
    gap: 10px;
    position: relative;
    flex-wrap: wrap;
}

/* Favorite button (Star) */
.history-favorite-btn {
    background: none;
    border: none;
    color: #FFFFFF; /* White star */
    padding: 4px 8px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 16px; /* Make star bigger */
    transition: all 0.2s;
    order: -1; /* Come before delete buttons */
}
.history-favorite-btn:hover {
    color: #ddd;
    transform: scale(1.1);
}
.history-favorite-btn.favorited {
    color: #FFD700; /* Gold star when favorited */
}
.history-favorite-btn.favorited:hover {
    color: #FFE55C;
}


/* Container for delete buttons */
.history-item-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 5px;
    z-index: 10;
    align-items: center; /* Vertically center star */
}

.history-delete-btn {
    background: #e44;
    border: none;
    color: white;
    padding: 4px 8px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    font-weight: bold;
    transition: background 0.2s;
}
.history-delete-btn:hover { background: #c33; }
.history-delete-btn.delete-image { background: #f90; }
.history-delete-btn.delete-image:hover { background: #d70; }

.history-modal-backdrop {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.7); z-index: 1000;
    display: flex; align-items: center; justify-content: center;
}
.history-modal-content {
    background: #333; border: 1px solid #555; border-radius: 8px;
    width: 70%; max-width: 1000px; height: 80%;
    display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
}
.history-modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 15px; background: #444; border-bottom: 1px solid #555;
}
.history-modal-title-area {
    display: flex; align-items: center; gap: 15px;
}
.history-modal-header h2 { margin: 0; color: #eee; }
.history-modal-header select {
    background: #555; color: white; border: 1px solid #777;
    border-radius: 4px; padding: 5px 8px; font-size: 14px;
}

/* Favorite Filter Button */
.history-filter-toggle {
    background: #555;
    color: #ddd;
    border: 1px solid #777;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    transition: all 0.2s;
}
.history-filter-toggle:hover {
    background: #666;
    border-color: #888;
}
.history-filter-toggle.active {
    background: #FFD700;
    color: #333;
    border-color: #FFB000;
}


.history-modal-body { padding: 15px; overflow-y: auto; flex-grow: 1; }
.history-modal-item:hover { background: #5a5a5a; border-color: #777; }

.history-item-main {
    display: flex; width: 100%; gap: 10px; align-items: center;
}
.history-prompt-text {
    flex: 1; cursor: pointer; white-space: pre-wrap;
    word-break: break-word; font-family: monospace; font-size: 13px;
    padding-right: 120px; /* Make space for 3 buttons */
    min-height: 100px;
}
.history-thumbnail-container {
    width: 25%; max-width: 200px; min-width: 100px; height: 120px;
    background: #333; border: 1px solid #666; border-radius: 4px;
    overflow: hidden; display: flex; align-items: center;
    justify-content: center; cursor: pointer; flex-shrink: 0;
}
.history-thumbnail-container img { width: 100%; height: 100%; object-fit: cover; }
.history-thumbnail-container.no-image {
    color: #888; font-size: 12px; font-style: italic; height: 120px;
}
.history-modal-close {
    background: #e44; border: none; color: white; padding: 5px 10px;
    border-radius: 5px; cursor: pointer; font-weight: bold;
}
.history-modal-close:hover { background: #c33; }

.history-item-footer {
    width: 100%; margin-top: 8px; padding-top: 5px; border-top: 1px solid #555;
}
.history-expand-btn {
    background: #5c5c5c; border: 1px solid #777; color: #ddd;
    padding: 2px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;
}
.history-expand-btn:hover { background: #6f6f6f; }
.history-metadata-content {
    display: none; width: 100%; background: #3a3a3a;
    border-radius: 4px; padding: 10px; margin-top: 8px;
    box-sizing: border-box; border: 1px solid #555;
}
.history-metadata-content pre {
    margin: 0; white-space: pre-wrap; word-break: break-all;
    font-family: monospace; font-size: 11px; color: #ccc;
}

/* Fullsize image modal styles */
.fullsize-image-backdrop {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.9); z-index: 2000;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.fullsize-image-container { max-width: 95%; max-height: 95%; position: relative; }
.fullsize-image-container img {
    max-width: 100%; max-height: 95vh; object-fit: contain;
    border-radius: 4px; box-shadow: 0 10px 40px rgba(0,0,0,0.8);
}
.fullsize-close-btn {
    position: absolute; top: 10px; right: 10px; background: #e44;
    border: none; color: white; padding: 8px 15px; border-radius: 5px;
    cursor: pointer; font-weight: bold; font-size: 16px; z-index: 2001;
}
.fullsize-close-btn:hover { background: #c33; }
`;

// Inject CSS into the head once
if (!document.getElementById("history-modal-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "history-modal-styles";
    styleSheet.type = "text/css";
    styleSheet.innerText = modalCSS;
    document.head.appendChild(styleSheet);
}

// Global variables to track execution
let firstGeneratedImage = null;
let currentPromptData = null; 

/**
 * Parses the workflow (metadata) JSON and creates a readable summary.
 */
function parseWorkflowMetadata(metadata) {
    if (!metadata || !metadata.nodes) {
        return "Metadata (workflow) not found.";
    }
    
    let output = "";
    const nodes = metadata.nodes;

    try {
        // Checkpoint
        const cpNode = nodes.find(n => n.type === "CheckpointLoaderSimple" || n.type === "CheckpointLoader");
        if (cpNode && cpNode.widgets_values && cpNode.widgets_values.length > 0) {
            output += `Checkpoint: ${cpNode.widgets_values[0]}\n`;
        }

        // VAE
        const vaeNode = nodes.find(n => n.type === "VAELoader");
        if (vaeNode && vaeNode.widgets_values && vaeNode.widgets_values.length > 0) {
             output += `VAE: ${vaeNode.widgets_values[0]}\n`;
        }

        // Loras
        output += "Lora(s):\n";
        let loraFound = false;
        
        nodes.forEach(ln => {
            const w_val = ln.widgets_values;
            if (!w_val) return;

            if (ln.type.includes("LoraLoader")) {
                if (w_val.length >= 2) {
                    output += `  - ${w_val[0]} (Str: ${w_val[1]}) [Type: ${ln.type}]\n`;
                    loraFound = true;
                }
            }
            else if (ln.type === "CR Load LoRA") {
                if (w_val.length >= 3) {
                    if (w_val[0].toLowerCase() === "on") {
                        output += `  - ${w_val[1]} (Str: ${w_val[2]}) [Type: ${ln.type}]\n`;
                        loraFound = true;
                    }
                }
            }
        });
        if (!loraFound) {
            output += "  - None found or used un-summarizable node (e.g., Power Lora Loader).\n";
        }
        
        // KSampler
        const samplerNode = nodes.find(n => n.type === "KSampler" || n.type === "KSamplerAdvanced");
        if (samplerNode && samplerNode.widgets_values) {
            const w_val = samplerNode.widgets_values;
            output += `KSampler (${samplerNode.type}):\n`;
            
            if (samplerNode.type === "KSampler" && w_val.length >= 7) {
                output += `  Seed: ${w_val[0]}\n`;
                output += `  Steps: ${w_val[2]}\n`;
                output += `  CFG: ${w_val[3]}\n`;
                output += `  Sampler: ${w_val[4]}\n`;
                output += `  Scheduler: ${w_val[5]}\n`;
                output += `  Denoise: ${w_val[6]}\n`;
            } else if (samplerNode.type === "KSamplerAdvanced" && w_val.length >= 8) {
                 output += `  Seed: ${w_val[1]}\n`;
                 output += `  Steps: ${w_val[2]}\n`;
                 output += `  CFG: ${w_val[3]}\n`;
                 output += `  Sampler: ${w_val[4]}\n`;
                 output += `  Scheduler: ${w_val[5]}\n`;
                 output += `  Start Step: ${w_val[6]}\n`;
                 output += `  End Step: ${w_val[7]}\n`;
            } else {
                output += `  Values: ${w_val.join(", ")}\n`;
            }
        }
        
        // Latent
        const latentNode = nodes.find(n => n.type === "EmptyLatentImage");
        if (latentNode && latentNode.widgets_values && latentNode.widgets_values.length >= 3) {
             const w_val = latentNode.widgets_values;
             output += "Latent (Empty):\n";
             output += `  Size: ${w_val[0]}x${w_val[1]}\n`;
             output += `  Batch Size: ${w_val[2]}\n`;
        }
        
        if (output.trim() === "Lora(s):" || output.trim() === "") {
             return "No parseable data found in workflow.";
        }
        return output;
    
    } catch (e) {
        console.error("[PromptHistoryNode] Error parsing metadata:", e);
        return "Error parsing metadata (see console):\n\n" + JSON.stringify(metadata, null, 2);
    }
}

// Show fullsize image
function showFullsizeImage(thumbnailFilename) {
    const backdrop = document.createElement("div");
    backdrop.className = "fullsize-image-backdrop";
    const container = document.createElement("div");
    container.className = "fullsize-image-container";
    const img = document.createElement("img");
    img.src = `/get_thumbnail/${thumbnailFilename}`;
    const closeBtn = document.createElement("button");
    closeBtn.className = "fullsize-close-btn";
    closeBtn.textContent = "✕ Close";
    closeBtn.onclick = (e) => { e.stopPropagation(); backdrop.remove(); };
    container.appendChild(img);
    container.appendChild(closeBtn);
    backdrop.appendChild(container);
    backdrop.onclick = () => backdrop.remove();
    img.onclick = (e) => e.stopPropagation();
    document.body.appendChild(backdrop);
}

/**
 * Loads prompts from a specific history into the modal body.
 * Now includes showOnlyFavorites parameter.
 */
async function loadPromptsIntoModal(historyName, modalBody, node, closeModalCallback, showOnlyFavorites) {
    modalBody.innerHTML = `<p style="color: #888; font-style: italic;">Loading "${historyName}" history...</p>`;
    
    let prompts = [];
    try {
        const response = await fetch(`/get_prompt_history?name=${encodeURIComponent(historyName)}`);
        prompts = await response.json();
    } catch (error) {
        console.error(`[PromptHistoryNode] Failed to get '${historyName}' history:`, error);
        modalBody.innerHTML = `<p style="color: #f88;">Failed to load '${historyName}' history. Check the console.</p>`;
        return;
    }

    // Apply favorite filter
    if (showOnlyFavorites) {
        prompts = prompts.filter(p => p.favorite === true);
    }

    modalBody.innerHTML = "";
    if (prompts.length === 0) {
        const msg = showOnlyFavorites 
            ? `No favorite prompts found in "${historyName}".`
            : `No saved prompts found in "${historyName}".`;
        modalBody.innerHTML = `<p style="color: #888;">${msg}</p>`;
        return;
    }

    prompts.forEach(promptData => {
        const promptText = promptData.prompt;
        const thumbnail = promptData.thumbnail;
        const promptId = promptData.id;
        const metadata = promptData.metadata;
        const isFavorite = promptData.favorite || false;
        
        if (!promptText) return;

        const item = document.createElement("div");
        item.className = "history-modal-item";

        // --- Action Buttons Area ---
        const actionsDiv = document.createElement("div");
        actionsDiv.className = "history-item-actions";

        // Favorite Button (Star)
        const favoriteBtn = document.createElement("button");
        favoriteBtn.className = "history-favorite-btn";
        favoriteBtn.textContent = "⭐";
        favoriteBtn.title = "Mark as favorite";
        if (isFavorite) {
            favoriteBtn.classList.add("favorited");
        }
        favoriteBtn.onclick = async (e) => {
            e.stopPropagation();
            try {
                const response = await fetch('/toggle_favorite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        history_name: historyName,
                        prompt_id: promptId
                    })
                });
                if (response.ok) {
                    // Reload the modal body (respecting the filter)
                    loadPromptsIntoModal(historyName, modalBody, node, closeModalCallback, showOnlyFavorites);
                } else {
                    alert("Failed to update favorite status!");
                }
            } catch (error) {
                alert("Failed to update favorite status!");
                console.error("[PromptHistoryNode] Favorite toggle error:", error);
            }
        };
        actionsDiv.appendChild(favoriteBtn); // Add before delete buttons

        // Delete Thumbnail Button
        if (thumbnail) {
            const deleteImageBtn = document.createElement("button");
            deleteImageBtn.className = "history-delete-btn delete-image";
            deleteImageBtn.textContent = "🖼️";
            deleteImageBtn.title = "Delete only the image (prompt remains)";
            deleteImageBtn.onclick = async (e) => {
                e.stopPropagation();
                if (!confirm("Are you sure you want to delete this prompt's image?")) return;
                try {
                    // --- FIX APPLIED ---
                    const response = await fetch('/delete_prompt_thumbnail', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ history_name: historyName, prompt_id: promptId }) 
                    });
                    // ------------------
                    if (response.ok) { 
                        loadPromptsIntoModal(historyName, modalBody, node, closeModalCallback, showOnlyFavorites); 
                    } else { 
                        alert("Could not delete image!"); 
                    }
                } catch (error) { 
                    alert("Could not delete image!"); 
                    console.error("[PromptHistoryNode] Delete thumbnail error:", error);
                }
            };
            actionsDiv.appendChild(deleteImageBtn);
        }

        // Delete Entry Button
        const deleteEntryBtn = document.createElement("button");
        deleteEntryBtn.className = "history-delete-btn";
        deleteEntryBtn.textContent = "🗑️";
        deleteEntryBtn.title = "Delete this prompt entry completely";
        deleteEntryBtn.onclick = async (e) => {
            e.stopPropagation();
            if (!confirm("Are you sure you want to permanently delete this prompt?")) return;
            try {
                // --- FIX APPLIED ---
                const response = await fetch('/delete_prompt_entry', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ history_name: historyName, prompt_id: promptId }) 
                });
                // ------------------
                if (response.ok) { 
                    loadPromptsIntoModal(historyName, modalBody, node, closeModalCallback, showOnlyFavorites); 
                } else { 
                    alert("Could not delete prompt!"); 
                }
            } catch (error) { 
                alert("Could not delete prompt!"); 
                console.error("[PromptHistoryNode] Delete entry error:", error);
            }
        };
        actionsDiv.appendChild(deleteEntryBtn);
        
        // --- Main Content Area ---
        const mainDiv = document.createElement("div");
        mainDiv.className = "history-item-main";

        const textDiv = document.createElement("div");
        textDiv.className = "history-prompt-text";
        textDiv.textContent = promptText;
        textDiv.onclick = () => {
            // Find the 'text' widget on the node and set its value
            const textWidget = node.widgets.find(w => w.name === "text");
            if (textWidget) {
                textWidget.value = promptText;
                if(node.onDraw) node.onDraw(node.canvas.ctx); // Force redraw if possible
            }
            closeModalCallback();
        };

        const thumbnailDiv = document.createElement("div");
        thumbnailDiv.className = "history-thumbnail-container";
        if (thumbnail) {
            const img = document.createElement("img");
            img.src = `/get_thumbnail/${thumbnail}`; 
            img.alt = "Prompt thumbnail";
            thumbnailDiv.appendChild(img);
            thumbnailDiv.onclick = (e) => { e.stopPropagation(); showFullsizeImage(thumbnail); };
        } else {
            thumbnailDiv.classList.add("no-image");
            thumbnailDiv.textContent = "No Image";
        }
        mainDiv.appendChild(textDiv);
        mainDiv.appendChild(thumbnailDiv);

        // --- Metadata Area ---
        let metadataDiv = null;
        let footerDiv = null;
        if (metadata && Object.keys(metadata).length > 0) {
            footerDiv = document.createElement("div");
            footerDiv.className = "history-item-footer";
            const expandBtn = document.createElement("button");
            expandBtn.className = "history-expand-btn";
            expandBtn.textContent = "Show Details ▼";
            metadataDiv = document.createElement("div");
            metadataDiv.className = "history-metadata-content";
            const preTag = document.createElement("pre");
            preTag.textContent = parseWorkflowMetadata(metadata);
            metadataDiv.appendChild(preTag);
            expandBtn.onclick = (e) => {
                e.stopPropagation();
                const isHidden = metadataDiv.style.display === "none" || !metadataDiv.style.display;
                metadataDiv.style.display = isHidden ? "block" : "none";
                expandBtn.textContent = isHidden ? "Hide Details ▲" : "Show Details ▼";
            };
            footerDiv.appendChild(expandBtn);
        }
        
        item.appendChild(actionsDiv);
        item.appendChild(mainDiv);
        if (footerDiv) item.appendChild(footerDiv);
        if (metadataDiv) item.appendChild(metadataDiv);
        
        modalBody.appendChild(item);
    });
}

/**
 * Main function to open the history modal.
 * Now includes state for the favorite filter.
 */
async function openHistoryModal(node) {
    console.log("[PromptHistoryNode] Opening history modal...");
    
    // State for the filter, valid only while the modal is open
    let showOnlyFavorites = false; 

    const historyNameWidget = node.widgets.find(w => w.name === "history_name");
    let currentHistoryName = "default";
    if (historyNameWidget && historyNameWidget.value.trim()) {
        currentHistoryName = historyNameWidget.value.trim();
    }

    // Create modal elements
    const backdrop = document.createElement("div");
    backdrop.className = "history-modal-backdrop";
    const modal = document.createElement("div");
    modal.className = "history-modal-content";
    const header = document.createElement("div");
    header.className = "history-modal-header";
    const body = document.createElement("div");
    body.className = "history-modal-body";

    const closeModal = () => {
        backdrop.remove();
        console.log("[PromptHistoryNode] Modal closed.");
    };

    const titleArea = document.createElement("div");
    titleArea.className = "history-modal-title-area";
    const title = document.createElement("h2");
    title.textContent = "Prompt History";
    
    const historySelect = document.createElement("select");
    historySelect.title = "Select history to view";
    historySelect.innerHTML = "<option>Loading histories...</option>";
    
    titleArea.appendChild(title);
    titleArea.appendChild(historySelect);

    // Favorite Filter Button
    const favoriteToggleBtn = document.createElement("button");
    favoriteToggleBtn.className = "history-filter-toggle";
    favoriteToggleBtn.textContent = "⭐ Favorites Only";
    favoriteToggleBtn.onclick = (e) => {
        e.stopPropagation();
        showOnlyFavorites = !showOnlyFavorites; // Toggle state
        favoriteToggleBtn.classList.toggle("active", showOnlyFavorites);
        // Reload the list with the new filter state
        loadPromptsIntoModal(historySelect.value, body, node, closeModal, showOnlyFavorites);
    };
    titleArea.appendChild(favoriteToggleBtn); // Add next to the dropdown

    const closeButton = document.createElement("button");
    closeButton.className = "history-modal-close";
    closeButton.textContent = "X";
    closeButton.onclick = closeModal;
    
    header.appendChild(titleArea);
    header.appendChild(closeButton);

    modal.appendChild(header);
    modal.appendChild(body);
    backdrop.appendChild(modal);
    backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); }; // Close on backdrop click
    document.body.appendChild(backdrop);

    // Fetch all available histories to populate the dropdown
    try {
        const response = await fetch('/get_all_histories');
        const allHistoryNames = await response.json();
        console.log(`[PromptHistoryNode] ${allHistoryNames.length} histories found:`, allHistoryNames);

        historySelect.innerHTML = "";
        
        if (allHistoryNames.length === 0) {
            historySelect.innerHTML = "<option>No histories</option>";
            body.innerHTML = `<p style="color: #888;">No history files found.</p>`;
            return;
        }
        
        allHistoryNames.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            if (name === currentHistoryName) option.selected = true;
            historySelect.appendChild(option);
        });
        
        // Fallback to 'default' if the current name isn't in the list
        if (!allHistoryNames.includes(currentHistoryName) && allHistoryNames.includes("default")) {
            historySelect.value = "default";
        }
        
        // When dropdown changes, reload the list (respecting filter)
        historySelect.onchange = () => {
            loadPromptsIntoModal(historySelect.value, body, node, closeModal, showOnlyFavorites);
        };

        // Initial load (filter is off by default)
        loadPromptsIntoModal(historySelect.value, body, node, closeModal, showOnlyFavorites);

    } catch (error) {
        console.error("[PromptHistoryNode] Failed to get all histories:", error);
        body.innerHTML = `<p style="color: #f88;">Could not load history list. Check backend.</p>`;
        historySelect.innerHTML = "<option>Error!</option>";
    }
}

/**
 * Helper function to send the update to the server.
 */
async function sendUpdateToServer() {
    if (!currentPromptData || !firstGeneratedImage) {
        // We have the prompt but not the image yet, or vice-versa
        return;
    }
    
    console.log("[PromptHistoryNode] ✓ Prompt and Image captured. Sending update to server...");
    const dataToSend = {
        history_name: currentPromptData.historyName,
        prompt: currentPromptData.promptText,
        image: firstGeneratedImage,
        metadata: currentPromptData.workflowData
    };
    
    // Reset globals for the next run
    currentPromptData = null;
    firstGeneratedImage = null;

    try {
        const response = await fetch('/update_prompt_with_image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });
        if (response.ok) {
            console.log("[PromptHistoryNode] ✓✓ Prompt updated with image (HTTP 200).");
        } else {
            console.error(`[PromptHistoryNode] ✗ Failed to update prompt with image. Server returned ${response.status}.`);
        }
    } catch (error) {
        console.error("[PromptHistoryNode] ✗ 'update_prompt_with_image' fetch error:", error);
    }
}

// Event Listener: Capture the first generated image
api.addEventListener("executed", async (event) => {
    const { node: nodeId, output } = event.detail;
    if (output && output.images && output.images.length > 0) {
        if (firstGeneratedImage) return; // We only want the first one
        
        const firstImage = output.images[0];
        if (firstImage) { 
            firstGeneratedImage = firstImage;
            console.log("[PromptHistoryNode] First image captured:", firstImage.filename);
            await sendUpdateToServer(); // Try to send update
        }
    }
});

// Event Listener: Capture prompt and workflow data on execution start
api.addEventListener("execution_start", () => {
    console.log("[PromptHistoryNode] New execution started.");
    firstGeneratedImage = null;
    currentPromptData = null;
    
    if (app.graph) {
        const historyNodes = app.graph._nodes.filter(n => n.type === "PromptHistoryClipTextEncode");
        historyNodes.forEach(node => {
            try {
                const historyName = node.widgets.find(w => w.name === "history_name")?.value || "default";
                const promptText = node.widgets.find(w => w.name === "text")?.value;
                
                if (promptText && promptText.trim()) {
                    let workflowData = null;
                    try {
                        workflowData = app.graph.serialize(); 
                    } catch(e) {
                        console.error("[PromptHistoryNode] Could not serialize workflow data (JSON):", e);
                    }
                    
                    // Store this data,
                    // it will be matched with the first image that comes in
                    currentPromptData = {
                        historyName: historyName,
                        promptText: promptText.trim(),
                        workflowData: workflowData
                    };
                    console.log("[PromptHistoryNode] ✓ Prompt info and workflow captured from 'execution_start'.");
                }
            } catch (e) { console.error("[PromptHistoryNode] Error capturing prompt data:", e); }
        });
    }
});

// Register the extension with ComfyUI
app.registerExtension({
    name: "comfy.PromptHistory.UI",
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name === "PromptHistoryClipTextEncode") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                onNodeCreated?.apply(this, arguments);
                
                // --- Auto-set history_name from workflow filename ---
                try {
                    const historyNameWidget = this.widgets.find(w => w.name === "history_name");
                    // Only set if it's empty or 'default'
                    if (historyNameWidget && (!historyNameWidget.value || historyNameWidget.value === "default")) {
                        let workflowName = "default";
                        
                        // Try to get from graph data (e.g., loaded file)
                        if (app.graph?.config?.name) {
                            workflowName = app.graph.config.name;
                        } 
                        // Try to get from document title (e.g., unsaved file)
                        else {
                            let title = document.title;
                            if (title.endsWith(" - ComfyUI")) {
                                title = title.substring(0, title.lastIndexOf(" - ComfyUI"));
                            }
                            if (title !== "ComfyUI" && title.trim()) {
                                // Clean up .json, .png, etc. extensions
                                const extensions = [".json", ".json.png", ".png", ".jpg", ".jpeg", ".webp"];
                                const lowerTitle = title.toLowerCase();
                                for (const ext of extensions) {
                                    if (lowerTitle.endsWith(ext)) {
                                        title = title.substring(0, title.length - ext.length);
                                        break; 
                                    }
                                }
                                workflowName = title.trim();
                            }
                        }
                        
                        if (workflowName) {
                            historyNameWidget.value = workflowName;
                            console.log(`[PromptHistoryNode] History name auto-set to: '${workflowName}'`);
                        }
                    }
                } catch (e) { console.error("[PromptHistoryNode] Error auto-setting workflow name:", e); }

                // Add the 'View History' button to the node
                this.addWidget( "button", "View History", "View History", () => openHistoryModal(this) );
                this.setSize(this.computeSize());
            };
        }
    },
});
