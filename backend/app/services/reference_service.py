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
    
    def build_context_with_references(
        self,
        user_message: str,
        referenced_conv_ids: List[str],
        user_id: str,
        include_full_history: bool = False
    ) -> str:
        """Construir prompt incluyendo contexto de conversaciones referenciadas"""
        if not referenced_conv_ids:
            return user_message
        
        referenced_convs = self.get_referenced_conversations(
            referenced_conv_ids,
            user_id,
            max_messages_per_conv=50 if include_full_history else 20
        )
        
        if not referenced_convs:
            return user_message
        
        context_parts = [
            "=== CONTEXTO DE CONVERSACIONES ANTERIORES REFERENCIADAS POR EL USUARIO ===\n",
            "INSTRUCCIONES PARA EL ASISTENTE:",
            "1. El usuario ha adjuntado estas conversaciones previas como contexto relevante.",
            "2. Úsalas para responder a la pregunta actual, especialmente si el usuario hace referencia a 'lo que hablamos antes' o temas específicos de estos chats.",
            "3. Mantén la continuidad si el usuario está retomando un tema de una de estas conversaciones.",
            "4. Si la pregunta actual no parece relacionada, prioriza la pregunta actual pero mantén el contexto en mente.\n"
        ]
        
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
