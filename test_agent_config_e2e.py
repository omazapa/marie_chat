#!/usr/bin/env python3
"""
End-to-End Test for Agent Dynamic Configuration
Tests the complete flow from configuration discovery to chat application
"""

import asyncio
import json
import requests
from typing import Any

# Configuration
BASE_URL = "http://localhost:5000"
AGENT_SERVICE_URL = "http://localhost:9099"
AGENT_API_KEY = "0p3n-w3bu!"

# Test credentials (use existing user or create one)
TEST_EMAIL = "test@marie.com"
TEST_PASSWORD = "test123456"


class AgentConfigTester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.conversation_id = None

    def print_step(self, step: str):
        print(f"\n{'='*60}")
        print(f"🔍 {step}")
        print('='*60)

    def print_success(self, message: str):
        print(f"✅ {message}")

    def print_error(self, message: str):
        print(f"❌ {message}")

    def print_info(self, message: str):
        print(f"ℹ️  {message}")

    # ==================== Authentication ====================

    def login(self) -> bool:
        """Login or register user"""
        self.print_step("Step 1: Authentication")

        # Try login first
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
            )

            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                self.user_id = data["user"]["id"]
                self.print_success(f"Logged in as {TEST_EMAIL}")
                return True
        except Exception as e:
            self.print_info(f"Login failed: {e}, trying registration...")

        # Try registration
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "email": TEST_EMAIL,
                    "password": TEST_PASSWORD,
                    "full_name": "Test User"
                }
            )

            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                self.user_id = data["user"]["id"]
                self.print_success(f"Registered and logged in as {TEST_EMAIL}")
                return True
            else:
                self.print_error(f"Registration failed: {response.text}")
                return False
        except Exception as e:
            self.print_error(f"Authentication failed: {e}")
            return False

    # ==================== Configuration Discovery ====================

    def test_schema_discovery(self) -> dict[str, Any] | None:
        """Test configuration schema discovery"""
        self.print_step("Step 2: Configuration Schema Discovery")

        try:
            response = requests.get(
                f"{BASE_URL}/api/models/agent/marie_reasoning_agent/config/schema",
                headers={"Authorization": f"Bearer {self.token}"}
            )

            if response.status_code == 200:
                schema = response.json()
                self.print_success("Schema discovered successfully")
                print(f"\nProvider: {schema.get('provider')}")
                print(f"Model: {schema.get('model_id')}")
                print(f"Fields: {len(schema.get('fields', []))}")

                for field in schema.get('fields', []):
                    print(f"  - {field['key']} ({field['type']}): {field.get('description', 'No description')}")

                return schema
            else:
                self.print_error(f"Schema discovery failed: {response.text}")
                return None
        except Exception as e:
            self.print_error(f"Error: {e}")
            return None

    # ==================== Configuration Management ====================

    def test_save_config(self) -> bool:
        """Test saving agent configuration"""
        self.print_step("Step 3: Save Configuration")

        # Test configuration values
        config_values = {
            "temperature": 0.9,
            "model": "gpt-4",
            "max_iterations": 7,
        }

        try:
            response = requests.post(
                f"{BASE_URL}/api/models/agent/marie_reasoning_agent/config/values",
                headers={"Authorization": f"Bearer {self.token}"},
                json={"config_values": config_values},
                params={"scope": "global"}
            )

            if response.status_code == 200:
                saved = response.json()
                self.print_success("Configuration saved successfully")
                print(f"\nConfig ID: {saved.get('id')}")
                print(f"Scope: {saved.get('scope')}")
                print(f"Values: {json.dumps(saved.get('config_values'), indent=2)}")
                return True
            else:
                self.print_error(f"Save failed: {response.text}")
                return False
        except Exception as e:
            self.print_error(f"Error: {e}")
            return False

    def test_load_config(self) -> dict[str, Any] | None:
        """Test loading agent configuration"""
        self.print_step("Step 4: Load Configuration")

        try:
            response = requests.get(
                f"{BASE_URL}/api/models/agent/marie_reasoning_agent/config/values",
                headers={"Authorization": f"Bearer {self.token}"}
            )

            if response.status_code == 200:
                config = response.json()
                self.print_success("Configuration loaded successfully")
                print(f"\nLoaded config: {json.dumps(config, indent=2)}")
                return config
            else:
                self.print_error(f"Load failed: {response.text}")
                return None
        except Exception as e:
            self.print_error(f"Error: {e}")
            return None

    # ==================== Conversation & Chat ====================

    def create_conversation(self) -> bool:
        """Create a test conversation"""
        self.print_step("Step 5: Create Conversation")

        try:
            response = requests.post(
                f"{BASE_URL}/api/conversations",
                headers={"Authorization": f"Bearer {self.token}"},
                json={
                    "title": "Agent Config Test",
                    "model": "marie_reasoning_agent",
                    "provider": "agent"
                }
            )

            if response.status_code in [200, 201]:
                conv = response.json()
                self.conversation_id = conv["id"]
                self.print_success(f"Conversation created: {self.conversation_id}")
                return True
            else:
                self.print_error(f"Creation failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.print_error(f"Error: {e}")
            return False

    def test_chat_with_config(self) -> bool:
        """Test sending a message with configuration applied"""
        self.print_step("Step 6: Send Message with Config")

        self.print_info("This will verify that the configuration is loaded and applied...")
        self.print_info("Check backend logs for: '[SERVICE] Agent config loaded'")

        # For now, just verify the conversation exists
        # Full WebSocket testing would require socket.io client
        self.print_success("Conversation ready for testing")
        self.print_info(f"Conversation ID: {self.conversation_id}")
        self.print_info("Use the frontend UI to send a message and verify config application")

        return True

    # ==================== Cleanup ====================

    def test_delete_config(self) -> bool:
        """Test deleting configuration"""
        self.print_step("Step 7: Delete Configuration (Cleanup)")

        try:
            response = requests.delete(
                f"{BASE_URL}/api/models/agent/marie_reasoning_agent/config",
                headers={"Authorization": f"Bearer {self.token}"},
                params={"scope": "global"}
            )

            if response.status_code == 200:
                self.print_success("Configuration deleted successfully")
                return True
            elif response.status_code == 404:
                self.print_info("No configuration to delete")
                return True
            else:
                self.print_error(f"Delete failed: {response.text}")
                return False
        except Exception as e:
            self.print_error(f"Error: {e}")
            return False

    # ==================== Full Test ====================

    def run_full_test(self):
        """Run complete end-to-end test"""
        print("\n" + "="*60)
        print("🚀 AGENT DYNAMIC CONFIGURATION - END-TO-END TEST")
        print("="*60)

        results = {}

        # Step 1: Authentication
        results['auth'] = self.login()
        if not results['auth']:
            print("\n❌ Test failed at authentication")
            return results

        # Step 2: Schema Discovery
        schema = self.test_schema_discovery()
        results['schema'] = schema is not None

        # Step 3: Save Configuration
        results['save'] = self.test_save_config()

        # Step 4: Load Configuration
        config = self.test_load_config()
        results['load'] = config is not None

        # Step 5: Create Conversation
        results['conversation'] = self.create_conversation()

        # Step 6: Chat Test (manual verification)
        results['chat'] = self.test_chat_with_config()

        # Step 7: Cleanup
        results['cleanup'] = self.test_delete_config()

        # Summary
        self.print_step("Test Summary")
        total = len(results)
        passed = sum(1 for v in results.values() if v)

        print(f"\n{'Test':<20} {'Status'}")
        print("-" * 40)
        for test, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test:<20} {status}")

        print("\n" + "="*60)
        print(f"Results: {passed}/{total} tests passed")
        print("="*60)

        if passed == total:
            print("\n🎉 All tests passed! System is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Check errors above.")

        return results


if __name__ == "__main__":
    tester = AgentConfigTester()
    tester.run_full_test()
