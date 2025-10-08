#!/usr/bin/env python3
"""
Knowledge Base Ingestion Script

This script handles local ingestion of documents into the knowledge base.
It processes various document formats and creates embeddings for retrieval.
"""

import os
import sys
import logging
import argparse
from pathlib import Path
from typing import List, Optional
import json

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class KBIngestor:
    """Local Knowledge Base document ingestion handler"""
    
    def __init__(self, kb_path: str = "data/kb"):
        self.kb_path = Path(kb_path)
        self.kb_path.mkdir(parents=True, exist_ok=True)
        
    def ingest_document(self, file_path: str) -> bool:
        """
        Ingest a single document into the knowledge base
        
        Args:
            file_path: Path to the document to ingest
            
        Returns:
            bool: Success status
        """
        try:
            file_path = Path(file_path)
            if not file_path.exists():
                logger.error(f"File not found: {file_path}")
                return False
                
            logger.info(f"Ingesting document: {file_path}")
            
            # Read and process the document
            content = self._extract_content(file_path)
            if not content:
                logger.warning(f"No content extracted from: {file_path}")
                return False
                
            # Store in knowledge base
            self._store_document(file_path.name, content)
            logger.info(f"Successfully ingested: {file_path.name}")
            return True
            
        except Exception as e:
            logger.error(f"Error ingesting document {file_path}: {e}")
            return False
    
    def _extract_content(self, file_path: Path) -> str:
        """Extract text content from various file formats"""
        try:
            if file_path.suffix.lower() in ['.txt', '.md']:
                return file_path.read_text(encoding='utf-8')
            elif file_path.suffix.lower() == '.pdf':
                # PDF processing would go here if needed
                logger.warning("PDF processing not implemented yet")
                return ""
            else:
                logger.warning(f"Unsupported file type: {file_path.suffix}")
                return ""
        except Exception as e:
            logger.error(f"Error extracting content from {file_path}: {e}")
            return ""
    
    def _store_document(self, filename: str, content: str):
        """Store document content in the knowledge base"""
        # Simple file-based storage for now
        doc_file = self.kb_path / f"{filename}.json"
        doc_data = {
            "filename": filename,
            "content": content,
            "timestamp": str(Path().stat().st_mtime if Path().exists() else 0)
        }
        
        with open(doc_file, 'w', encoding='utf-8') as f:
            json.dump(doc_data, f, indent=2, ensure_ascii=False)
    
    def ingest_directory(self, dir_path: str, recursive: bool = True) -> int:
        """
        Ingest all documents from a directory
        
        Args:
            dir_path: Path to directory containing documents
            recursive: Whether to search subdirectories
            
        Returns:
            int: Number of documents successfully ingested
        """
        dir_path = Path(dir_path)
        if not dir_path.is_dir():
            logger.error(f"Directory not found: {dir_path}")
            return 0
            
        pattern = "**/*" if recursive else "*"
        files = [f for f in dir_path.glob(pattern) if f.is_file()]
        
        success_count = 0
        for file_path in files:
            if self.ingest_document(file_path):
                success_count += 1
                
        logger.info(f"Ingested {success_count} out of {len(files)} documents")
        return success_count


def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(description="Ingest documents into local knowledge base")
    parser.add_argument("path", help="Path to document or directory to ingest")
    parser.add_argument("--kb-path", default="data/kb", help="Knowledge base storage path")
    parser.add_argument("--recursive", "-r", action="store_true", 
                       help="Recursively process directories")
    
    args = parser.parse_args()
    
    ingestor = KBIngestor(args.kb_path)
    
    path = Path(args.path)
    if path.is_file():
        success = ingestor.ingest_document(str(path))
        sys.exit(0 if success else 1)
    elif path.is_dir():
        count = ingestor.ingest_directory(str(path), args.recursive)
        sys.exit(0 if count > 0 else 1)
    else:
        logger.error(f"Path not found: {path}")
        sys.exit(1)


if __name__ == "__main__":
    main()