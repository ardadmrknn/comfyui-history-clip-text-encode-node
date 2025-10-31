import os
import json
import folder_paths
import server
from aiohttp import web
import time
import hashlib
import shutil
import traceback

# --- Setup Directories ---
current_dir = os.path.dirname(os.path.abspath(__file__))
history_dir = os.path.join(current_dir, "prompt_history")
thumbnails_dir = os.path.join(history_dir, "thumbnails")
os.makedirs(history_dir, exist_ok=True)
os.makedirs(thumbnails_dir, exist_ok=True)
print(f"[PromptHistoryNode] History directory: {history_dir}")
print(f"[PromptHistoryNode] Thumbnail directory: {thumbnails_dir}")

def get_history_filepath(history_name):
    """Creates a safe file path for a given history name."""
    if not history_name or not isinstance(history_name, str):
        history_name = "default"
    
    # Sanitize the name to create a safe filename
    safe_name = "".join(c for c in history_name if c.isalnum() or c in ('_', '-')).strip()
    if not safe_name:
        safe_name = "default"
        
    filename = f"prompt_history_{safe_name}.json"
    return os.path.join(history_dir, filename)

def load_history(history_name):
    """Loads a specific history file."""
    filepath = get_history_filepath(history_name)
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"[PromptHistoryNode] WARNING: {filepath} JSON decode error, returning empty list.")
            return [] 
    return []

def copy_image_as_thumbnail(source_path, prompt_id):
    """Copies an image to the thumbnails directory."""
    try:
        if not os.path.exists(source_path):
            print(f"[PromptHistoryNode] WARNING: Source image not found: {source_path}")
            return None
        
        _, ext = os.path.splitext(source_path)
        thumbnail_filename = f"{prompt_id}{ext}"
        thumbnail_path = os.path.join(thumbnails_dir, thumbnail_filename)
        
        shutil.copy2(source_path, thumbnail_path)
        print(f"[PromptHistoryNode] ✓ Thumbnail copied: {thumbnail_filename}")
        
        return thumbnail_filename
    except Exception as e:
        print(f"[PromptHistoryNode] ERROR: Could not copy thumbnail: {e}")
        traceback.print_exc()
        return None

def save_history_file(filepath, history):
    """Saves the history list to its file safely."""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(history, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"[PromptHistoryNode] ERROR: Could not save history file: {filepath} - {e}")
        traceback.print_exc()

def save_prompt(history_name, prompt_text, image_path=None, metadata=None):
    """Saves a prompt to the history, preventing duplicates."""
    if not prompt_text or not prompt_text.strip():
        print(f"[PromptHistoryNode] WARNING: Empty prompt text received, skipping save.")
        return
    
    prompt_text = prompt_text.strip()
    filepath = get_history_filepath(history_name)
    history = load_history(history_name)
    
    thumbnail_filename = None
    if image_path:
        # Create a unique ID for the thumbnail based on the prompt hash and time
        thumbnail_id = f"{hashlib.md5(prompt_text.encode('utf-8')).hexdigest()}_{int(time.time())}"
        thumbnail_filename = copy_image_as_thumbnail(image_path, thumbnail_id)
    
    existing_index = None
    for i, item in enumerate(history):
        if item.get("prompt") == prompt_text:
            existing_index = i
            break
    
    if existing_index is not None:
        # This prompt already exists, update it
        existing_id = history[existing_index].get("id")
        
        if thumbnail_filename:
            # If a new thumbnail is provided, update it and delete the old one
            old_thumbnail_filename = history[existing_index].get("thumbnail")
            history[existing_index]["thumbnail"] = thumbnail_filename
            history[existing_index]["timestamp"] = int(time.time())
            print(f"[PromptHistoryNode] INFO: Existing prompt updated. ID: {existing_id}, New Thumbnail: {thumbnail_filename}")

            if old_thumbnail_filename and old_thumbnail_filename != thumbnail_filename:
                old_thumbnail_path = os.path.join(thumbnails_dir, old_thumbnail_filename)
                if os.path.exists(old_thumbnail_path):
                    try:
                        os.remove(old_thumbnail_path)
                        print(f"[PromptHistoryNode] ✓ Old thumbnail deleted: {old_thumbnail_filename}")
                    except Exception as e:
                        print(f"[PromptHistoryNode] WARNING: Could not delete old thumbnail ({old_thumbnail_filename}): {e}")
        
        if metadata:
            history[existing_index]["metadata"] = metadata
            print(f"[PromptHistoryNode] INFO: Metadata updated. ID: {existing_id}")
        
        if not thumbnail_filename and not metadata:
             print(f"[PromptHistoryNode] INFO: Existing prompt found (ID: {existing_id}), awaiting image/metadata.")
             
    else:
        # This is a new prompt, add it to the top of the list
        new_prompt_id = hashlib.md5(f"{prompt_text}{int(time.time())}".encode('utf-8')).hexdigest()
        new_entry = {
            "id": new_prompt_id,
            "timestamp": int(time.time()),
            "prompt": prompt_text,
            "thumbnail": thumbnail_filename,
            "metadata": metadata if metadata else {},
            "favorite": False
        }
        history.insert(0, new_entry) # Insert at the beginning (index 0)
        print(f"[PromptHistoryNode] INFO: New prompt added. ID: {new_prompt_id}, Thumbnail: {thumbnail_filename}")
    
    save_history_file(filepath, history)

# --- API Endpoints ---

@server.PromptServer.instance.routes.get('/get_prompt_history')
async def handle_get_history(request):
    """API: Get all entries for a specific history."""
    history_name = request.query.get('name', 'default')
    history = load_history(history_name)
    return web.json_response(history)

@server.PromptServer.instance.routes.get('/get_all_histories')
async def handle_get_all_histories(request):
    """API: Get a list of all available history file names."""
    try:
        files = os.listdir(history_dir)
        history_files = []
        prefix = "prompt_history_"
        suffix = ".json"
        
        for f in files:
            if f.startswith(prefix) and f.endswith(suffix):
                clean_name = f[len(prefix):-len(suffix)]
                history_files.append(clean_name)
                
        history_files.sort()
        return web.json_response(history_files)
    except Exception as e:
        print(f"[PromptHistoryNode] ERROR: Could not list all histories: {e}")
        return web.json_response([], status=500)

@server.PromptServer.instance.routes.get('/get_thumbnail/{filename}')
async def handle_get_thumbnail(request):
    """API: Serve a specific thumbnail image."""
    filename = request.match_info['filename']
    filepath = os.path.join(thumbnails_dir, filename)
    
    if os.path.exists(filepath):
        return web.FileResponse(filepath)
    else:
        print(f"[PromptHistoryNode] WARNING: Thumbnail not found: {filename}")
        return web.Response(status=404)

@server.PromptServer.instance.routes.post('/update_prompt_with_image')
async def handle_update_prompt_with_image(request):
    """API: Update an existing prompt (saved on encode) with its generated image."""
    try:
        data = await request.json()
        print(f"[PromptHistoryNode] API: '/update_prompt_with_image' called.")
        
        history_name = data.get('history_name', 'default')
        prompt_text = data.get('prompt')
        image_data = data.get('image')
        metadata = data.get('metadata')
        
        if not prompt_text or not image_data:
            print("[PromptHistoryNode] ERROR: update_prompt_with_image - Missing data.")
            return web.json_response({"status": "error", "message": "Missing data"}, status=400)
        
        filename = image_data.get('filename')
        subfolder = image_data.get('subfolder', '')
        image_type = image_data.get('type', 'output')
        
        # Determine the correct image directory based on type
        if image_type == 'output':
            output_dir = folder_paths.get_output_directory()
        elif image_type == 'input':
            output_dir = folder_paths.get_input_directory()
        elif image_type == 'temp':
            output_dir = folder_paths.get_temp_directory()
        else:
            output_dir = folder_paths.get_output_directory()
        
        if subfolder:
            image_path = os.path.join(output_dir, subfolder, filename)
        else:
            image_path = os.path.join(output_dir, filename)
        
        print(f"[PromptHistoryNode] INFO: Full path of image to match: {image_path}")
        save_prompt(history_name, prompt_text, image_path=image_path, metadata=metadata)
        return web.json_response({"status": "success"})
        
    except Exception as e:
        print(f"[PromptHistoryNode] ERROR: Could not update prompt with image: {e}")
        traceback.print_exc()
        return web.json_response({"status": "error", "message": str(e)}, status=500)
      
@server.PromptServer.instance.routes.post('/delete_prompt_entry')
async def handle_delete_prompt_entry(request):
    """API: Delete an entire prompt entry (and its thumbnail)."""
    try:
        data = await request.json()
        history_name = data.get('history_name', 'default')
        prompt_id = data.get('prompt_id')
        
        if not prompt_id:
            return web.json_response({"status": "error", "message": "Missing prompt_id"}, status=400)
        
        filepath = get_history_filepath(history_name)
        history = load_history(history_name)
        
        entry_to_delete = None
        for i, item in enumerate(history):
            if item.get("id") == prompt_id:
                entry_to_delete = history.pop(i)
                break
        
        if not entry_to_delete:
            return web.json_response({"status": "error", "message": "Entry not found"}, status=404)
        
        # Delete the associated thumbnail file
        thumbnail_filename = entry_to_delete.get("thumbnail")
        if thumbnail_filename:
            thumbnail_path = os.path.join(thumbnails_dir, thumbnail_filename)
            if os.path.exists(thumbnail_path):
                try:
                    os.remove(thumbnail_path)
                    print(f"[PromptHistoryNode] ✓ Thumbnail file deleted: {thumbnail_filename}")
                except Exception as e:
                    print(f"[PromptHistoryNode] WARNING: Could not delete thumbnail file: {e}")
        
        save_history_file(filepath, history)
        print(f"[PromptHistoryNode] ✓ Prompt entry deleted. ID: {prompt_id}")
        return web.json_response({"status": "success"})
        
    except Exception as e:
        print(f"[PromptHistoryNode] ERROR: Could not delete prompt entry: {e}")
        return web.json_response({"status": "error", "message": str(e)}, status=500)

@server.PromptServer.instance.routes.post('/delete_prompt_thumbnail')
async def handle_delete_prompt_thumbnail(request):
    """API: Delete only the thumbnail for a prompt entry."""
    try:
        data = await request.json()
        history_name = data.get('history_name', 'default')
        prompt_id = data.get('prompt_id')
        
        if not prompt_id:
            return web.json_response({"status": "error", "message": "Missing prompt_id"}, status=400)
        
        filepath = get_history_filepath(history_name)
        history = load_history(history_name)
        
        entry_found = False
        thumbnail_to_delete = None
        
        for item in history:
            if item.get("id") == prompt_id:
                thumbnail_to_delete = item.get("thumbnail")
                item["thumbnail"] = None # Set thumbnail to null in the JSON
                entry_found = True
                break
        
        if not entry_found:
            return web.json_response({"status": "error", "message": "Entry not found"}, status=404)
        
        # Delete the actual file
        if thumbnail_to_delete:
            thumbnail_path = os.path.join(thumbnails_dir, thumbnail_to_delete)
            if os.path.exists(thumbnail_path):
                try:
                    os.remove(thumbnail_path)
                    print(f"[PromptHistoryNode] ✓ Thumbnail file deleted: {thumbnail_to_delete}")
                except Exception as e:
                    print(f"[PromptHistoryNode] WARNING: Could not delete thumbnail file: {e}")
        
        save_history_file(filepath, history)
        print(f"[PromptHistoryNode] ✓ Thumbnail removed from entry. Prompt ID: {prompt_id}")
        return web.json_response({"status": "success"})
        
    except Exception as e:
        print(f"[PromptHistoryNode] ERROR: Could not delete prompt thumbnail: {e}")
        return web.json_response({"status": "error", "message": str(e)}, status=500)

@server.PromptServer.instance.routes.post('/toggle_favorite')
async def handle_toggle_favorite(request):
    """API: Toggle the 'favorite' status of a prompt entry."""
    try:
        data = await request.json()
        history_name = data.get('history_name', 'default')
        prompt_id = data.get('prompt_id')
        
        if not prompt_id:
            return web.json_response({"status": "error", "message": "Missing prompt_id"}, status=400)
            
        filepath = get_history_filepath(history_name)
        history = load_history(history_name)
        
        new_status = False
        found = False
        for item in history:
            if item.get("id") == prompt_id:
                current_status = item.get("favorite", False)
                item["favorite"] = not current_status
                new_status = item["favorite"]
                found = True
                break
        
        if not found:
            return web.json_response({"status": "error", "message": "Entry not found"}, status=404)

        save_history_file(filepath, history)
        print(f"[PromptHistoryNode] ✓ Favorite status changed. ID: {prompt_id}, New Status: {new_status}")
        return web.json_response({"status": "success", "new_status": new_status})

    except Exception as e:
        print(f"[PromptHistoryNode] ERROR: Could not toggle favorite status: {e}")
        traceback.print_exc()
        return web.json_response({"status": "error", "message": str(e)}, status=500)

# --- Node Definition ---

class PromptHistoryClipTextEncode:
    """
    A custom CLIPTextEncode node that saves the prompt to a JSON history file.
    It also listens for the first generated image to associate it with the prompt.
    """
    
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "clip": ("CLIP", ),
                "history_name": ("STRING", {"default": "default"}),
                "text": ("STRING", {"multiline": True, "dynamicPrompts": True}),
            }
        }

    RETURN_TYPES = ("CONDITIONING",)
    FUNCTION = "encode"
    CATEGORY = "Utilities" # You can change this category
    TITLE = "Prompt History (CLIP Text Encode)"

    def encode(self, clip, history_name, text):
        """
        Performs the CLIP encoding and saves the prompt (initially without an image).
        """
        print(f"[PromptHistoryNode] encode() called: '{history_name}' / Prompt: {text[:50]}...")
        
        try:
            # Save the prompt text immediately on encode
            # The image and metadata will be added later by the frontend listener
            save_prompt(history_name, text, image_path=None, metadata=None)
        except Exception as e:
            print(f"[PromptHistoryNode] ERROR: Failed to save prompt during encode(): {e}")
            traceback.print_exc()
            
        # Perform the standard CLIPTextEncode operation
        tokens = clip.tokenize(text)
        cond, pooled = clip.encode_from_tokens(tokens, return_pooled=True)
        return ([[cond, {"pooled_output": pooled}]], )

# --- Node Mappings ---
NODE_CLASS_MAPPINGS = {
    "PromptHistoryClipTextEncode": PromptHistoryClipTextEncode,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "PromptHistoryClipTextEncode": "Prompt History (CLIP Text Encode)",
}
