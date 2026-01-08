#!/usr/bin/env python3
"""
Upload Knowledge Base Documents to Gemini File Search

This script uploads the meta-analysis knowledge base documents to Google's
Gemini File Search API for use in the Glass RAG system.
"""

import os
import json
import time
from pathlib import Path

# Try to import google.genai, install if not available
try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Installing google-genai package...")
    import subprocess
    subprocess.check_call(["pip3", "install", "google-genai"])
    from google import genai
    from google.genai import types

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
KNOWLEDGE_BASE_DIR = Path("/home/ubuntu/meta-agent-mobile/knowledge-base")

# Document metadata
DOCUMENTS = [
    {
        "filename": "cochrane-chapter-10-meta-analysis.md",
        "display_name": "Cochrane Handbook Chapter 10: Meta-analyses",
        "description": "Comprehensive guide to conducting meta-analyses from the Cochrane Handbook"
    },
    {
        "filename": "cochrane-chapter-11-network-meta-analysis.md",
        "display_name": "Cochrane Handbook Chapter 11: Network Meta-analysis",
        "description": "Guide to network meta-analysis methods and interpretation"
    },
    {
        "filename": "cochrane-chapter-14-grade.md",
        "display_name": "Cochrane Handbook Chapter 14: GRADE Assessment",
        "description": "GRADE approach for assessing certainty of evidence"
    },
    {
        "filename": "cochrane-chapter-26-ipd.md",
        "display_name": "Cochrane Handbook Chapter 26: Individual Participant Data",
        "description": "Methods for IPD meta-analysis"
    },
    {
        "filename": "seminal-articles-references.md",
        "display_name": "Seminal Articles in Meta-Analysis",
        "description": "Key foundational papers: Glass 1976, DerSimonian-Laird 1986, Higgins I²"
    },
    {
        "filename": "metafor-package-guide.md",
        "display_name": "metafor R Package Guide",
        "description": "Documentation for the metafor R package for meta-analysis"
    },
    {
        "filename": "cochrane-handbook-structure.md",
        "display_name": "Cochrane Handbook Structure",
        "description": "Overview of Cochrane Handbook chapters and organization"
    },
]


def upload_documents():
    """Upload all knowledge base documents to Gemini."""
    
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        return False
    
    # Initialize the client
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    print(f"Connected to Gemini API")
    print(f"Knowledge base directory: {KNOWLEDGE_BASE_DIR}")
    print("-" * 60)
    
    uploaded_files = []
    
    for doc in DOCUMENTS:
        filepath = KNOWLEDGE_BASE_DIR / doc["filename"]
        
        if not filepath.exists():
            print(f"⚠️  File not found: {doc['filename']}")
            continue
        
        file_size = filepath.stat().st_size
        print(f"\n📄 Uploading: {doc['display_name']}")
        print(f"   File: {doc['filename']} ({file_size:,} bytes)")
        
        try:
            # Upload the file
            with open(filepath, "rb") as f:
                uploaded_file = client.files.upload(
                    file=f,
                    config=types.UploadFileConfig(
                        display_name=doc["display_name"],
                        mime_type="text/markdown"
                    )
                )
            
            print(f"   ✅ Uploaded successfully!")
            print(f"   URI: {uploaded_file.uri}")
            print(f"   Name: {uploaded_file.name}")
            
            uploaded_files.append({
                "filename": doc["filename"],
                "display_name": doc["display_name"],
                "uri": uploaded_file.uri,
                "name": uploaded_file.name,
                "size": file_size
            })
            
            # Small delay to avoid rate limiting
            time.sleep(1)
            
        except Exception as e:
            print(f"   ❌ Error uploading: {str(e)}")
    
    print("\n" + "=" * 60)
    print(f"Upload complete! {len(uploaded_files)}/{len(DOCUMENTS)} files uploaded")
    
    # Save the upload results
    results_file = KNOWLEDGE_BASE_DIR / "upload-results.json"
    with open(results_file, "w") as f:
        json.dump({
            "uploaded_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_files": len(uploaded_files),
            "files": uploaded_files
        }, f, indent=2)
    
    print(f"Results saved to: {results_file}")
    
    return uploaded_files


def list_uploaded_files():
    """List all files currently uploaded to Gemini."""
    
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        return
    
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    print("Listing uploaded files...")
    print("-" * 60)
    
    try:
        files = list(client.files.list())
        
        if not files:
            print("No files found.")
            return
        
        for f in files:
            print(f"\n📄 {f.display_name}")
            print(f"   Name: {f.name}")
            print(f"   URI: {f.uri}")
            print(f"   State: {f.state}")
            print(f"   Size: {f.size_bytes:,} bytes" if f.size_bytes else "   Size: Unknown")
            
    except Exception as e:
        print(f"Error listing files: {str(e)}")


def test_rag_query(query: str):
    """Test RAG retrieval with a sample query."""
    
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY environment variable not set")
        return
    
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    # Load uploaded file URIs
    results_file = KNOWLEDGE_BASE_DIR / "upload-results.json"
    if not results_file.exists():
        print("No upload results found. Run upload first.")
        return
    
    with open(results_file) as f:
        results = json.load(f)
    
    file_uris = [f["uri"] for f in results["files"]]
    
    print(f"Testing RAG query: {query}")
    print(f"Using {len(file_uris)} uploaded files")
    print("-" * 60)
    
    try:
        # Create content with file references
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part(text=f"Based on the uploaded knowledge base documents, please answer: {query}")
                ]
            )
        ]
        
        # Generate response with grounding
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction="You are Glass 🦊, an expert meta-analysis teaching assistant. Use the uploaded knowledge base documents to provide accurate, evidence-based answers. Always cite the source document when referencing specific information.",
            )
        )
        
        print("\n🦊 Glass Response:")
        print(response.text)
        
    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "list":
            list_uploaded_files()
        elif command == "test":
            query = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "What is heterogeneity in meta-analysis?"
            test_rag_query(query)
        else:
            print(f"Unknown command: {command}")
            print("Usage: python upload-to-gemini.py [list|test <query>]")
    else:
        # Default: upload documents
        upload_documents()
