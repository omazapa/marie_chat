from typing import Any


class ReferenceService:
    def __init__(self, opensearch_service: Any):
        self.opensearch = opensearch_service

    def get_referenced_conversations(
        self, conversation_ids: list[str], user_id: str, max_messages_per_conv: int = 20
    ) -> list[dict[str, Any]]:
        """Get referenced conversations with their messages"""
        referenced_convs: list[dict[str, Any]] = []
        if not conversation_ids:
            return referenced_convs

        print(f"[REF_SERVICE] Fetching {len(conversation_ids)} conversations for user {user_id}")

        for conv_id in conversation_ids:
            # Verify that the conversation belongs to the user
            conv = self.opensearch.get_conversation(conv_id)
            if not conv:
                print(f"[REF_SERVICE] Conversation {conv_id} not found")
                continue

            if conv["user_id"] != user_id:
                print(f"[REF_SERVICE] Conversation {conv_id} does not belong to user {user_id}")
                continue

            # Get messages from the conversation
            messages = self.opensearch.get_conversation_messages(
                conv_id, limit=max_messages_per_conv
            )
            print(
                f"[REF_SERVICE] Found {len(messages)} messages for conversation {conv_id} ('{conv.get('title')}')"
            )

            referenced_convs.append(
                {
                    "id": conv_id,
                    "title": conv.get("title", "Untitled"),
                    "created_at": conv.get("created_at"),
                    "messages": messages,
                    "message_count": len(messages),
                }
            )

        return referenced_convs

    def get_referenced_messages(self, message_ids: list[str], user_id: str) -> list[dict[str, Any]]:
        """Get specific referenced messages"""
        referenced_msgs: list[dict[str, Any]] = []
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
        referenced_conv_ids: list[str],
        user_id: str,
        include_full_history: bool = False,
        referenced_msg_ids: list[str] | None = None,
    ) -> str:
        """Build prompt including context from referenced conversations and messages"""
        if not referenced_conv_ids and not referenced_msg_ids:
            return user_message

        referenced_convs = self.get_referenced_conversations(
            referenced_conv_ids or [],
            user_id,
            max_messages_per_conv=50 if include_full_history else 20,
        )

        referenced_msgs = self.get_referenced_messages(referenced_msg_ids or [], user_id)

        if not referenced_convs and not referenced_msgs:
            return user_message

        context_parts = [
            "=== CONTEXT FROM REFERENCES SELECTED BY THE USER ===\n",
            "INSTRUCTIONS FOR THE ASSISTANT:",
            "1. The user has selected specific items (chats or messages) as relevant context.",
            "2. Use them to answer the current question.",
            "3. If there are specific referenced messages, give them priority as they are exact points of interest.\n",
        ]

        # Add specific messages first
        if referenced_msgs:
            context_parts.append("\n--- SPECIFIC REFERENCED MESSAGES ---")
            for msg in referenced_msgs:
                role = "USER" if msg.get("role") == "user" else "ASSISTANT"
                context_parts.append(f"[{role}]: {msg.get('content', '')}")
            context_parts.append("--- END OF SPECIFIC MESSAGES ---\n")

        # Add full conversations
        for conv in referenced_convs:
            context_parts.append(f"\n--- START OF CONVERSATION: {conv['title']} ---")
            context_parts.append(
                f"(ID: {conv['id']}, Messages included: {conv['message_count']})\n"
            )

            # Include relevant messages
            for msg in conv["messages"]:
                role = msg.get("role", "unknown")
                content = msg.get("content", "")

                if role == "user":
                    context_parts.append(f"USER: {content}")
                elif role == "assistant":
                    context_parts.append(f"ASSISTANT: {content}")

            context_parts.append(f"--- END OF CONVERSATION: {conv['title']} ---\n")

        context_parts.append("\n=== END OF REFERENCED CONTEXT ===\n")
        context_parts.append(f"\nCURRENT USER QUESTION: {user_message}")

        final_context = "\n".join(context_parts)
        print(f"[REF_SERVICE] Built context length: {len(final_context)}")
        return final_context


# Global instance will be initialized in provider_factory or similar if needed,
# but usually we'll inject it.
