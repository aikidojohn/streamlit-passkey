import base64
import json
import secrets
import streamlit as st

from webauthn import generate_registration_options, options_to_json, verify_registration_response, \
    generate_authentication_options, verify_authentication_response
from webauthn.helpers.cose import COSEAlgorithmIdentifier


def generate_passkey_registration(email: str) -> str:
    code = secrets.token_bytes(16)
    st.session_state["passkey_challenge"] = base64.urlsafe_b64encode(code)
    registration_options = generate_registration_options(
        rp_id="localhost",
        rp_name="GetCatch Admin",
        user_id=email.encode("utf-8"),
        user_name=email,
        user_display_name=email,
        challenge=code,
        supported_pub_key_algs=[
            COSEAlgorithmIdentifier.EDDSA,
            COSEAlgorithmIdentifier.ECDSA_SHA_256,
            COSEAlgorithmIdentifier.RSASSA_PKCS1_v1_5_SHA_256
        ],
    )
    return options_to_json(registration_options)


def verify_passkey_registration(credential: dict) -> dict:
    code = st.session_state.get("passkey_challenge")
    if not code:
        return {}

    code_bytes = base64.urlsafe_b64decode(code)
    reg = verify_registration_response(
        credential=credential,
        expected_origin="https://localhost:8501",
        expected_rp_id="localhost",
        expected_challenge=code_bytes
    )
    print(reg)
    print(reg.__dict__)
    credential_id = base64.urlsafe_b64encode(reg.credential_id).decode("utf-8")
    return {
            "credential_id": credential_id,
            "public_key": base64.urlsafe_b64encode(reg.credential_public_key).decode("utf-8"),
            "sign_count": reg.sign_count
        }

def generate_passkey_authentication(email: str = None) -> tuple[str, str]:
    code = secrets.token_bytes(16)
    auth_id = email if email else secrets.token_urlsafe(16)
    st.session_state["passkey_challenge"] = base64.urlsafe_b64encode(code)
    auth_options = generate_authentication_options(
        rp_id="localhost",
        challenge=code,
        timeout=12000,
        # allow_credentials=[PublicKeyCredentialDescriptor(id=b"1234567890")],
    )
    return auth_id, options_to_json(auth_options)


def verify_passkey_authentication(credential: dict, public_key: dict) -> int:
    code = st.session_state.get("passkey_challenge")
    if not code:
        return -1
    code_bytes = base64.urlsafe_b64decode(code)

    credential_id = credential.get("id", None)
    if not credential_id:
        return -1

    if credential_id != public_key["credential_id"]:
        return -1

    auth = verify_authentication_response(
        credential=credential,
        credential_public_key=base64.urlsafe_b64decode(public_key["public_key"]),
        expected_challenge=code_bytes,
        expected_rp_id="localhost",
        expected_origin="https://localhost:8501",
        credential_current_sign_count=public_key.get("sign_count", 0)
    )
    print(auth)
    print(auth.__dict__)

    return auth.new_sign_count