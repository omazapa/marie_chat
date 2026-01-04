from opensearchpy import OpenSearch

from app.config import settings


class OpenSearchClient:
    """Singleton OpenSearch client"""

    _instance = None
    _client: OpenSearch | None = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            self._client = OpenSearch(
                hosts=settings.opensearch_hosts_list,
                http_auth=(settings.OPENSEARCH_USER, settings.OPENSEARCH_PASSWORD),
                use_ssl=settings.OPENSEARCH_USE_SSL,
                verify_certs=settings.OPENSEARCH_VERIFY_CERTS,
                ssl_show_warn=False,
                timeout=30,
                max_retries=3,
                retry_on_timeout=True,
            )

    @property
    def client(self) -> OpenSearch:
        if self._client is None:
            raise RuntimeError("OpenSearch client not initialized")
        return self._client

    def close(self):
        if self._client:
            self._client.close()
            self._client = None


# Global instance
opensearch_client = OpenSearchClient()
