import logging
import time
import asyncio
import os
import requests
from datetime import datetime, timezone
from typing import Dict, Any, List
import openai
from app.handlers.basehandler import BaseNodeHandler
from app.models.workflow_message import NodeExecutionMessage, NodeCompletionMessage
from app.core.config import settings

logger = logging.getLogger(__name__)

class SearchAgentHandler(BaseNodeHandler):
    """AI agent that can search the web and provide intelligent answers with execution-specific Redis API key"""
    
    def __init__(self, redis_service):
        super().__init__(redis_service)
        logger.info("🔧 Initializing search agent handler...")
        
      
        self.client = None
        self.search_api_key = None
        self._api_key_cache = None
        self._execution_id_cache = None 
        self._initialize_search_key()
        
        logger.info("🕵️ Search agent handler initialized")

    def _initialize_search_key(self):
        """Initialize search API key"""
        try:
            self.search_api_key = os.getenv('SERPAPI_KEY') or getattr(settings, 'serpapi_key', None)
            if self.search_api_key:
                logger.info("✅ SerpAPI key found")
            else:
                logger.warning("⚠️ No SerpAPI key found - will use free search alternatives")
        except Exception as e:
            logger.error(f"❌ Failed to initialize search key: {e}")

    async def _get_openai_client(self, execution_id: str,message:NodeExecutionMessage):
        """Get or create OpenAI client with execution-specific API key from Redis"""
        try:
           
            if (self.client is not None and 
                self._api_key_cache and 
                self._execution_id_cache == execution_id):
                return self.client
            
     
            execution_key = f"execution:{execution_id}:openai_api_key"
            api_key=message.context.get("openai")
            
            if api_key:
                logger.info(f"📝 Using execution-specific OpenAI API key from Redis: {execution_key}")
            else:
              
                api_key = await self.redis_service.get("openai_api_key")
                if api_key:
                    logger.info("📝 Using global OpenAI API key from Redis")
                else:
          
                    api_key = (
                        os.getenv('OPENAI_API_KEY') or 
                        os.getenv('OPENAI_KEY') or
                        getattr(settings, 'openai_api_key', None)
                    )
                    if api_key:
                        logger.info("📝 Using OpenAI API key from environment/settings")
            
            if not api_key or not api_key.strip():
                logger.warning("⚠️ OpenAI API key not found - will use fallback mode")
                return None
            
       
            if (api_key != self._api_key_cache or 
                execution_id != self._execution_id_cache or 
                self.client is None):
                
                self.client = openai.OpenAI(api_key=api_key)
                self._api_key_cache = api_key
                self._execution_id_cache = execution_id
                logger.info(f"✅ OpenAI client initialized for execution: {execution_id}")
            
            return self.client
            
        except Exception as e:
            logger.error(f"❌ Failed to get OpenAI client for execution {execution_id}: {e}")
            return None

    async def execute(self, message: NodeExecutionMessage) -> Dict[str, Any]:
        start_time = time.time()
        logger.info(f"🕵️ Executing search-agent node: {message.nodeId}")

        try:
            node_data = message.nodeData
            context = message.context or {}

            query = self.substitute_template_variables(node_data.get("query", ""), context)
            max_results = node_data.get("max_results", 3)
            
            if not query.strip():
                raise ValueError("No query provided")

            logger.info(f"🔍 Search agent processing: {query}")

           
            execution_id = str(message.executionId)
            client = await self._get_openai_client(execution_id,message)

            if client:
                try:
                    search_decision = await self._analyze_query(query, client)
                    
                    if search_decision["needs_search"]:
                        search_results = await self._web_search(search_decision["search_terms"], max_results)
                        final_answer = await self._synthesize_answer(query, search_results, client)
                    else:
                        final_answer = await self._direct_answer(query, client)
                        search_results = []
                        
                except Exception as openai_error:
                    logger.warning(f"⚠️ OpenAI failed, switching to fallback: {openai_error}")
                    search_decision = {"needs_search": True, "search_terms": [query]}
                    search_results = await self._web_search([query], max_results)
                    final_answer = self._fallback_answer(query, search_results)
            else:
                logger.info("🔄 Using fallback mode (no OpenAI)")
                search_decision = {"needs_search": True, "search_terms": [query]}
                search_results = await self._web_search([query], max_results)
                final_answer = self._fallback_answer(query, search_results)

       
            api_key_source = await self._determine_api_key_source(execution_id)

            output = {
                **context,
                "query": query,
                "answer": final_answer,
                "search_performed": search_decision["needs_search"],
                "search_terms": search_decision.get("search_terms", [query]),
                "search_results": search_results,
                "sources_used": len(search_results),
                "ai_mode": client is not None,
                "node_type": "search-agent",
                "node_executed_at": datetime.now().isoformat(),
                "api_key_source": api_key_source,
                "execution_id": execution_id
            }

            processing_time = int((time.time() - start_time) * 1000)
            await self._publish_completion_event(message, output, "COMPLETED", processing_time)

            logger.info(f"✅ Search agent completed with {len(search_results)} sources")
            return output

        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            logger.error(f"❌ Search agent failed: {e}")

            error_output = {
                **context,
                "error": str(e),
                "query": node_data.get("query", ""),
                "answer": None,
                "ai_mode": self.client is not None,
                "node_type": "search-agent",
                "execution_id": str(message.executionId)
            }

            await self._publish_completion_event(message, error_output, "FAILED", processing_time)
            raise

    async def _determine_api_key_source(self, execution_id: str) -> str:
        """Determine which source the API key came from for logging"""
        execution_key = f"execution:{execution_id}:openai_api_key"
        
        if await self.redis_service.get(execution_key):
            return f"execution_specific_redis:{execution_key}"
        elif await self.redis_service.get("openai_api_key"):
            return "global_redis"
        else:
            return "environment"

    async def _analyze_query(self, query: str, client) -> Dict[str, Any]:
        """AI analyzes if search is needed (with fallback)"""
        if not client:
            return {"needs_search": True, "search_terms": [query]}
        
        def _call_openai():
            try:
                prompt = f"""Analyze this query and decide if web search is needed:
Query: "{query}"

If the query needs current information, recent data, or specific facts you might not know, respond with:
SEARCH_NEEDED: yes
SEARCH_TERMS: [comma-separated search terms]

If you can answer directly with general knowledge, respond with:
SEARCH_NEEDED: no

Query: {query}"""

                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=100,
                    temperature=0.1,
                    timeout=30
                )
                
                result = response.choices[0].message.content.strip()
                
                if "SEARCH_NEEDED: yes" in result:
                    search_terms = []
                    for line in result.split('\n'):
                        if 'SEARCH_TERMS:' in line:
                            terms_str = line.split('SEARCH_TERMS:')[1].strip()
                            search_terms = [term.strip() for term in terms_str.split(',')]
                            break
                    
                    return {"needs_search": True, "search_terms": search_terms or [query]}
                else:
                    return {"needs_search": False}
                    
            except openai.AuthenticationError as e:
                logger.error(f"❌ OpenAI Authentication Error: {e}")
                raise RuntimeError(f"Invalid OpenAI API key: {e}")
            except openai.RateLimitError as e:
                logger.error(f"❌ OpenAI Rate Limit Error: {e}")
                raise RuntimeError(f"OpenAI rate limit exceeded: {e}")
            except openai.APIError as e:
                logger.error(f"❌ OpenAI API Error: {e}")
                raise RuntimeError(f"OpenAI API error: {e}")
            except Exception as e:
                logger.error(f"❌ Unexpected OpenAI error: {e}")
                raise RuntimeError(f"OpenAI request failed: {e}")

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _call_openai)

    async def _web_search(self, search_terms: List[str], max_results: int) -> List[Dict]:
        """Perform web search with multiple fallback options"""
        try:
            query = " ".join(search_terms)
            
            if self.search_api_key:
                return await self._serpapi_search(query, max_results)
            else:
                return await self._fallback_search(query, max_results)
                
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return self._mock_search_results(search_terms)

    async def _serpapi_search(self, query: str, max_results: int) -> List[Dict]:
        """Search using SerpAPI"""
        url = "https://serpapi.com/search"
        params = {
            "q": query,
            "api_key": self.search_api_key,
            "num": max_results
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        results = []
        for result in data.get("organic_results", [])[:max_results]:
            results.append({
                "title": result.get("title", ""),
                "snippet": result.get("snippet", ""),
                "url": result.get("link", "")
            })
        
        return results

    async def _fallback_search(self, query: str, max_results: int) -> List[Dict]:
        """Fallback search using free APIs or web scraping"""
        try:
            url = "https://api.duckduckgo.com/"
            params = {
                "q": query,
                "format": "json",
                "no_html": "1",
                "skip_disambig": "1"
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            results = []
            
            if data.get("Abstract"):
                results.append({
                    "title": data.get("AbstractSource", "DuckDuckGo"),
                    "snippet": data.get("Abstract", ""),
                    "url": data.get("AbstractURL", "")
                })
            
            for topic in data.get("RelatedTopics", [])[:max_results-1]:
                if isinstance(topic, dict) and topic.get("Text"):
                    results.append({
                        "title": topic.get("Text", "")[:50] + "...",
                        "snippet": topic.get("Text", ""),
                        "url": topic.get("FirstURL", "")
                    })
            
            return results if results else self._mock_search_results([query])
            
        except Exception as e:
            logger.warning(f"Fallback search failed: {e}")
            return self._mock_search_results([query])

    def _mock_search_results(self, search_terms: List[str]) -> List[Dict]:
        """Generate mock search results when no search API is available"""
        query = " ".join(search_terms)
        return [
            {
                "title": f"Search Results for: {query}",
                "snippet": f"This is a simulated search result for '{query}'. To get real search results, configure SERPAPI_KEY or other search API credentials.",
                "url": "https://example.com/search"
            },
            {
                "title": f"More Information about {query}",
                "snippet": f"Additional simulated content related to '{query}'. Real search functionality requires proper API configuration.",
                "url": "https://example.com/info"
            }
        ]

    async def _synthesize_answer(self, query: str, search_results: List[Dict], client) -> str:
        """AI synthesizes search results (with fallback)"""
        if not client:
            return self._fallback_answer(query, search_results)
        
        def _call_openai():
            try:
                results_text = "\n".join([
                    f"Source: {r['title']}\nContent: {r['snippet']}\nURL: {r['url']}\n"
                    for r in search_results
                ])
                
                prompt = f"""Based on the following search results, provide a comprehensive answer to the user's query.

Query: {query}

Search Results:
{results_text}

Provide a detailed, accurate answer based on the search results. Cite sources when relevant."""

                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=500,
                    temperature=0.3,
                    timeout=30
                )
                
                return response.choices[0].message.content.strip()
                
            except Exception as e:
                logger.error(f"❌ OpenAI synthesis error: {e}")
                return self._fallback_answer(query, search_results)

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _call_openai)

    async def _direct_answer(self, query: str, client) -> str:
        """AI provides direct answer without search"""
        if not client:
            return f"Unable to answer '{query}' directly without search results. Please configure OpenAI API key for direct answers."
        
        def _call_openai():
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": query}],
                    max_tokens=300,
                    temperature=0.3,
                    timeout=30
                )
                return response.choices[0].message.content.strip()
                
            except Exception as e:
                logger.error(f"❌ OpenAI direct answer error: {e}")
                return f"I understand you're asking about '{query}', but I'm having trouble accessing my AI capabilities right now. Please try again or rephrase your question."

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _call_openai)

    def _fallback_answer(self, query: str, search_results: List[Dict]) -> str:
        """Provide basic answer without AI"""
        if not search_results:
            return f"No search results found for: {query}"
        
        answer_parts = [f"Search results for '{query}':"]
        
        for i, result in enumerate(search_results[:3], 1):
            title = result.get('title', 'No title')
            snippet = result.get('snippet', 'No description')
            answer_parts.append(f"\n{i}. {title}\n   {snippet}")
        
        return "\n".join(answer_parts)

    def debug_setup(self) -> Dict[str, Any]:
        """Debug method to check API setup"""
        return {
            "openai_client_available": self.client is not None,
            "serpapi_key_available": self.search_api_key is not None,
            "openai_key_found": bool(os.getenv('OPENAI_API_KEY')),
            "serpapi_key_found": bool(os.getenv('SERPAPI_KEY')),
            "config_openai_key": bool(getattr(settings, 'openai_api_key', None)),
            "fallback_mode": self.client is None
        }

    async def _publish_completion_event(self, message: NodeExecutionMessage,
                                      output: Dict[str, Any], status: str, processing_time: int):
        try:
            from app.main import app
            completion_message = NodeCompletionMessage(
                executionId=message.executionId,
                workflowId=message.workflowId,
                nodeId=message.nodeId,
                nodeType=message.nodeType,
                status=status,
                output=output,
                error=output.get("error") if status == "FAILED" else None,
                timestamp=datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z'),
                processingTime=processing_time
            )
            
            if hasattr(app.state, 'kafka_service'):
                await app.state.kafka_service.publish_completion(completion_message)
        except Exception as e:
            logger.error(f"Failed to publish completion event: {e}")

    async def update_api_key_in_redis(self, new_api_key: str, execution_id: str = None):
        """Helper method to update API key in Redis"""
        try:
            if execution_id:
                
                execution_key = f"execution:{execution_id}:openai_api_key"
                await self.redis_service.set(execution_key, new_api_key)
                logger.info(f"✅ OpenAI API key updated in Redis for execution: {execution_id}")
            else:
               
                await self.redis_service.set("openai_api_key", new_api_key)
                logger.info("✅ Global OpenAI API key updated in Redis")
            
          
            self.client = None
            self._api_key_cache = None
            self._execution_id_cache = None
            
            return {"status": "success", "message": "API key updated in Redis"}
        except Exception as e:
            logger.error(f"❌ Failed to update API key in Redis: {e}")
            raise