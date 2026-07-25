import base64
import os

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from dotenv import load_dotenv

load_dotenv()

key_hex = os.getenv("TOKEN_ENCRYPTION_KEY")

if not key_hex:
    raise RuntimeError("TOKEN_ENCRYPTION_KEY not found.")

KEY = bytes.fromhex(key_hex)

if len(KEY) != 32:
    raise RuntimeError(
        "TOKEN_ENCRYPTION_KEY must be a 64-character hex string."
    )


def decrypt(cipher_text: str | None) -> str | None:
    """
    Decrypts a refresh token produced by the Express backend.

    Payload format (base64):
        IV (16 bytes)
        Authentication Tag (16 bytes)
        Ciphertext (remaining bytes)
    """

    if not cipher_text:
        return None

    data = base64.b64decode(cipher_text)

    iv = data[:16]
    auth_tag = data[16:32]
    ciphertext = data[32:]

    decryptor = (
        Cipher(
            algorithms.AES(KEY),
            modes.GCM(iv, auth_tag),
        )
        .decryptor()
    )

    plaintext = decryptor.update(ciphertext) + decryptor.finalize()

    return plaintext.decode("utf-8")