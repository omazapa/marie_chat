from typing import List, Dict, Optional
from datetime import datetime

class ReferenceService:
    def __init__(self, opensearch_service):
        self.opensearch = opensearch_service
    
    def get_referenced_conversations(
        self, 
        conversation_ids: List[str],
        user_id: str,
        max_messages_per_conv: int = 20
    ) -> List[Dict]:
        """Obtener conversaciones referenciadas con sus mensajes"""
        referenced_convs = []
        if not conversation_ids:
            return referenced_convs
            
        print(f"[REF_SERVICE] Fetching {len(conversation_ids)} conversations for user {user_id}")
        
        for conv_id in conversation_ids:
            # Verificar que la conversación pertenece al usuario
            conv = self.opensearch.get_conversation(conv_id)
            if not conv:
                print(f"[REF_SERVICE] Conversation {conv_id} not found")
                continue
            
            if conv["user_id"] != user_id:
                print(f"[REF_SERVICE] Conversation {conv_id} does not belong to user {user_id}")
                continue
            
            # Obtener mensajes de la conversación
            messages = self.opensearch.get_conversation_messages(
                conv_id, 
                limit=max_messages_per_conv
            )
            print(f"[REF_SERVICE] Found {len(messages)} messages for conversation {conv_id} ('{conv.get('title')}')")
            
            referenced_convs.append({
                "id": conv_id,
                "title": conv.get("title", "Sin título"),
                "created_at": conv.get("created_at"),
                "messages": messages,
                "message_count": len(messages)
            })
        
        return referenced_convs

    def get_referenced_messages(
        self,
        message_ids: List[str],
        user_id: str
    ) -> List[Dict]:
        """Obtener mensajes específicos referenciados"""
        referenced_msgs = []
        if not message_ids:
            return referenced_msgs
            
        print(f"[REF_SERVICE] Fetching {len(message_ids)} specific messages for user {user_id}")
        
        for msg_id in message_ids:
            msg = self.opensearch.get_message(msg_id)
            if not msg:
                print(f"[REF_SERVICE] Message {msg_id} not found")
                continue
            
            if msg["user_id"] != user_id:
                print(f"[REF_SERVICE] Message {msg_id} does not belong to user {user_id}")
                continue
            
            referenced_msgs.append(msg)
            
        return referenced_msgs
    
    def build_context_with_references(
        self,
        user_message: str,
        referenced_conv_ids: List[str],
        user_id: str,
        include_full_history: bool = False,
        referenced_msg_ids: List[str] = None
    ) -> str:
        """Construir prompt incluyendo contexto de conversaciones y mensajes referenciados"""
        if not referenced_conv_ids and not referenced_msg_ids:
            return user_message
        
        referenced_convs = self.get_referenced_conversations(
            referenced_conv_ids or [],
            user_id,
            max_messages_per_conv=50 if include_full_history else 20
        )
        
        referenced_msgs = self.get_referenced_messages(
            referenced_msg_ids or [],
            user_id
        )
        
        if not referenced_convs and not referenced_msgs:
            return user_message
        
        context_parts = [
            "=== CONTEXTO DE REFERENCIAS SELECCIONADAS POR EL USUARIO ===\n",
            "INSTRUCCIONES PARA EL ASISTENTE:",
            "1. El usuario ha seleccionado elementos específicos (chats o mensajes) como contexto relevante.",
            "2. Úsalas para responder a la pregunta actual.",
            "3. Si hay mensajes específicos referenciados, dales prioridad ya que son puntos exactos de interés.\n"
        ]
        
        # Agregar mensajes específicos primero
        if referenced_msgs:
            context_parts.append("\n--- MENSAJES ESPECÍFICOS REFERENCIADOS ---")
            for msg in referenced_msgs:
                role = "USUARIO" if msg.get("role") == "user" else "ASISTENTE"
                context_parts.append(f"[{role}]: {msg.get('content', '')}")
            context_parts.append("--- FIN DE MENSAJES ESPECÍFICOS ---\n")
        
        # Agregar conversaciones completas
        for conv in referenced_convs:
            context_parts.append(f"\n--- INICIO DE CONVERSACIÓN: {conv['title']} ---")
            context_parts.append(f"(ID: {conv['id']}, Mensajes incluidos: {conv['message_count']})\n")
            
            # Incluir mensajes relevantes
            for msg in conv["messages"]:
                role = msg.get("role", "unknown")
                content = msg.get("content", "")
                
                if role == "user":
                    context_parts.append(f"USUARIO: {content}")
                elif role == "assistant":
                    context_parts.append(f"ASISTENTE: {content}")
            
            context_parts.append(f"--- FIN DE CONVERSACIÓN: {conv['title']} ---\n")
        
        context_parts.append("\n=== FIN DEL CONTEXTO REFERENCIADO ===\n")
        context_parts.append(f"\nPREGUNTA ACTUAL DEL USUARIO: {user_message}")
        
        final_context = "\n".join(context_parts)
        print(f"[REF_SERVICE] Built context length: {len(final_context)}")
        return final_context

# Global instance will be initialized in provider_factory or similar if needed, 
# but usually we'll inject it.
