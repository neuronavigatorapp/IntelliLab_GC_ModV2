"""
Knowledge Base Retriever

This module handles retrieval of relevant information from the local knowledge base.
It provides semantic search and document retrieval capabilities.
"""

import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import re

logger = logging.getLogger(__name__)

class KBRetriever:
    """Local Knowledge Base retrieval handler"""
    
    def __init__(self, kb_path: str = "data/kb"):
        self.kb_path = Path(kb_path)
        self.documents = {}
        self._load_documents()
    
    def _load_documents(self):
        """Load all documents from the knowledge base"""
        if not self.kb_path.exists():
            logger.warning(f"Knowledge base path not found: {self.kb_path}")
            return
            
        self.documents = {}
        for doc_file in self.kb_path.glob("*.json"):
            try:
                with open(doc_file, 'r', encoding='utf-8') as f:
                    doc_data = json.load(f)
                    self.documents[doc_data['filename']] = doc_data
            except Exception as e:
                logger.error(f"Error loading document {doc_file}: {e}")
                
        logger.info(f"Loaded {len(self.documents)} documents from knowledge base")
    
    def search(self, query: str, max_results: int = 5) -> List[Dict]:
        """
        Search for relevant documents based on query
        
        Args:
            query: Search query string
            max_results: Maximum number of results to return
            
        Returns:
            List of relevant document snippets with metadata
        """
        if not self.documents:
            logger.warning("No documents loaded in knowledge base")
            return []
            
        # Simple keyword-based search for now
        # In a full implementation, this would use embeddings and semantic search
        query_terms = self._extract_terms(query.lower())
        
        results = []
        for filename, doc_data in self.documents.items():
            score = self._calculate_relevance_score(doc_data['content'], query_terms)
            if score > 0:
                snippet = self._extract_snippet(doc_data['content'], query_terms)
                results.append({
                    'filename': filename,
                    'score': score,
                    'snippet': snippet,
                    'content': doc_data['content']
                })
        
        # Sort by relevance score and return top results
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:max_results]
    
    def _extract_terms(self, query: str) -> List[str]:
        """Extract meaningful terms from query"""
        # Remove common stop words and extract meaningful terms
        stop_words = {'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by'}
        terms = re.findall(r'\b\w+\b', query.lower())
        return [term for term in terms if term not in stop_words and len(term) > 2]
    
    def _calculate_relevance_score(self, content: str, query_terms: List[str]) -> float:
        """Calculate relevance score for document content"""
        if not query_terms:
            return 0.0
            
        content_lower = content.lower()
        score = 0.0
        
        for term in query_terms:
            # Count occurrences of each term
            occurrences = len(re.findall(r'\b' + re.escape(term) + r'\b', content_lower))
            if occurrences > 0:
                # Base score for presence, bonus for multiple occurrences
                score += 1.0 + min(occurrences * 0.1, 1.0)
        
        # Normalize by document length
        if len(content) > 0:
            score = score / (len(content) / 1000)  # Per 1000 characters
            
        return score
    
    def _extract_snippet(self, content: str, query_terms: List[str], max_length: int = 300) -> str:
        """Extract relevant snippet from document content"""
        if not query_terms:
            return content[:max_length] + "..." if len(content) > max_length else content
            
        # Find the first occurrence of any query term
        content_lower = content.lower()
        best_position = len(content)
        
        for term in query_terms:
            pos = content_lower.find(term.lower())
            if pos != -1 and pos < best_position:
                best_position = pos
        
        if best_position == len(content):
            # No terms found, return beginning
            return content[:max_length] + "..." if len(content) > max_length else content
        
        # Extract snippet around the found term
        start = max(0, best_position - max_length // 2)
        end = min(len(content), start + max_length)
        
        snippet = content[start:end]
        if start > 0:
            snippet = "..." + snippet
        if end < len(content):
            snippet = snippet + "..."
            
        return snippet
    
    def get_document(self, filename: str) -> Optional[Dict]:
        """Get full document by filename"""
        return self.documents.get(filename)
    
    def list_documents(self) -> List[str]:
        """Get list of all document filenames in the knowledge base"""
        return list(self.documents.keys())
    
    def get_context_for_query(self, query: str, max_context_length: int = 2000) -> str:
        """
        Get relevant context for a query to use in LLM prompts
        
        Args:
            query: The query to find context for
            max_context_length: Maximum length of returned context
            
        Returns:
            Formatted context string
        """
        results = self.search(query, max_results=3)
        
        if not results:
            return "No relevant documentation found in knowledge base."
        
        context_parts = []
        for result in results:
            context_parts.append(f"From {result['filename']}:\n{result['snippet']}")
        
        context = "\n\n".join(context_parts)
        
        # Truncate if too long
        if len(context) > max_context_length:
            context = context[:max_context_length] + "..."
        
        return f"Relevant documentation:\n\n{context}"


# Convenience functions for easy import and use
def search_kb(query: str, kb_path: str = "data/kb", max_results: int = 5) -> List[Dict]:
    """Convenience function to search knowledge base"""
    retriever = KBRetriever(kb_path)
    return retriever.search(query, max_results)

def get_context(query: str, kb_path: str = "data/kb", max_length: int = 2000) -> str:
    """Convenience function to get context for LLM prompts"""
    retriever = KBRetriever(kb_path)
    return retriever.get_context_for_query(query, max_length)