"""
V1 Documentation Routes
Serves OpenAPI/Swagger documentation for the Developer API
"""
from flask import Blueprint, jsonify, render_template_string

v1_docs_bp = Blueprint('v1_docs', __name__)

SWAGGER_UI_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>MARIE Developer API - Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" >
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"> </script>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"> </script>
    <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/api/v1/docs/swagger.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      })
      window.ui = ui
    }
    </script>
</body>
</html>
"""

@v1_docs_bp.route('')
def docs():
    """Serve Swagger UI"""
    return render_template_string(SWAGGER_UI_HTML)

@v1_docs_bp.route('/swagger.json')
def swagger_json():
    """Serve OpenAPI specification"""
    spec = {
        "openapi": "3.0.0",
        "info": {
            "title": "MARIE Developer API",
            "description": "Machine-Assisted Research Intelligent Environment (MARIE) - External REST API for developers.",
            "version": "1.0.0",
            "contact": {
                "name": "ImpactU/CoLaV Team",
                "url": "https://github.com/colav"
            }
        },
        "servers": [
            {
                "url": "/api/v1",
                "description": "Local server"
            }
        ],
        "components": {
            "securitySchemes": {
                "ApiKeyAuth": {
                    "type": "apiKey",
                    "in": "header",
                    "name": "X-API-Key"
                }
            }
        },
        "security": [
            {
                "ApiKeyAuth": []
            }
        ],
        "paths": {
            "/chat/completions": {
                "post": {
                    "tags": ["Chat"],
                    "summary": "Create a chat completion",
                    "description": "Generates a response from the LLM for a given set of messages.",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "messages": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "role": {"type": "string", "enum": ["user", "assistant", "system"]},
                                                    "content": {"type": "string"}
                                                }
                                            }
                                        },
                                        "model": {"type": "string", "default": "llama3.2"},
                                        "stream": {"type": "boolean", "default": False},
                                        "conversation_id": {"type": "string"}
                                    },
                                    "required": ["messages"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Successful response",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object"
                                    }
                                },
                                "text/event-stream": {
                                    "description": "SSE stream of chunks if stream=true"
                                }
                            }
                        }
                    }
                }
            },
            "/conversations": {
                "get": {
                    "tags": ["Conversations"],
                    "summary": "List conversations",
                    "parameters": [
                        {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 20}},
                        {"name": "offset", "in": "query", "schema": {"type": "integer", "default": 0}}
                    ],
                    "responses": {
                        "200": {
                            "description": "List of conversations",
                            "content": {"application/json": {"schema": {"type": "object"}}}
                        }
                    }
                },
                "post": {
                    "tags": ["Conversations"],
                    "summary": "Create a conversation",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "title": {"type": "string"},
                                        "model": {"type": "string"},
                                        "provider": {"type": "string"},
                                        "system_prompt": {"type": "string"}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "description": "Conversation created"
                        }
                    }
                }
            },
            "/conversations/{id}": {
                "get": {
                    "tags": ["Conversations"],
                    "summary": "Get conversation details",
                    "parameters": [{"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}],
                    "responses": {"200": {"description": "Conversation details"}}
                },
                "delete": {
                    "tags": ["Conversations"],
                    "summary": "Delete a conversation",
                    "parameters": [{"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}],
                    "responses": {"200": {"description": "Conversation deleted"}}
                }
            },
            "/conversations/{id}/messages": {
                "get": {
                    "tags": ["Conversations"],
                    "summary": "Get conversation messages",
                    "parameters": [{"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}],
                    "responses": {"200": {"description": "List of messages"}}
                }
            },
            "/search": {
                "get": {
                    "tags": ["Search"],
                    "summary": "Search history",
                    "parameters": [
                        {"name": "q", "in": "query", "required": True, "schema": {"type": "string"}},
                        {"name": "type", "in": "query", "schema": {"type": "string", "enum": ["text", "semantic"], "default": "text"}},
                        {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 10}}
                    ],
                    "responses": {"200": {"description": "Search results"}}
                }
            }
        }
    }
    return jsonify(spec)
