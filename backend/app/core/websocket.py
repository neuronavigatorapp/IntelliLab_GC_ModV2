#!/usr/bin/env python3
"""
WebSocket manager for real-time updates
"""

from fastapi import WebSocket
from typing import List
from loguru import logger
import json


class WebSocketManager:
    """Manage WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Connect a new WebSocket client"""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    async def disconnect(self, websocket: WebSocket):
        """Disconnect a WebSocket client"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def broadcast(self, message: str):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return
        
        # Parse message if it's JSON
        try:
            data = json.loads(message)
            message_type = data.get("type", "update")
            
            # Handle different message types
            if message_type == "calculation_update":
                await self._broadcast_calculation_update(data)
            elif message_type == "parameter_change":
                await self._broadcast_parameter_change(data)
            elif message_type == "instrument_update":
                await self._broadcast_instrument_update(data)
            else:
                await self._broadcast_generic(message)
                
        except json.JSONDecodeError:
            await self._broadcast_generic(message)
    
    async def _broadcast_calculation_update(self, data: dict):
        """Broadcast calculation update"""
        message = {
            "type": "calculation_update",
            "calculation_type": data.get("calculation_type"),
            "results": data.get("results"),
            "timestamp": data.get("timestamp")
        }
        
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting calculation update: {e}")
                await self.disconnect(connection)
    
    async def _broadcast_parameter_change(self, data: dict):
        """Broadcast parameter change"""
        message = {
            "type": "parameter_change",
            "tool": data.get("tool"),
            "parameters": data.get("parameters"),
            "timestamp": data.get("timestamp")
        }
        
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting parameter change: {e}")
                await self.disconnect(connection)
    
    async def _broadcast_instrument_update(self, data: dict):
        """Broadcast instrument update"""
        message = {
            "type": "instrument_update",
            "instrument_id": data.get("instrument_id"),
            "action": data.get("action"),  # create, update, delete
            "data": data.get("data"),
            "timestamp": data.get("timestamp")
        }
        
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting instrument update: {e}")
                await self.disconnect(connection)
    
    async def _broadcast_generic(self, message: str):
        """Broadcast generic message"""
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting generic message: {e}")
                await self.disconnect(connection)
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to specific client"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            await self.disconnect(websocket)


# Create global WebSocket manager instance
websocket_manager = WebSocketManager() 