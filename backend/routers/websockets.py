from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from core.websocket import manager
import logging

logger = logging.getLogger("phishguard.websockets")
router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/soc")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    """
    WebSocket Endpoint for live SOC dashboard updates.
    The frontend should connect here to receive newly analyzed push alerts,
    obsoleting the traditional 10s React polling.
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
