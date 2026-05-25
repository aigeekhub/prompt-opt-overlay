import os
import security

def test_hash_pin():
    print("Testing pin hashing...")
    pin = "123456"
    h = security.hash_pin(pin)
    assert len(h) == 64
    print(f"PIN hashed successfully: {h}")

def test_is_user_allowed():
    print("Testing allowlist check...")
    os.environ["TELEGRAM_ALLOWLIST_USER_IDS"] = "12345,67890"
    assert security.is_user_allowed(12345) == True
    assert security.is_user_allowed(67890) == True
    assert security.is_user_allowed(99999) == False
    print("Allowlist checks passed!")

def test_is_user_admin():
    print("Testing admin check...")
    os.environ["TELEGRAM_ADMIN_USER_IDS"] = "12345"
    assert security.is_user_admin(12345) == True
    assert security.is_user_admin(67890) == False
    print("Admin checks passed!")

def test_verify_admin_pin():
    print("Testing verify PIN...")
    os.environ["TELEGRAM_ADMIN_PIN"] = "123456"
    assert security.verify_admin_pin(12345, "123456") == True
    assert security.verify_admin_pin(12345, "wrong") == False
    print("PIN verification passed!")

if __name__ == "__main__":
    test_hash_pin()
    test_is_user_allowed()
    test_is_user_admin()
    test_verify_admin_pin()
    print("All security module unit tests passed!")
